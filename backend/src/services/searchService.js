// Cross-entity search for the Explore page.
import * as searchRepository from "../repositories/searchRepository.js";
import { listJourneys } from "./journeyService.js";

const EMPTY = { destinations: [], places: [], profiles: [] };

export async function searchEntities(rawTerm) {
  const term = (rawTerm ?? "").trim();
  if (!term) return EMPTY;

  const [destinations, places, profiles] = await Promise.all([
    searchRepository.searchDestinations(term),
    searchRepository.searchPlaces(term),
    searchRepository.searchProfiles(term),
  ]);

  return { destinations, places, profiles };
}

/** Entities and matching journeys, which is what the Explore page renders. */
export async function searchEverything(rawTerm, viewerId) {
  const term = (rawTerm ?? "").trim();

  const [entities, journeys] = await Promise.all([
    searchEntities(term),
    term ? listJourneys({ viewerId, q: term, limit: 8 }) : Promise.resolve({ items: [] }),
  ]);

  return { ...entities, journeys: journeys.items };
}
