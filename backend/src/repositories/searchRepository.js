// Cross-entity search for the Explore page. Each entity is queried
// independently so one slow match can't hold up the others.
import { query } from "../config/database.js";
import { DEST_SELECT } from "./destinationRepository.js";

export async function searchDestinations(term) {
  return query(
    `select ${DEST_SELECT} from destinations d
      where d.search_tsv @@ plainto_tsquery('simple', $1)
         or d.name ilike '%' || $1 || '%'
      order by "journeyCount" desc limit 8`,
    [term]
  );
}

export async function searchPlaces(term) {
  return query(
    `select pl.id, pl.slug, pl.name, pl.description,
            d.slug as "destinationSlug", d.name as "destinationName"
       from places pl left join destinations d on d.id = pl.destination_id
      where pl.name ilike '%' || $1 || '%'
      order by pl.name limit 8`,
    [term]
  );
}

export async function searchProfiles(term) {
  return query(
    `select p.id, p.handle, p.display_name as "displayName",
            p.avatar_url as "avatarUrl", p.bio
       from profiles p
      where p.handle ilike '%' || $1 || '%' or p.display_name ilike '%' || $1 || '%'
      limit 8`,
    [term]
  );
}
