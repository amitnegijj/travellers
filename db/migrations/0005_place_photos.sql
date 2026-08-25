-- 0005_place_photos.sql — places carry their own image, like destinations do.
-- Previously the UI derived a stock photo per index, which coupled presentation
-- to list order. This makes it data.

alter table places add column photo_url text;
