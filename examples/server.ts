//@ts-nocheck
import dgram from 'react-native-udp';
import { ListenWithOptions } from 'react-native-kcp';

const port = 3333;

export const kcpServer = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const listener = ListenWithOptions(
        {
            port,
            callback: (session) => {
                console.log('callback here');
                session.on('recv', (buff: Buffer) => {
                    console.log('[MESSAGE RECEIVED FROM CLIENT]:', buff.toString());
                    console.log('[SENDING MESSAGE BACK]:', `[GREETINGS FROM HOST]: ${buff.toString()}`);
                    session.write(buff);
                });
            },
        },
        socketInstance,
    );
};
