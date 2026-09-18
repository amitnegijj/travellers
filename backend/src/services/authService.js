import * as profileRepository from "../repositories/profileRepository.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

/**
 * Verifies credentials and returns the identity to put in the session.
 * Both failure modes report the same message — the API must not reveal
 * which email addresses are registered.
 */
export async function login({ email, password }) {
  const invalid = new AppError("unauthorized", "Email or password is incorrect");

  const user = await profileRepository.findUserByEmail(email);
  if (!user) throw invalid;
  if (!(await verifyPassword(password, user.password_hash))) throw invalid;

  return {
    userId: user.id,
    profile: await profileRepository.findIdentityById(user.id),
  };
}

export async function signup(input) {
  if (await profileRepository.emailExists(input.email)) {
    throw new AppError("conflict", "That email is already registered");
  }
  if (await profileRepository.handleExists(input.handle)) {
    throw new AppError("conflict", "That handle is taken");
  }

  const userId = await profileRepository.createUserWithProfile({
    email: input.email,
    passwordHash: await hashPassword(input.password),
    handle: input.handle,
    displayName: input.displayName,
  });

  return { userId, handle: input.handle };
}
