// Seed: one corridor, densely. Delhi NCR -> Uttarakhand.
// Density in a single corridor is what makes discovery and (later) Remix work.
// Idempotent: truncates app tables, then reinserts.
import bcrypt from "bcryptjs";
import { avatar, destinationCover, journeyCover, journeyPhoto, placePhoto } from "./images.mjs";
import pg from "pg";
import { connectionConfig } from "./connection.mjs";

const db = new pg.Client(connectionConfig());

const pt = (lng, lat) => `SRID=4326;POINT(${lng} ${lat})`;
const line = (coords) =>
  `SRID=4326;LINESTRING(${coords.map(([lng, lat]) => `${lng} ${lat}`).join(", ")})`;

// --------------------------------------------------------------- reference data

const CATEGORIES = [
  ["viewpoint", "Viewpoint", "mountain"],
  ["temple", "Temple", "landmark"],
  ["cafe", "Cafe", "coffee"],
  ["stay", "Stay", "bed-double"],
  ["adventure", "Adventure", "tent"],
  ["waterfall", "Waterfall", "waves"],
  ["market", "Market", "shopping-bag"],
  ["fuel", "Fuel Stop", "fuel"],
];

const DESTINATIONS = [
  ["gurgaon", "Gurgaon", "Haryana", 77.0266, 28.4595, 217, ["oct", "nov", "feb", "mar"],
   "Millennium City and the usual 4am start line for every Uttarakhand run."],
  ["delhi", "Delhi", "Delhi", 77.2090, 28.6139, 216, ["oct", "nov", "feb", "mar"],
   "Where most northern road trips begin, whether you like it or not."],
  ["meerut", "Meerut", "Uttar Pradesh", 77.7064, 28.9845, 219, ["oct", "nov", "feb"],
   "First real breakfast stop on the NH-58 route. Famous for its parathas."],
  ["haridwar", "Haridwar", "Uttarakhand", 78.1642, 29.9457, 314, ["sep", "oct", "nov", "feb", "mar"],
   "Gateway to the hills. Ganga Aarti at Har Ki Pauri is worth timing your drive around."],
  ["rishikesh", "Rishikesh", "Uttarakhand", 78.2676, 30.0869, 372, ["sep", "oct", "nov", "mar", "apr"],
   "Yoga capital, rafting hub, and the last place with reliable ATMs before the climb."],
  ["devprayag", "Devprayag", "Uttarakhand", 78.5981, 30.1462, 830, ["oct", "nov", "mar", "apr", "may"],
   "The confluence of Bhagirathi and Alaknanda, where the Ganga is technically born."],
  ["srinagar-uk", "Srinagar", "Uttarakhand", 78.7838, 30.2223, 560, ["oct", "nov", "mar", "apr"],
   "University town on the Alaknanda. Good midpoint halt with real hotels."],
  ["rudraprayag", "Rudraprayag", "Uttarakhand", 78.9811, 30.2844, 610, ["oct", "nov", "apr", "may"],
   "Second of the Panch Prayag. The Kedarnath and Badrinath roads split here."],
  ["tehri", "Tehri", "Uttarakhand", 78.4800, 30.3900, 1550, ["oct", "nov", "mar", "apr", "may"],
   "Enormous reservoir, empty roads, and boating that almost nobody books."],
  ["kanatal", "Kanatal", "Uttarakhand", 78.3500, 30.4167, 2590, ["oct", "nov", "dec", "mar", "apr"],
   "Quiet ridge village between Chamba and Dhanaulti. Camping without the Rishikesh crowd."],
  ["mussoorie", "Mussoorie", "Uttarakhand", 78.0644, 30.4598, 2005, ["mar", "apr", "may", "oct", "nov"],
   "Queen of the Hills. Crowded in May, genuinely lovely in November."],
  ["dehradun", "Dehradun", "Uttarakhand", 78.0322, 30.3165, 640, ["oct", "nov", "feb", "mar"],
   "The valley base. Last big city with a proper hospital and service centre."],
  ["chopta", "Chopta", "Uttarakhand", 79.0800, 30.4890, 2680, ["apr", "may", "jun", "oct", "nov"],
   "Mini Switzerland. Base for the Tungnath and Chandrashila trek."],
  ["joshimath", "Joshimath", "Uttarakhand", 79.5645, 30.5550, 1875, ["apr", "may", "oct", "nov"],
   "Junction town for Auli, Valley of Flowers and Badrinath. Check road status before committing."],
  ["auli", "Auli", "Uttarakhand", 79.5670, 30.5290, 2800, ["dec", "jan", "feb", "mar"],
   "India's most accessible ski slope, with a Nanda Devi view that justifies the drive."],
  ["nainital", "Nainital", "Uttarakhand", 79.4542, 29.3919, 2084, ["mar", "apr", "may", "oct"],
   "Kumaon's lake town. A completely different corridor from the Garhwal routes."],
];

