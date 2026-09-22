// Destinations and the places inside them. Curated and seeded in Phase 1 —
// there is no user-created destination path.
import * as destinationRepository from "../repositories/destinationRepository.js";
import { AppError } from "../utils/AppError.js";

const DEFAULT_RADIUS_M = 150_000;

export async function listDestinations({ q, limit = 60 } = {}) {
  return destinationRepository.findAll({ search: q, limit });
}

export async function getDestination(slug) {
  const destination = await destinationRepository.findBySlug(slug);
  if (!destination) throw new AppError("not_found", "No such destination");

  const places = await destinationRepository.findPlacesByDestinationId(destination.id);
  return { ...destination, places };
}

export async function nearbyDestinations(lng, lat, radiusM = DEFAULT_RADIUS_M) {
  return destinationRepository.findNearby(lng, lat, radiusM);
}

export async function listCategories() {
  return destinationRepository.findCategories();
}

/** Everything with coordinates, for the map page. */
export async function mapFeatures() {
  const [destinations, places] = await Promise.all([
    destinationRepository.findAllForMap(),
    destinationRepository.findPlacesForMap(),
  ]);
  return { destinations, places };
}
