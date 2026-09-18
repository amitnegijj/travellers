// Every API path the client knows about. Nothing else in the app writes a
// URL string, so the version prefix is one edit away from changing.
const V1 = "/api/v1";

export const ENDPOINTS = {
  auth: {
    login: `${V1}/auth/login`,
    signup: `${V1}/auth/signup`,
    logout: `${V1}/auth/logout`,
    me: `${V1}/auth/me`,
  },
  journeys: {
    list: `${V1}/journeys`,
    create: `${V1}/journeys`,
    mine: `${V1}/journeys/mine`,
    byId: (id) => `${V1}/journeys/${id}`,
    edit: (id) => `${V1}/journeys/${id}/edit`,
    like: (id) => `${V1}/journeys/${id}/like`,
    save: (id) => `${V1}/journeys/${id}/save`,
    comments: (id) => `${V1}/journeys/${id}/comments`,
  },
  trails: `${V1}/trails`,
  destinations: {
    list: `${V1}/destinations`,
    bySlug: (slug) => `${V1}/destinations/${slug}`,
  },
  profiles: {
    byHandle: (handle) => `${V1}/profiles/${handle}`,
    follow: (handle) => `${V1}/profiles/${handle}/follow`,
    places: (handle) => `${V1}/profiles/${handle}/places`,
  },
  userPlaces: {
    byId: (id) => `${V1}/user-places/${id}`,
  },
  comments: {
    byId: (id) => `${V1}/comments/${id}`,
  },
  search: `${V1}/search`,
  map: `${V1}/map`,
  media: `${V1}/media`,
  home: {
    rail: `${V1}/home/rail`,
    stories: `${V1}/home/stories`,
    destinationsStrip: `${V1}/home/destinations-strip`,
    communityStrip: `${V1}/home/community-strip`,
  },
};
