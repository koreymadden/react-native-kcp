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
            conv,
            host,
            port,
        },
        socketInstance,
    );

    socket.on('recv', (buff: Buffer) => {
        console.debug('[RECEIVED KCP MESSAGE]:', buff.toString());
    });

    setInterval(() => {
        const msg = Buffer.from(new Date().toISOString());
        console.debug(`[SENDING MESSAGE]: ${msg.toString()}`);
        console.debug('[DESTINATION]:', `${socket.host}:${socket.port}`);
        socket.write(msg);
    }, 5000);
};
