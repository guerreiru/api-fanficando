import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('hashes and verifies a password', async () => {
    const hash = await passwords.hash('SenhaForte1');
    expect(hash).not.toContain('SenhaForte1');
    await expect(passwords.verify('SenhaForte1', hash)).resolves.toBe(true);
    await expect(passwords.verify('outra-senha', hash)).resolves.toBe(false);
  });

  it('still runs a comparison when the user does not exist', async () => {
    await expect(passwords.verify('qualquer', null)).resolves.toBe(false);
  });
});
