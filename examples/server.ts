//@ts-nocheck
import dgram from 'react-native-udp';
import { Listen } from 'react-native-kcp';

export const kcpServer = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const listener = Listen(socketInstance, (session) => {
        session.on('recv', (buff: Buffer) => {
            const messageFromClient = buff.toString();
            console.debug('[MESSAGE RECEIVED FROM CLIENT]:', messageFromClient);
            console.debug('[SENDING MESSAGE BACK]');
            session.write(Buffer.from(`[GREETINGS FROM HOST]: ${messageFromClient}`));
        });
    });
};
