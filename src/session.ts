import { RemoteInfo } from 'dgram';
import EventEmitter = require('events');
import { fecHeaderSizePlus2, typeData, typeParity, mtuLimit } from './common';
import { IKCP_OVERHEAD, IKCP_SN_OFFSET, Kcp } from './kcp';
import UdpSocket from 'react-native-udp/lib/types/UdpSocket';

global.Buffer = require('buffer').Buffer;

function addrToString(host: string, port: number): string;
function addrToString(rinfo: RemoteInfo): string;
function addrToString(arg1: RemoteInfo | string, arg2?: number): string {
    if (typeof arg1 === 'string') {
        return `${arg1}:${arg2}`;
    } else {
        return `${arg1.address}:${arg1.port}`;
    }
}

export class Listener {
    conn: UdpSocket; // the underlying packet connection
    ownConn: boolean; // true if we created conn internally, false if provided by caller

    sessions: { [key: string]: UDPSession }; // all sessions accepted by this Listener

    callback: ListenCallback;

    // packet input stage
    private packetInput(data: Buffer, rinfo: RemoteInfo) {
        const key = addrToString(rinfo);
        if (data.byteLength >= IKCP_OVERHEAD) {
            let sess = this.sessions[key];
            let conv = 0;
            let sn = 0;
            let convRecovered = false;

            const fecFlag = data.readUInt16LE(4);
            if (fecFlag == typeData || fecFlag == typeParity) {
                // 16 bit kcp cmd [81-84] and frg [0-255] will not overlap with FEC type 0x00f1 0x00f2
                // packet with FEC
                if (fecFlag == typeData && data.byteLength >= fecHeaderSizePlus2 + IKCP_OVERHEAD) {
                    conv = data.readUInt32LE(fecHeaderSizePlus2);
                    sn = data.readUInt32LE(fecHeaderSizePlus2 + IKCP_SN_OFFSET);
                    convRecovered = true;
                }
            } else {
                // packet without FEC
                conv = data.readUInt32LE();
                sn = data.readUInt32LE(IKCP_SN_OFFSET);
                convRecovered = true;
            }

            if (sess) {
                // existing connection
                if (!convRecovered || conv == sess.kcp.conv) {
                    // parity data or valid conversation
                    sess.kcpInput(data);
                } else if (sn == 0) {
                    // should replace current connection
                    sess.close();
                    sess = undefined;
                }
            }

            if (!sess && convRecovered) {
                // new session
                sess = newUDPSession({
                    conv,
                    port: rinfo.port,
                    host: rinfo.address,
                    listener: this,
                    conn: this.conn,
                    ownConn: false,
                });
                sess.key = key;
                this.sessions[key] = sess;
                this.callback(sess);
                sess.kcpInput(data);
            }
        }
    }

    // stop UDP listening, close socket
    close(): any {
        if (this.ownConn) {
            this.conn.close();
        }
    }

    closeSession(key: string): boolean {
        if (this.sessions[key]) {
            delete this.sessions[key];
            return true;
        }
        return false;
    }

    monitor() {
        this.conn.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
            this.packetInput(msg, rinfo);
        });
    }
}

export class UDPSession extends EventEmitter {
    key: string;
    conn: UdpSocket; // the underlying packet connection
    ownConn: boolean; // true if we created conn internally, false if provided by caller
    kcp: Kcp; // KCP ARQ protocol
    listener: Listener; // pointing to the Listener object if it's been accepted by a Listener

    // kcp receiving is based on packets
    // recvbuf turns packets into stream
    recvbuf: Buffer;
    bufptr: Buffer;

    // settings
    port: number;
    host: string;

    headerSize: number; // the header size additional to a KCP frame
    ackNoDelay: boolean; // send ack immediately for each incoming packet(testing purpose)
    writeDelay: boolean; // delay kcp.flush() for Write() for bulk transfer

    constructor() {
        super();
        this.ownConn = false;

        // kcp receiving is based on packets
        // recvbuf turns packets into stream
        this.recvbuf = Buffer.alloc(1);
        this.bufptr = Buffer.alloc(1);

        // settings
        this.port = 0;

        this.headerSize = 0; // the header size additional to a KCP frame
        this.ackNoDelay = false; // send ack immediately for each incoming packet(testing purpose)
        this.writeDelay = false; // delay kcp.flush() for Write() for bulk transfer
    }

    // write implements net.Conn
    write(b: Buffer): number {
        return this.writeBuffers([b]);
    }

    // writeBuffers write a vector of byte slices to the underlying connection
    writeBuffers(v: Buffer[]): number {
        let n = 0;
        for (const b of v) {
            n += b.byteLength;
            this.kcp.send(b);
        }
        return n;
    }

    // close closes the connection
    close() {
        // try best to send all queued messages
        this.kcp.flush(false);
        // release pending segments
        this.kcp.release();

        if (this.listener) {
            this.listener.closeSession(this.key);
        } else if (this.ownConn) {
            this.conn.close();
        }
    }

    // setWriteDelay delays write for bulk transfer until the next update interval
    setWriteDelay(delay: boolean) {
        this.writeDelay = delay;
    }

