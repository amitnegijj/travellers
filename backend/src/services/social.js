// Follow / like / save / comment. Counters are kept by DB triggers (0004).
import { AppError } from "../lib/http.js";
import { query, queryOne } from "../lib/db.js";

export async function toggleFollow(followerId, handle) {
  const target = await queryOne("select id from profiles where handle = $1", [handle]);
  if (!target) throw new AppError("not_found", "No such profile");
  if (target.id === followerId) throw new AppError("validation", "You cannot follow yourself");

  const existing = await queryOne(
    "select 1 from follows where follower_id = $1 and following_id = $2",
    [followerId, target.id]
  );

  if (existing) {
    await query("delete from follows where follower_id = $1 and following_id = $2", [
      followerId, target.id,
    ]);
  } else {
    await query(
      "insert into follows (follower_id, following_id) values ($1,$2) on conflict do nothing",
      [followerId, target.id]
    );
  }

  const [{ count }] = await query(
    "select count(*)::int as count from follows where following_id = $1",
    [target.id]
  );
  return { following: !existing, followerCount: count };
}

async function toggleJoin(table, profileId, journeyId) {
  const journey = await queryOne("select 1 from journeys where id = $1", [journeyId]);
  if (!journey) throw new AppError("not_found", "No such journey");

  const existing = await queryOne(
    `select 1 from ${table} where profile_id = $1 and journey_id = $2`,
    [profileId, journeyId]
  );

  if (existing) {
    await query(`delete from ${table} where profile_id = $1 and journey_id = $2`, [profileId, journeyId]);
  } else {
    await query(
      `insert into ${table} (profile_id, journey_id) values ($1,$2) on conflict do nothing`,
      [profileId, journeyId]
    );
  }

  const column = table === "likes" ? "like_count" : "save_count";
  const [stats] = await query(
    `select ${column} as count from journey_stats where journey_id = $1`,
    [journeyId]
  );
  return { active: !existing, count: stats?.count ?? 0 };
}

export const toggleLike = (profileId, journeyId) => toggleJoin("likes", profileId, journeyId);
export const toggleSave = (profileId, journeyId) => toggleJoin("saves", profileId, journeyId);

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

export async function addComment(authorId, journeyId, body) {
  const journey = await queryOne("select 1 from journeys where id = $1", [journeyId]);
  if (!journey) throw new AppError("not_found", "No such journey");

  return queryOne(
    `insert into comments (journey_id, author_id, body) values ($1,$2,$3)
     returning id, body, created_at as "createdAt"`,
    [journeyId, authorId, body.trim()]
  );
}

export async function deleteComment(commentId, requesterId) {
  const comment = await queryOne(
    `select c.author_id, j.author_id as journey_author
       from comments c join journeys j on j.id = c.journey_id
      where c.id = $1 and c.deleted_at is null`,
    [commentId]
  );
  if (!comment) throw new AppError("not_found", "No such comment");

  // Comment author or journey owner may remove it.
  if (comment.author_id !== requesterId && comment.journey_author !== requesterId) {
    throw new AppError("forbidden", "Not your comment");
  }
  await query("update comments set deleted_at = now() where id = $1", [commentId]);
}

export async function listFollowers(handle, direction) {
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
