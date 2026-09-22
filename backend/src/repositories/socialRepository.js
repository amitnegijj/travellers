// Follows, likes, saves and comments.
//
// Counter columns (like_count, save_count, comment_count) are maintained by
// database triggers, so nothing here ever writes one — it only reads them back
// after the insert or delete that moved them.
import { query, queryOne } from "../config/database.js";

/* ------------------------------------------------------------------ follows */

export async function findFollow(followerId, followingId) {
  return queryOne("select 1 from follows where follower_id = $1 and following_id = $2", [
    followerId,
    followingId,
  ]);
}

export async function insertFollow(followerId, followingId) {
  await query(
    "insert into follows (follower_id, following_id) values ($1,$2) on conflict do nothing",
    [followerId, followingId]
  );
}

export async function deleteFollow(followerId, followingId) {
  await query("delete from follows where follower_id = $1 and following_id = $2", [
    followerId,
    followingId,
  ]);
}

export async function countFollowers(profileId) {
  const [row] = await query(
    "select count(*)::int as count from follows where following_id = $1",
    [profileId]
  );
  return row.count;
}

export async function listFollowDirection(handle, direction) {
  const join =
    direction === "followers"
      ? `join follows f on f.follower_id = p.id
         join profiles t on t.id = f.following_id and t.handle = $1`
      : `join follows f on f.following_id = p.id
         join profiles t on t.id = f.follower_id and t.handle = $1`;

  return query(
    `select p.id, p.handle, p.display_name as "displayName",
            p.avatar_url as "avatarUrl", p.bio
       from profiles p ${join}
      order by f.created_at desc limit 100`,
    [handle]
  );
}

/* ------------------------------------------------------------ likes & saves */

// `table` is never caller-supplied — the two services below pass a literal.
const JOIN_TABLES = { likes: "like_count", saves: "save_count" };

export async function findJoin(table, profileId, journeyId) {
  return queryOne(`select 1 from ${table} where profile_id = $1 and journey_id = $2`, [
    profileId,
    journeyId,
  ]);
}

export async function insertJoin(table, profileId, journeyId) {
  await query(
    `insert into ${table} (profile_id, journey_id) values ($1,$2) on conflict do nothing`,
    [profileId, journeyId]
  );
}

export async function deleteJoin(table, profileId, journeyId) {
  await query(`delete from ${table} where profile_id = $1 and journey_id = $2`, [
    profileId,
    journeyId,
  ]);
}

export async function readJoinCount(table, journeyId) {
  const column = JOIN_TABLES[table];
  const [stats] = await query(
    `select ${column} as count from journey_stats where journey_id = $1`,
    [journeyId]
  );
  return stats?.count ?? 0;
}

/* ----------------------------------------------------------------- comments */

export async function listComments(journeyId) {
  return query(
    `select c.id, c.body, c.created_at as "createdAt",
            p.handle as "authorHandle", p.display_name as "authorName",
            p.avatar_url as "authorAvatar", p.id as "authorId"
       from comments c join profiles p on p.id = c.author_id
      where c.journey_id = $1 and c.deleted_at is null
      order by c.created_at asc`,
    [journeyId]
  );
}

export async function insertComment(authorId, journeyId, body) {
  return queryOne(
    `insert into comments (journey_id, author_id, body) values ($1,$2,$3)
     returning id, body, created_at as "createdAt"`,
    [journeyId, authorId, body]
  );
}

/** Returns the comment's author and the owner of the journey it sits on. */
export async function findCommentOwnership(commentId) {
  return queryOne(
    `select c.author_id, j.author_id as journey_author
       from comments c join journeys j on j.id = c.journey_id
      where c.id = $1 and c.deleted_at is null`,
    [commentId]
  );
}

export async function softDeleteComment(commentId) {
  await query("update comments set deleted_at = now() where id = $1", [commentId]);
}
