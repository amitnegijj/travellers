import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";
import { withQuery } from "./journeyApi.js";

export const listDestinations = (params = {}, signal) =>
  api.get(withQuery(ENDPOINTS.destinations.list, params), signal);

export const getDestination = (slug, signal) =>
  api.get(ENDPOINTS.destinations.bySlug(slug), signal);
