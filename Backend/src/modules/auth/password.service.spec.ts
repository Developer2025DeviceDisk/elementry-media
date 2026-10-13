import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();
  it('salts hashes and verifies correct passwords only', async () => {
    const first = await service.hash('a sufficiently long password');
    const second = await service.hash('a sufficiently long password');
    expect(first).not.toBe(second);
    expect(await service.verify('a sufficiently long password', first)).toBe(true);
    expect(await service.verify('wrong password', first)).toBe(false);
    expect(await service.verify('any', 'corrupted')).toBe(false);
  });
});
