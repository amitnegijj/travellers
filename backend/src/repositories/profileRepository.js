// Identity and profiles. `users` holds credentials, `profiles` holds
// everything public, and the two share a primary key.
import { query, queryOne, transaction } from "../config/database.js";

/* ------------------------------------------------------------------ identity */

export async function findUserByEmail(email) {
  return queryOne("select id, password_hash from users where email = $1", [email]);
}

export async function emailExists(email) {
  return queryOne("select 1 from users where email = $1", [email]);
}

export async function handleExists(handle) {
  return queryOne("select 1 from profiles where handle = $1", [handle]);
}

/** Creates the user and their profile together, or neither. */
export async function createUserWithProfile({ email, passwordHash, handle, displayName }) {
  return transaction(async (q) => {
    const [user] = await q(
      "insert into users (email, password_hash) values ($1,$2) returning id",
      [email, passwordHash]
    );

    await q("insert into profiles (id, handle, display_name) values ($1,$2,$3)", [
      user.id,
      handle,
      displayName,
    ]);

    return user.id;
  });
}

/* ------------------------------------------------------------------ profiles */

/** The slim profile the session middleware attaches to every request. */
export async function findSessionProfileById(userId) {
  return queryOne(
    `select id, handle, display_name as "displayName", avatar_url as "avatarUrl"
       from profiles where id = $1`,
    [userId]
  );
}

export async function findIdentityById(userId) {
  return queryOne(
    `select id, handle, display_name as "displayName" from profiles where id = $1`,
    [userId]
  );
}

export async function findIdByHandle(handle) {
  return queryOne("select id from profiles where handle = $1", [handle]);
}

/**
 * The full profile page payload. `viewerId` decides only whether
 * "isFollowing" is computed — it never changes which rows are visible.
 */
export async function findByHandle(handle, viewerId) {
  return queryOne(
    `select p.id, p.handle, p.display_name as "displayName", p.bio, p.location,
            p.avatar_url as "avatarUrl", p.is_private as "isPrivate", p.created_at as "createdAt",
            (select count(*) from follows f where f.following_id = p.id)::int as "followerCount",
            (select count(*) from follows f where f.follower_id  = p.id)::int as "followingCount",
            (select count(*) from journeys j
              where j.author_id = p.id and j.status = 'published')::int as "journeyCount",
            case when $2::uuid is null then false
                 else exists (select 1 from follows f
                               where f.follower_id = $2::uuid and f.following_id = p.id)
            end as "isFollowing"
       from profiles p
      where p.handle = $1`,
    [handle, viewerId]
  );
}

export async function update(userId, input) {
  return queryOne(
    `update profiles
        set display_name = $2,
            bio          = $3,
            location     = $4,
            avatar_url   = nullif($5, ''),
            is_private   = coalesce($6, is_private)
      where id = $1
      returning id, handle, display_name as "displayName", bio, location,
                avatar_url as "avatarUrl", is_private as "isPrivate"`,
    [
      userId,
      input.displayName,
      input.bio ?? null,
      input.location ?? null,
      input.avatarUrl ?? null,
      input.isPrivate ?? null,
    ]
  );
}

/** Follow state for one author, as shown on a journey detail page. */
export async function findFollowSummary(handle, viewerId) {
  return queryOne(
    `select case when $2::uuid is null then false
                 else exists (select 1 from follows f
                               where f.follower_id = $2::uuid and f.following_id = p.id)
            end as "isFollowing",
            (select count(*) from follows f where f.following_id = p.id)::int as "followerCount"
       from profiles p where p.handle = $1`,
    [handle, viewerId]
  );
}
