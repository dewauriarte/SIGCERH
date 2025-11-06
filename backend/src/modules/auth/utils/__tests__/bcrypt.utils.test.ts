/**
 * Tests unitarios para utilidades de bcrypt
 */

import { hashPassword, comparePassword } from '../bcrypt.utils';

describe('bcrypt.utils', () => {
  describe('hashPassword', () => {
    it('debe hashear una contraseña correctamente', async () => {
      const password = 'miPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('debe generar hashes diferentes para la misma contraseña', async () => {
      const password = 'miPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('debe hashear contraseñas con caracteres especiales', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it('debe hashear contraseñas largas', async () => {
      const password = 'a'.repeat(100);
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });
  });

  describe('comparePassword', () => {
    it('debe retornar true cuando la contraseña coincide', async () => {
      const password = 'miPassword123!';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('debe retornar false cuando la contraseña no coincide', async () => {
      const password = 'miPassword123!';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('debe ser case-sensitive', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);
      const result = await comparePassword('password123', hash);

      expect(result).toBe(false);
    });

    it('debe validar correctamente contraseñas con espacios', async () => {
      const password = '  password with spaces  ';
      const hash = await hashPassword(password);
      const result1 = await comparePassword(password, hash);
      const result2 = await comparePassword('password with spaces', hash);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Integración hashPassword y comparePassword', () => {
    const testPasswords = [
      'simple123',
      'C0mpl3x!P@ssw0rd',
      '12345678',
      'español_ñáéíóú',
      '    espacios    ',
    ];

    testPasswords.forEach((password) => {
      it(`debe hashear y validar correctamente: "${password}"`, async () => {
        const hash = await hashPassword(password);
        const isValid = await comparePassword(password, hash);
        const isInvalid = await comparePassword(password + 'x', hash);

        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });
    });
  });
});
