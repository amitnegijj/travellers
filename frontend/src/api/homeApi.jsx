import { ENDPOINTS } from "../constants/endpoints.jsx";
import { api } from "./client.jsx";

export const getRail = (signal) => api.get(ENDPOINTS.home.rail, signal);
export const getStories = (signal) => api.get(ENDPOINTS.home.stories, signal);
export const getDestinationsStrip = (signal) => api.get(ENDPOINTS.home.destinationsStrip, signal);
export const getCommunityStrip = (signal) => api.get(ENDPOINTS.home.communityStrip, signal);