const PLACES = [
  ["har-ki-pauri", "Har Ki Pauri", "haridwar", "temple", 78.1706, 29.9457,
   "The main ghat. Evening Ganga Aarti starts around sunset; arrive 45 minutes early for a spot.", 0],
  ["ram-jhula", "Ram Jhula", "rishikesh", "viewpoint", 78.3106, 30.1237,
   "Suspension bridge over the Ganga. Motorcycles cross it, somehow.", 0],
  ["the-beatles-ashram", "Beatles Ashram", "rishikesh", "viewpoint", 78.3010, 30.1090,
   "Abandoned Maharishi ashram covered in murals. Ticketed, worth an hour.", 15000],
  ["freedom-cafe", "Freedom Cafe", "rishikesh", "cafe", 78.3163, 30.1289,
   "River-facing terrace in Tapovan. Slow service, excellent view.", 45000],
  ["ganga-view-camp", "Ganga View Camp", "rishikesh", "stay", 78.3200, 30.1340,
   "Riverside tents. Book direct, not through aggregators.", 180000],
  ["sangam-viewpoint", "Devprayag Sangam", "devprayag", "viewpoint", 78.5983, 30.1459,
   "The confluence itself. Steps go right down to where the two rivers meet — the colour difference is real.", 0],
  ["raghunath-temple", "Raghunath Temple", "devprayag", "temple", 78.5975, 30.1470,
   "Ancient stone temple above the sangam. Steep climb from the road.", 0],
  ["dhari-devi", "Dhari Devi Temple", "srinagar-uk", "temple", 78.8760, 30.2530,
   "Relocated above the reservoir. Riverside setting, quick stop off the highway.", 0],
  ["tehri-lake-boating", "Tehri Lake Boating Point", "tehri", "adventure", 78.4830, 30.3820,
   "Jet ski and boat rides on the reservoir. Bargain the rate; posted prices are optimistic.", 120000],
  ["kanatal-cliff-camp", "Cliff Top Camp", "kanatal", "stay", 78.3480, 30.4180,
   "Ridge-edge tents with a bonfire. Nights drop below freezing in December.", 250000],
  ["surkanda-devi", "Surkanda Devi Trek", "kanatal", "adventure", 78.2870, 30.4090,
   "1.5 km climb from Kaddukhal, or take the ropeway. 360-degree Himalayan view on a clear day.", 0],
  ["kempty-falls", "Kempty Falls", "mussoorie", "waterfall", 78.0180, 30.4830,
   "Famous, crowded, and honestly better from the upper viewing deck than in the water.", 0],
  ["camels-back-road", "Camel's Back Road", "mussoorie", "viewpoint", 78.0700, 30.4600,
   "3 km walking loop with sunset views. No traffic, which is rare up here.", 0],
  ["mall-road-mussoorie", "Mall Road", "mussoorie", "market", 78.0680, 30.4550,
   "The main drag. Parking is the hard part — use the Library end lot.", 0],
  ["tungnath-trek", "Tungnath Temple Trek", "chopta", "adventure", 79.0620, 30.4890,
   "3.5 km paved climb to the world's highest Shiva temple. Continue to Chandrashila for sunrise.", 0],
  ["chopta-meadow-camp", "Chopta Meadow Camp", "chopta", "stay", 79.0790, 30.4870,
   "Basic tents in the bugyal. No network, which is the point.", 150000],
  ["auli-ropeway", "Auli Ropeway", "auli", "adventure", 79.5680, 30.5400,
   "Asia's longest cable car from Joshimath. Runs weather permitting — check the morning of.", 100000],
  ["gurukul-fuel", "IOCL Highway Pump", "haridwar", "fuel", 78.1200, 29.9200,
   "Last reliably 24-hour pump before the ghat road. Fill up here.", 0],
  ["naini-lake", "Naini Lake", "nainital", "viewpoint", 79.4550, 29.3900,
   "Row boats and paddle boats. Early morning is calm and nearly empty.", 60000],
  ["mall-road-nainital", "Mall Road", "nainital", "market", 79.4580, 29.3930,
   "Lakeside promenade, closed to traffic in the evenings.", 0],
];

