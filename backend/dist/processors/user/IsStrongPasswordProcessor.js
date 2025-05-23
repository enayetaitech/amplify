"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStrongPassword = void 0;
const isStrongPassword = (password) => {
    const minLength = 9;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    return (password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar);
};
exports.isStrongPassword = isStrongPassword;
