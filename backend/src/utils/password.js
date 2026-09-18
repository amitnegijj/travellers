import bcrypt from "bcryptjs";
import { PASSWORD_SALT_ROUNDS } from "../config/constants.js";

export const hashPassword = (plain) => bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
