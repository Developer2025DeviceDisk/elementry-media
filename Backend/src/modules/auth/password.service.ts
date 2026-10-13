import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
}

@Injectable()
export class PasswordService {
  async hash(password: string) {
    const salt = randomBytes(16).toString('hex');
    return `scrypt-v1$${salt}$${(await derive(password, salt)).toString('hex')}`;
  }
  async verify(password: string, encoded: string) {
    const [version, salt, hash] = encoded.split('$');
    if (version !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(hash ?? '')) return false;
    return timingSafeEqual(await derive(password, salt), Buffer.from(hash, 'hex'));
  }
  async dummyVerify(password: string) {
    await derive(password, '00000000000000000000000000000000');
  }
}
