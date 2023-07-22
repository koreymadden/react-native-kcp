//@ts-nocheck
import dgram from 'react-native-udp';
import { Dial } from 'react-native-kcp';

export const kcpClient = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const socket = Dial(socketInstance, {
        conv,
        host,
        port,
    });

    socket.on('recv', (buff: Buffer) => {
        console.debug('[RECEIVED KCP MESSAGE]:', buff.toString());
    });

    setInterval(() => {
        const message = Buffer.from(new Date().toISOString());
        console.debug(`[SENDING MESSAGE]: ${message.toString()}`);
        console.debug('[DESTINATION]:', `${socket.host}:${socket.port}`);
        socket.write(message);
    }, 5000);
};
