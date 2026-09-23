import bcrypt from "bcrypt";

export const hashPassword = async (plain, rounds = 10) => {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = async (plain, hashed) =>
  bcrypt.compare(plain, hashed);
