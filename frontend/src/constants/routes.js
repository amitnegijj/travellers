// Client-side route paths, so a link is never a loose string.
export const ROUTES = {
  home: "/",
  explore: "/explore",
  map: "/map",
  saved: "/saved",
  settings: "/settings",
  login: "/login",
  signup: "/signup",
  journeyNew: "/journeys/new",
  journeysMine: "/journeys/mine",
  journey: (id) => `/journeys/${id}`,
  journeyEdit: (id) => `/journeys/${id}/edit`,
  destination: (slug) => `/destinations/${slug}`,
  profile: (handle) => `/profile/${handle}`,
};
