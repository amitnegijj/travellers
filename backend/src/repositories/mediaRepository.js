// Uploaded file records. The bytes live on disk (or, later, in object
// storage); this table only ever holds a plain URL to them.
import { queryOne } from "../config/database.js";

export async function insert({ ownerId, url, mime, width, height, bytes }) {
  return queryOne(
    `insert into media (owner_id, url, mime, width, height, bytes)
     values ($1,$2,$3,$4,$5,$6)
     returning id, url, width, height`,
    [ownerId, url, mime, width, height, bytes]
  );
}
