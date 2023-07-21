//@ts-nocheck
import dgram from 'react-native-udp';
import { DialWithOptions } from 'react-native-kcp';

const host = '10.104.15.237';
const port = 3333;
const conv = 255;

export const kcpClient = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const socket = DialWithOptions(
        {
            conv: conv,
            host: host,
            port: port,
        },
        socketInstance,
    );

    socket.on('recv', (buff: Buffer) => {
        console.log('[RECEIVED KCP MESSAGE]:', buff.toString());
    });

    setInterval(() => {
        const msg = Buffer.from(new Date().toISOString());
        console.log(`[SENDING KCP MESSAGE]: ${msg.toString()}`);
        console.log('[DESTINATION]:', `${socket.host}:${socket.port}`);
        socket.write(msg);
    }, 5000);
};
