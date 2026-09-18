// The home screen's side panels. Each is a small, independent aggregate.
import * as homeRepository from "../repositories/homeRepository.js";

export async function getRail() {
  const [topDestinations, topTravellers, cheapest] = await Promise.all([
    homeRepository.findTopDestinations(4),
    homeRepository.findTopTravellers(4),
    homeRepository.findCheapestJourneys(3),
  ]);
  return { topDestinations, topTravellers, cheapest };
}

export async function getStories() {
  return { items: await homeRepository.findStories(24) };
}

export async function getDestinationsStrip() {
  return { items: await homeRepository.findTopDestinations(8) };
}

export async function getCommunityStrip() {
  return { items: await homeRepository.findCommunityStrip(8) };
}
