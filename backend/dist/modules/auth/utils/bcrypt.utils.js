import bcrypt from 'bcrypt';
import { config } from '@config/env';
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(config.security.bcrypt.rounds);
    return bcrypt.hash(password, salt);
};
export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
export const generateRandomPassword = (length = 12) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const all = uppercase + lowercase + numbers + symbols;
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
};
//# sourceMappingURL=bcrypt.utils.js.map