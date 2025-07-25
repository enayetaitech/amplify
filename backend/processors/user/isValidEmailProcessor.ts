export const isValidEmail = (email: string): boolean => {
  // This regex pattern checks for a basic email format.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
