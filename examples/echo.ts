import { ListenWithOptions, DialWithOptions } from '../src/session';
import * as crypto from 'crypto-browserify';
import { AesBlock } from '../src/crypt';
import { log } from './common';

// 连接信息
const host = '127.0.0.1';
const port = 22333;
const conv = 255;

// 加密
const algorithm = 'aes-128-gcm';
const key = crypto.randomBytes(128 / 8);
const iv = crypto.randomBytes(12);

// server
const listener = ListenWithOptions({
    port,
    block: new AesBlock(algorithm, key, iv),
    callback: (session) => {
        // accept new session
        session.on('recv', (buff: Buffer) => {
            session.write(buff);
        });
    },
});

// client
const session = DialWithOptions({
    conv,
    port,
    host,
    block: new AesBlock(algorithm, key, iv),
});
session.on('recv', (buff: Buffer) => {
    log('recv:', buff.toString());
});
setInterval(() => {
    const msg = Buffer.from('hello world,' + new Date().toISOString());
    log(`send: ${msg}`);
    session.write(msg);
}, 1000);
