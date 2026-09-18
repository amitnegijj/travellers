import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";

export const toggleLike = (journeyId) => api.post(ENDPOINTS.journeys.like(journeyId));
export const toggleSave = (journeyId) => api.post(ENDPOINTS.journeys.save(journeyId));
export const toggleFollow = (handle) => api.post(ENDPOINTS.profiles.follow(handle));

export const listComments = (journeyId, signal) =>
  api.get(ENDPOINTS.journeys.comments(journeyId), signal);
export const addComment = (journeyId, body) =>
  api.post(ENDPOINTS.journeys.comments(journeyId), { body });
export const deleteComment = (commentId) => api.delete(ENDPOINTS.comments.byId(commentId));
