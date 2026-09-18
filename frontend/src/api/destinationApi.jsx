import { ENDPOINTS } from "../constants/endpoints.jsx";
import { api } from "./client.jsx";
import { withQuery } from "./query.jsx";

export const listDestinations = (params = {}, signal) =>
  api.get(withQuery(ENDPOINTS.destinations.list, params), signal);

export const getDestination = (slug, signal) =>
  api.get(ENDPOINTS.destinations.bySlug(slug), signal);
