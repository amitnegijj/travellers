import * as profileRepository from "../repositories/profileRepository.js";
import { AppError } from "../utils/AppError.js";

export async function getProfile(handle, viewerId) {
  const profile = await profileRepository.findByHandle(handle, viewerId);
  if (!profile) throw new AppError("not_found", "No such profile");
  return profile;
}

/** A profile is editable only by the person it belongs to. */
export async function updateProfile(user, handle, input) {
  if (user.handle.toLowerCase() !== handle.toLowerCase()) {
    throw new AppError("forbidden", "You can only edit your own profile");
  }
  return profileRepository.update(user.id, input);
}

export function assertOwnHandle(user, handle, message) {
  if (user.handle.toLowerCase() !== handle.toLowerCase()) {
    throw new AppError("forbidden", message);
  }
}
