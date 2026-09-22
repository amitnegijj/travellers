// A traveller's personal map.
//
// Privacy rule: a private pin is returned only to its owner. The filter is
// applied in SQL by the repository, and every read here passes an explicit
// viewer so it can never be forgotten.
import * as profileRepository from "../repositories/profileRepository.js";
import * as userPlaceRepository from "../repositories/userPlaceRepository.js";
import { AppError } from "../utils/AppError.js";

export async function listUserPlaces(handle, viewerId) {
  const owner = await profileRepository.findIdByHandle(handle);
  if (!owner) throw new AppError("not_found", "No such profile");

  const isOwner = viewerId != null && viewerId === owner.id;
  const items = await userPlaceRepository.listForOwner(owner.id, isOwner);

  return { items, isOwner, ownerId: owner.id };
}

/** Pins plus the destinations the traveller actually reached on published journeys. */
export async function getTravelMap(handle, viewerId) {
  const [{ items, isOwner }, reached] = await Promise.all([
    listUserPlaces(handle, viewerId),
    userPlaceRepository.listJourneyPlaces(handle),
  ]);

  return { items, isOwner, reached };
}

export async function createUserPlace(profileId, input) {
  return userPlaceRepository.insert(profileId, input);
}

async function assertOwner(placeId, requesterId) {
  const row = await userPlaceRepository.findOwnerId(placeId);
  if (!row) throw new AppError("not_found", "No such place");
  if (row.profile_id !== requesterId) {
    throw new AppError("forbidden", "That pin belongs to someone else");
  }
}

export async function updateUserPlace(placeId, requesterId, patch) {
  await assertOwner(placeId, requesterId);
  return userPlaceRepository.update(placeId, patch);
}

export async function deleteUserPlace(placeId, requesterId) {
  await assertOwner(placeId, requesterId);
  await userPlaceRepository.remove(placeId);
}
