import * as crypto from 'react-native-crypto';

// The length n of the initial vector iv must be between 7 and 13 (n is greater than or equal to 7, n is less than or equal to 13)

// The length of the plaintext is at most 2 ^ ( 8 * (15 - n)) bytes
// Minimum: When the iv length is 13, the maximum plaintext length is 65535 bytes
// Maximum: When the iv length is 7, the maximum plaintext length is 18446744073709551616 bytes

export interface CryptBlock {
    encrypt: (plainData: Buffer) => Buffer;
    decrypt: (encryptData: Buffer) => Buffer;
}

export class AesBlock implements CryptBlock {
    authTagLength: number;

    constructor(
        private readonly algorithm: crypto.CipherGCMTypes,
        private readonly key: crypto.CipherKey,
        private readonly iv: crypto.BinaryLike,
    ) {
        this.algorithm = algorithm;
        this.key = key;
        this.iv = iv;
        this.authTagLength = 16;
    }

    encrypt(data: Buffer) {
        const opts: crypto.CipherGCMOptions = { authTagLength: this.authTagLength };
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv, opts);
        return Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
    }

    decrypt(data: Buffer) {
        const authTag = data.slice(data.byteLength - this.authTagLength);
        const encryptedData = data.slice(0, data.byteLength - this.authTagLength);
        const opts: crypto.CipherGCMOptions = { authTagLength: this.authTagLength };
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv, opts);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    }
}