const USERS = [
  ["arjun@example.com", "arjun_rides", "Arjun Mehta", "Gurgaon, India",
   "Weekend rider. Royal Enfield Himalayan. I log every fuel stop so you don't have to."],
  ["priya@example.com", "priya_travels", "Priya Sharma", "Dehradun, India",
   "Slow traveller, budget notes, and far too many photos of tea stalls."],
  ["dev@example.com", "dev_offroad", "Dev Rawat", "Rishikesh, India",
   "Local guide in Garhwal. Road conditions and landslide updates, mostly."],
];

const PASSWORD = "password123";

// --------------------------------------------------------------------- journeys

const JOURNEYS = [
  {
    author: "arjun_rides",
    title: "Gurgaon to Devprayag — the classic two-day run",
    summary:
      "The route everybody starts with. Left at 4am to beat the Delhi toll queues, breakfast at Meerut, " +
      "and hit Rishikesh by noon. Second day is the good bit — the Alaknanda road up to Devprayag is all curves and no traffic.",
    origin: ["Gurgaon", 77.0266, 28.4595],
    dest: ["Devprayag", 78.5981, 30.1462],
    destSlug: "devprayag",
    route: [[77.0266, 28.4595], [77.2090, 28.6139], [77.7064, 28.9845], [78.1642, 29.9457], [78.2676, 30.0869], [78.5981, 30.1462]],
    distance_m: 320_000, duration_min: 440,
    start: "2026-03-14", end: "2026-03-15",
    style: "road-trip", difficulty: "easy", vehicle: "Royal Enfield Himalayan",
    season: ["oct", "nov", "mar", "apr"],
    stops: [
      ["Meerut", "Paratha breakfast at the highway dhaba. 30 min.", 77.7064, 28.9845, "2026-03-14"],
      ["Haridwar", "Fuel + Har Ki Pauri. Traffic is bad after 5pm — we skipped the Aarti.", 78.1642, 29.9457, "2026-03-14"],
      ["Rishikesh", "Night halt in Tapovan. Cheap, clean, riverside.", 78.2676, 30.0869, "2026-03-14"],
      ["Devprayag", "Sangam in the morning light. Worth the early start.", 78.5981, 30.1462, "2026-03-15"],
    ],
    expenses: [
      ["fuel", "Petrol — full tank + top-up", 145_000, "2026-03-14"],
      ["food", "Breakfast at Meerut", 22_000, "2026-03-14"],
      ["tolls", "NH-334 + NH-58 tolls", 38_000, "2026-03-14"],
      ["stay", "Guesthouse, Tapovan", 90_000, "2026-03-14"],
      ["food", "Dinner + morning chai", 30_000, "2026-03-15"],
    ],
    tips: [
      ["tip", "Leave Gurgaon before 5am. After that the Delhi border toll adds 45 minutes, easily."],
      ["tip", "Fill up at Haridwar. Pumps past Devprayag are unreliable and some don't take cards."],
      ["warning", "The stretch after Byasi has active landslide zones in monsoon. Don't attempt July-September."],
    ],
  },
  {
    author: "priya_travels",
    title: "Four days in Kanatal on a ₹6,000 budget",
    summary:
      "Bus and shared cab the whole way, no private vehicle. Proof that the hills are doable cheap if you're " +
      "willing to be slow about it. Camping at the ridge, day trip to Surkanda Devi.",
    origin: ["Dehradun", 78.0322, 30.3165],
    dest: ["Kanatal", 78.3500, 30.4167],
    destSlug: "kanatal",
    route: [[78.0322, 30.3165], [78.0644, 30.4598], [78.2870, 30.4090], [78.3500, 30.4167]],
    distance_m: 78_000, duration_min: 210,
    start: "2026-02-08", end: "2026-02-11",
    style: "budget", difficulty: "easy", vehicle: "Public transport",
    season: ["oct", "nov", "mar", "apr"],
    stops: [
      ["Dehradun ISBT", "Shared cab to Chamba, ₹250. Leaves when full, so go early.", 78.0322, 30.3165, "2026-02-08"],
      ["Surkanda Devi", "Trekked up from Kaddukhal. Took 50 minutes at a slow pace.", 78.2870, 30.4090, "2026-02-09"],
      ["Kanatal", "Three nights at a ridge camp. Bonfire included, blankets extra.", 78.3500, 30.4167, "2026-02-09"],
    ],
    expenses: [
      ["transport", "Shared cabs both ways", 90_000, "2026-02-08"],
      ["stay", "Camp, 3 nights", 270_000, "2026-02-09"],
      ["food", "All meals, 4 days", 180_000, "2026-02-11"],
      ["activities", "Surkanda ropeway (one way)", 25_000, "2026-02-09"],
    ],
    tips: [
      ["tip", "Shared cabs from Dehradun ISBT to Chamba are ₹250 vs ₹2,500 for a private taxi. Same road."],
      ["tip", "Camps quote per-tent, not per-person. Ask directly if you're solo — I got the rate halved."],
      ["warning", "February nights hit -2°C on the ridge. The 'blankets provided' are not enough. Carry a liner."],
    ],
  },
  {
    author: "dev_offroad",
    title: "Rishikesh to Chopta and the Chandrashila sunrise",
    summary:
      "Did this one as a guide run with three clients. Long driving day to Chopta, overnight in the meadow, " +
      "then a 4am start for Tungnath and Chandrashila. The sunrise is the entire reason to do this.",
    origin: ["Rishikesh", 78.2676, 30.0869],
    dest: ["Chopta", 79.0800, 30.4890],
    destSlug: "chopta",
    route: [[78.2676, 30.0869], [78.5981, 30.1462], [78.7838, 30.2223], [78.9811, 30.2844], [79.0800, 30.4890]],
    distance_m: 208_000, duration_min: 420,
    start: "2026-05-02", end: "2026-05-04",
    style: "adventure", difficulty: "moderate", vehicle: "Mahindra Thar",
    season: ["apr", "may", "jun", "oct"],
    stops: [
      ["Devprayag", "Quick sangam stop, 20 minutes.", 78.5981, 30.1462, "2026-05-02"],
      ["Rudraprayag", "Lunch. Road splits here — take the Ukhimath side.", 78.9811, 30.2844, "2026-05-02"],
      ["Chopta", "Meadow camp. Zero network from Ukhimath onward.", 79.0800, 30.4890, "2026-05-02"],
      ["Chandrashila Summit", "4am start, summit by 6:15. Nanda Devi and Trishul both visible.", 79.0670, 30.4930, "2026-05-03"],
    ],
    expenses: [
      ["fuel", "Diesel, round trip", 480_000, "2026-05-02"],
      ["stay", "Camp, 2 nights, 4 people", 600_000, "2026-05-02"],
      ["food", "Meals + packed breakfast", 320_000, "2026-05-04"],
      ["tickets", "Tungnath temple donation box", 50_000, "2026-05-03"],
    ],
    tips: [
      ["tip", "Start the Chandrashila climb by 4:15am. After 7am the cloud comes in and you see nothing."],
      ["tip", "There is no network from Ukhimath to Chopta. Download offline maps in Rudraprayag."],
      ["warning", "The last 2 km to Chandrashila is loose scree and ice until mid-April. Proper shoes, not sneakers."],
    ],
  },
  {
    author: "arjun_rides",
    title: "Delhi to Auli in winter — snow, ropeway, and a lot of diesel",
    summary:
      "January run to Auli for the snow. Two long driving days each way with a halt at Srinagar. " +
      "Cold, expensive, and completely worth it for the Nanda Devi view from the top station.",
    origin: ["Delhi", 77.2090, 28.6139],
    dest: ["Auli", 79.5670, 30.5290],
    destSlug: "auli",
    route: [[77.2090, 28.6139], [78.1642, 29.9457], [78.2676, 30.0869], [78.7838, 30.2223], [79.5645, 30.5550], [79.5670, 30.5290]],
    distance_m: 505_000, duration_min: 780,
    start: "2026-01-16", end: "2026-01-20",
    style: "road-trip", difficulty: "hard", vehicle: "Toyota Fortuner",
    season: ["dec", "jan", "feb"],
    stops: [
      ["Rishikesh", "Lunch and fuel. Last cheap fuel of the trip.", 78.2676, 30.0869, "2026-01-16"],
      ["Srinagar", "Night halt. Proper hotel with hot water, which matters in January.", 78.7838, 30.2223, "2026-01-16"],
      ["Joshimath", "Base for two nights. Checked road status at the police post.", 79.5645, 30.5550, "2026-01-17"],
      ["Auli", "Ropeway up. Skiing was closed but the snow was everywhere.", 79.5670, 30.5290, "2026-01-18"],
    ],
    expenses: [
      ["fuel", "Diesel, full round trip", 920_000, "2026-01-20"],
      ["stay", "Srinagar 1 night + Joshimath 3 nights", 1_400_000, "2026-01-19"],
      ["tolls", "All tolls both ways", 96_000, "2026-01-20"],
      ["activities", "Auli ropeway, 2 people return", 200_000, "2026-01-18"],
      ["food", "Everything, 5 days", 640_000, "2026-01-20"],
    ],
    tips: [
      ["tip", "Carry chains if you're going past Joshimath in January. Rentals in town are ₹500/day."],
      ["tip", "The ropeway shuts on wind, not snow. Go on the first clear morning, don't save it for the last day."],
      ["warning", "Joshimath has ongoing subsidence. Some hotels are closed or unsafe — book somewhere established."],
    ],
  },
  {
    author: "priya_travels",
    title: "A slow week in Mussoorie and Dhanaulti",
    summary:
      "No itinerary, no plan. Took the train to Dehradun, a cab up, and spent a week walking. " +
      "Camel's Back Road every evening. This is the trip I recommend to people who say they hate hill stations.",
    origin: ["Dehradun", 78.0322, 30.3165],
    dest: ["Mussoorie", 78.0644, 30.4598],
    destSlug: "mussoorie",
    route: [[78.0322, 30.3165], [78.0644, 30.4598]],
    distance_m: 35_000, duration_min: 90,
    start: "2025-11-03", end: "2025-11-10",
    style: "slow", difficulty: "easy", vehicle: "Train + taxi",
    season: ["oct", "nov", "mar"],
    stops: [
      ["Dehradun", "Nanda Devi Express from Delhi. Overnight, arrives 5:40am.", 78.0322, 30.3165, "2025-11-03"],
      ["Mussoorie", "Homestay near Landour. Quieter end, better food.", 78.0644, 30.4598, "2025-11-03"],
      ["Kempty Falls", "Went early, left by 10 when the buses arrived.", 78.0180, 30.4830, "2025-11-06"],
    ],
    expenses: [
      ["transport", "Train + taxi up and down", 320_000, "2025-11-10"],
      ["stay", "Homestay, 7 nights", 980_000, "2025-11-10"],
      ["food", "Everything", 420_000, "2025-11-10"],
    ],
    tips: [
      ["tip", "Stay in Landour, not Mall Road. Ten minutes further, half the noise, better bakeries."],
      ["tip", "November is the sweet spot — clear Himalayan views, no crowds, and the rates drop after Diwali."],
    ],
  },
  {
    author: "dev_offroad",
    title: "Tehri Lake overnight — the trip nobody books",
    summary:
      "Short one. Drove up from Rishikesh, boated on the reservoir, camped by the water, drove back. " +
      "Two days, almost no traffic, and the lake is enormous and mostly empty.",
    origin: ["Rishikesh", 78.2676, 30.0869],
    dest: ["Tehri", 78.4800, 30.3900],
    destSlug: "tehri",
    route: [[78.2676, 30.0869], [78.3500, 30.4167], [78.4800, 30.3900]],
    distance_m: 96_000, duration_min: 180,
    start: "2026-04-11", end: "2026-04-12",
    style: "weekend", difficulty: "easy", vehicle: "Maruti Swift",
    season: ["mar", "apr", "may", "oct", "nov"],
    stops: [
      ["Kanatal", "Coffee stop on the ridge road.", 78.3500, 30.4167, "2026-04-11"],
      ["Tehri Lake", "Boating point. Camped right by the water.", 78.4800, 30.3900, "2026-04-11"],
    ],
    expenses: [
      ["fuel", "Petrol round trip", 180_000, "2026-04-12"],
      ["activities", "Jet ski + boat ride", 150_000, "2026-04-11"],
      ["stay", "Lakeside camp", 200_000, "2026-04-11"],
      ["food", "Meals", 120_000, "2026-04-12"],
    ],
    tips: [
      ["tip", "A hatchback handles this road fine. You don't need an SUV for Tehri."],
      ["warning", "Boat operators quote tourist rates. Walk to the second jetty and the price drops by a third."],
    ],
  },
];

