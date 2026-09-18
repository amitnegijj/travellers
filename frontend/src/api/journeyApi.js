import { ENDPOINTS } from "../constants/endpoints.js";
import { api } from "./client.js";
import { withQuery } from "./query.js";

export const listJourneys = (params = {}, signal) =>
  api.get(withQuery(ENDPOINTS.journeys.list, params), signal);

export const listMyJourneys = (signal) => api.get(ENDPOINTS.journeys.mine, signal);

export const getJourney = (id, signal) => api.get(ENDPOINTS.journeys.byId(id), signal);

export const getJourneyForEdit = (id, signal) => api.get(ENDPOINTS.journeys.edit(id), signal);

export const createJourney = (input) => api.post(ENDPOINTS.journeys.create, input);

export const updateJourney = (id, patch) => api.patch(ENDPOINTS.journeys.byId(id), patch);

export const deleteJourney = (id) => api.delete(ENDPOINTS.journeys.byId(id));

export const listTrails = (params = {}, signal) =>
  api.get(withQuery(ENDPOINTS.trails, params), signal);
