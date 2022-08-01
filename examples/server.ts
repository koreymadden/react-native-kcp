import { ListenWithOptions } from '../src/session';
import { AesBlock } from '../src/crypt';
import { port, algorithm, key, iv } from './common';

let block;
if (algorithm && key && iv) {
    block = new AesBlock(algorithm, key, iv);
}

// server
const listener = ListenWithOptions({
    port,
    block,
    callback: (session) => {
        // accept new session
        session.on('recv', (buff: Buffer) => {
            session.write(buff);
        });
    },
});
