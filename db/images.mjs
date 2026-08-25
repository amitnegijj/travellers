// Seed imagery. Remote CDN URLs keep the repo small; the UI degrades to a
// gradient placeholder when a photo fails to load or you're offline.
const U = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

// Himalayan / north-India travel scenes.
const POOL = [
  "1626621341517-bbf3d9990a23", // himalayan valley
  "1516302752625-fcc3c50ae61f", // himalayan village
  "1544735716-392fe2489ffa",    // forest road
  "1590779033100-9f60a05a013d", // valley town
  "1571536802807-30451e3955d8", // mountain road
  "1506905925346-21bda4d32df4", // alpine lake
  "1464822759023-fed622ff2c3b", // peaks
  "1519681393784-d120267933ba", // night mountains
  "1454391304352-2bf4678b1a7a", // river valley
  "1470071459604-3b5ec3a7fe05", // misty forest
  "1501785888041-af3ef285b470", // lake reflection
  "1444723121867-7a241cacace9", // sunrise ridge
  "1483728642387-6c3bdd6c93e5", // green hills
  "1439853949127-fa647821eba0", // coastal cliff
  "1493246507139-91e8fad9978e", // river bend
  "1486870591958-9b9d0d1dda99", // forest trail
  "1508739773434-c26b3d09e071", // snow peaks
  "1476514525535-07fb3b4ae5f1", // winding road
];

export const destinationCover = (i) => U(POOL[i % POOL.length], 1200);
export const journeyCover = (i) => U(POOL[(i * 3 + 5) % POOL.length], 1400);
export const journeyPhoto = (i) => U(POOL[(i * 5 + 2) % POOL.length], 1000);
export const placePhoto = (i) => U(POOL[(i * 7 + 1) % POOL.length], 600);

// Deterministic avatars — no extra dependency, no network needed.
export const avatar = (seed) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