    // setWindowSize set maximum window size
    setWindowSize(sndwnd: number, rcvwnd: number) {
        this.kcp.setWndSize(sndwnd, rcvwnd);
    }

    // setMtu sets the maximum transmission unit (not including UDP header)
    setMtu(mtu: number): boolean {
        if (mtu > mtuLimit) {
            return false;
        }

        this.kcp.setMtu(mtu);
        return true;
    }

    // setStreamMode toggles the stream mode on / off
    setStreamMode(enable: boolean) {
        if (enable) {
            this.kcp.stream = 1;
        } else {
            this.kcp.stream = 0;
        }
    }

    // setACKNoDelay changes ack flush option, set true to flush ack immediately
    setACKNoDelay(nodelay: boolean) {
        this.ackNoDelay = nodelay;
    }

    // setNoDelay calls nodelay() of kcp
    // https://github.com/skywind3000/kcp/blob/master/README.en.md#protocol-configuration
    setNoDelay(nodelay: number, interval: number, resend: number, nc: number) {
        this.kcp.setNoDelay(nodelay, interval, resend, nc);
    }

    output(buf: Buffer) {
        const doOutput = (buff: Buffer) => {
            // may need to modify this 0 or buff.length
            this.conn.send(buff, 0, buff.length, this.port, this.host);
        };
        doOutput(buf);
    }

    check() {
        if (!this.kcp) {
            return;
        }
        this.kcp.update();
        setTimeout(() => {
            this.check();
        }, this.kcp.check());
    }

    // getConv gets conversation id of a session
    getConv(): number {
        return this.kcp.conv;
    }

    // getRTO gets current rto of the session
    getRTO(): number {
        return this.kcp.rx_rto;
    }

    // getSRTT gets current srtt of the session
    getSRTT(): number {
        return this.kcp.rx_srtt;
    }

    // getRTTVar gets current rtt variance of the session
    getSRTTVar(): number {
        return this.kcp.rx_rttvar;
    }

    // packet input stage
    packetInput(data: Buffer): void {
        if (data.byteLength >= IKCP_OVERHEAD) {
            this.kcpInput(data);
        }
    }

    kcpInput(data: Buffer) {
        this.kcp.input(data, true, this.ackNoDelay);
        let size = this.kcp.peekSize();
        while (size > 0) {
            const buffer = Buffer.alloc(size);
            const len = this.kcp.recv(buffer);
            if (len) {
                this.emit('recv', buffer.slice(0, len));
            }
            size = this.kcp.peekSize(); // check again if more complete messages are available
        }
    }

    readLoop() {
        this.conn.on('message', (msg: Buffer) => {
            this.packetInput(msg);
        });
    }
}

// newUDPSession create a new udp session for client or server
function newUDPSession(args: {
    conv: number;
    port: number;
    host: string;
    listener: Listener;
    conn: any;
    ownConn: boolean;
}): UDPSession {
    const { conv, port, host, listener, conn, ownConn } = args;
    const sess = new UDPSession();
    sess.port = port;
    sess.host = host;
    sess.conn = conn;
    sess.ownConn = ownConn;
    sess.listener = listener;
    sess.recvbuf = Buffer.alloc(mtuLimit);

    sess.kcp = new Kcp(conv, sess);
    sess.kcp.setReserveBytes(sess.headerSize);
    sess.kcp.setOutput((buff, len) => {
        if (len >= IKCP_OVERHEAD + sess.headerSize) {
            sess.output(buff.slice(0, len));
        }
    });

    if (!sess.listener) {
        // this is a client connection
        sess.readLoop();
    }

    sess.check();

    return sess;
}

export type ListenCallback = (session: UDPSession) => void;

export function Listen(nativeSocket: UdpSocket, callback: ListenCallback): Listener {
    // console.debug('[LISTEN OPTIONS]:', opts);
    // console.debug('[NATIVE SOCKET]:', nativeSocket);
    const conn: UdpSocket = nativeSocket;
    conn.on('listening', (err) => {
        if (err) {
            console.error('[ERROR]:', err);
        }
    });
    return serveConn(conn, callback, true);
}

// ServeConn serves KCP protocol for a single packet connection
export function ServeConn(conn: UdpSocket, callback: ListenCallback): Listener {
    return serveConn(conn, callback, false);
}

function serveConn(conn: UdpSocket, callback: ListenCallback, ownConn: boolean): Listener {
    const listener = new Listener();
    listener.conn = conn;
    listener.ownConn = ownConn;
    listener.sessions = {};
    listener.callback = callback;
    listener.monitor();
    return listener;
}

export interface DialOptions {
    conv: number;
    port: number;
    host: string;
}

export function Dial(nativeSocket: UdpSocket, opts: DialOptions): UDPSession {
    const { conv, port, host } = opts;
    // console.debug('[DIAL OPTIONS]:', opts);
    // console.debug('[NATIVE SOCKET]:', nativeSocket);

    // may potentially need to change the ownConn value
    const conn = nativeSocket;
    return newUDPSession({
        conv,
        port,
        host,
        listener: undefined,
        conn,
        ownConn: true,
    });
}
