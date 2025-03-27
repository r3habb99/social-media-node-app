import bcrypt from 'bcryptjs';


/**
 * Hashes a plain password using bcrypt.
 * @param password - The plain password to hash.
 * @returns The hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

/**
 * Compares a plain password with a hashed password.
 * @param password - The plain password.
 * @param hashedPassword - The hashed password to compare against.
 * @returns True if the passwords match, otherwise false.
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing password');
  }
};


