import { DialWithOptions } from '../src/session';
import { AesBlock } from '../src/crypt';
import { log, host, port, conv, algorithm, key, iv } from './common';

let block;
if (algorithm && key && iv) {
    block = new AesBlock(algorithm, key, iv);
}

// client
const session = DialWithOptions({
    conv,
    port,
    host,
    block,
});
session.on('recv', (buff: Buffer) => {
    log('recv:', buff.toString());
});
setInterval(() => {
    const msg = Buffer.from(new Date().toISOString());
    log(`send: ${msg}`);
    session.write(msg);
}, 1000);