// ------------------------------------------------------------------------ run

async function main() {
  await db.connect();
  console.log("  seeding...");

  await db.query(`
    truncate table comments, likes, saves, follows,
                   journey_media, journey_tips, journey_expenses, journey_stops,
                   journey_versions, journey_stats, journeys, media,
                   places, destinations, place_categories, profiles, users
    restart identity cascade`);

  // categories
  const catId = {};
  for (const [slug, name, icon] of CATEGORIES) {
    const { rows } = await db.query(
      "insert into place_categories (slug, name, icon) values ($1,$2,$3) returning id",
      [slug, name, icon]
    );
    catId[slug] = rows[0].id;
  }

  // destinations
  const destId = {};
  for (const [slug, name, region, lng, lat, elev, season, desc] of DESTINATIONS) {
    const { rows } = await db.query(
      `insert into destinations (slug, name, region, description, centroid, elevation_m, best_season, cover_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [slug, name, region, desc, pt(lng, lat), elev, season,
       destinationCover(Object.keys(destId).length)]
    );
    destId[slug] = rows[0].id;
  }

  // places
  for (const [i, [slug, name, dest, cat, lng, lat, desc, price]] of PLACES.entries()) {
    await db.query(
      `insert into places (slug, name, destination_id, category_id, location, description, price_minor, photo_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [slug, name, destId[dest], catId[cat], pt(lng, lat), desc, price || null, placePhoto(i)]
    );
  }

  // users + profiles
  const hash = await bcrypt.hash(PASSWORD, 10);
  const profId = {};
  for (const [email, handle, name, location, bio] of USERS) {
    const { rows } = await db.query(
      "insert into users (email, password_hash) values ($1,$2) returning id",
      [email, hash]
    );
    await db.query(
      `insert into profiles (id, handle, display_name, bio, location, avatar_url)
       values ($1,$2,$3,$4,$5,$6)`,
      [rows[0].id, handle, name, bio, location, avatar(handle)]
    );
    profId[handle] = rows[0].id;
  }

  // journeys
  const journeyIds = [];
  for (const j of JOURNEYS) {
    const { rows } = await db.query(
      `insert into journeys (
         author_id, title, summary, origin_name, origin_point,
         destination_name, destination_point, destination_id, route_simplified,
         distance_m, duration_min, start_date, end_date,
         travel_style, difficulty, vehicle, best_season,
         status, visibility, published_at, completeness)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
               'published','public', now() - ($18 || ' days')::interval, 92)
       returning id`,
      [
        profId[j.author], j.title, j.summary,
        j.origin[0], pt(j.origin[1], j.origin[2]),
        j.dest[0], pt(j.dest[1], j.dest[2]), destId[j.destSlug],
        line(j.route), j.distance_m, j.duration_min, j.start, j.end,
        j.style, j.difficulty, j.vehicle, j.season,
        journeyIds.length * 3,
      ]
    );
    const id = rows[0].id;
    journeyIds.push(id);

    for (const [i, [name, note, lng, lat, on]] of j.stops.entries()) {
      await db.query(
        `insert into journey_stops (journey_id, position, name, note, location, arrived_on)
         values ($1,$2,$3,$4,$5,$6)`,
        [id, i, name, note, pt(lng, lat), on]
      );
    }
    for (const [cat, label, amount, on] of j.expenses) {
      await db.query(
        `insert into journey_expenses (journey_id, category, label, amount_minor, spent_on)
         values ($1,$2,$3,$4,$5)`,
        [id, cat, label, amount, on]
      );
    }
    for (const [kind, body] of j.tips) {
      await db.query(
        "insert into journey_tips (journey_id, kind, body) values ($1,$2,$3)",
        [id, kind, body]
      );
    }
    // cover + gallery
    const jIndex = journeyIds.length - 1;
    await db.query("update journeys set cover_url = $2 where id = $1", [
      id, journeyCover(jIndex),
    ]);
    for (let k = 0; k < 5; k++) {
      const [m] = (
        await db.query(
          `insert into media (owner_id, url, mime, width, height, bytes)
           values ($1,$2,'image/jpeg',1000,750,180000) returning id`,
          [profId[j.author], journeyPhoto(jIndex * 5 + k)]
        )
      ).rows;
      await db.query(
        "insert into journey_media (journey_id, media_id, position) values ($1,$2,$3)",
        [id, m.id, k]
      );
    }

    await db.query(
      `insert into journey_versions (journey_id, version, snapshot)
       values ($1, 1, $2)`,
      [id, JSON.stringify({ title: j.title, summary: j.summary, published: true })]
    );
  }

  // social graph
  const [arjun, priya, dev] = ["arjun_rides", "priya_travels", "dev_offroad"].map((h) => profId[h]);
  await db.query(
    `insert into follows (follower_id, following_id) values
     ($1,$2),($1,$3),($2,$1),($2,$3),($3,$1)`,
    [arjun, priya, dev]
  );

  for (const [i, jid] of journeyIds.entries()) {
    const likers = [arjun, priya, dev].filter((_, k) => (i + k) % 2 === 0);
    for (const p of likers) {
      await db.query(
        "insert into likes (profile_id, journey_id) values ($1,$2) on conflict do nothing",
        [p, jid]
      );
    }
    if (i % 2 === 0) {
      await db.query(
        "insert into saves (profile_id, journey_id) values ($1,$2) on conflict do nothing",
        [priya, jid]
      );
    }
    await db.query("update journey_stats set view_count = $2 where journey_id = $1", [
      jid, 120 + i * 47,
    ]);
  }

  await db.query(
    `insert into comments (journey_id, author_id, body) values
     ($1,$2,$3),($1,$4,$5),($6,$2,$7)`,
    [
      journeyIds[0], priya,
      "Did this exact route last month. The 4am start advice is correct — we left at 6 and lost an hour at the border.",
      dev,
      "Byasi stretch is clear as of last week if anyone is heading up now.",
      journeyIds[1],
      "₹6,000 for four days is genuinely impressive. Saving this one.",
    ]
  );

  const counts = await db.query(`
    select
      (select count(*) from destinations) as destinations,
      (select count(*) from places)       as places,
      (select count(*) from profiles)     as profiles,
      (select count(*) from journeys)     as journeys,
      (select count(*) from journey_stops) as stops,
      (select count(*) from journey_expenses) as expenses`);

  console.log("  seeded:", counts.rows[0]);
  console.log(`  demo login: arjun@example.com / ${PASSWORD}`);
  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
