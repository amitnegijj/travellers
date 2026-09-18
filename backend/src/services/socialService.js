// Follow, like, save and comment.
//
// Every counter this touches is maintained by a database trigger, so the
// pattern is always: check it exists, toggle the row, read the counter back.
import * as journeyRepository from "../repositories/journeyRepository.js";
import * as profileRepository from "../repositories/profileRepository.js";
import * as socialRepository from "../repositories/socialRepository.js";
import { AppError } from "../utils/AppError.js";

export async function toggleFollow(followerId, handle) {
  const target = await profileRepository.findIdByHandle(handle);
  if (!target) throw new AppError("not_found", "No such profile");
  if (target.id === followerId) throw new AppError("validation", "You cannot follow yourself");

  const existing = await socialRepository.findFollow(followerId, target.id);

  if (existing) await socialRepository.deleteFollow(followerId, target.id);
  else await socialRepository.insertFollow(followerId, target.id);

  return {
    following: !existing,
    followerCount: await socialRepository.countFollowers(target.id),
  };
}

/** Likes and saves are the same shape over two tables. */
async function toggleJoin(table, profileId, journeyId) {
  const journey = await journeyRepository.existsById(journeyId);
  if (!journey) throw new AppError("not_found", "No such journey");

  const existing = await socialRepository.findJoin(table, profileId, journeyId);

  if (existing) await socialRepository.deleteJoin(table, profileId, journeyId);
  else await socialRepository.insertJoin(table, profileId, journeyId);

  return {
    active: !existing,
    count: await socialRepository.readJoinCount(table, journeyId),
  };
}

export const toggleLike = (profileId, journeyId) => toggleJoin("likes", profileId, journeyId);
export const toggleSave = (profileId, journeyId) => toggleJoin("saves", profileId, journeyId);

export async function listComments(journeyId) {
  return socialRepository.listComments(journeyId);
}

export async function addComment(authorId, journeyId, body) {
  const journey = await journeyRepository.existsById(journeyId);
  if (!journey) throw new AppError("not_found", "No such journey");

  return socialRepository.insertComment(authorId, journeyId, body.trim());
}

export async function deleteComment(commentId, requesterId) {
  const comment = await socialRepository.findCommentOwnership(commentId);
  if (!comment) throw new AppError("not_found", "No such comment");

  // Comment author or journey owner may remove it.
  if (comment.author_id !== requesterId && comment.journey_author !== requesterId) {
    throw new AppError("forbidden", "Not your comment");
  }

  await socialRepository.softDeleteComment(commentId);
}

export async function listFollowers(handle, direction) {
  return socialRepository.listFollowDirection(handle, direction);
}
