CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  discover_progress INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE movies (
  tmdb_id INTEGER PRIMARY KEY,
  release_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  genre_ids INTEGER[] NOT NULL,
  poster_path VARCHAR(255) NOT NULL,
  vote_average NUMERIC(3,1) NOT NULL,
  vote_count INTEGER NOT NULL,
  overview TEXT NOT NULL,
  keyword_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE keywords (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE movie_interactions (
  id SERIAL PRIMARY KEY,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction VARCHAR(20) NOT NULL CHECK (interaction IN ('saved', 'skipped', 'dismissed', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  rating VARCHAR(10) NOT NULL CHECK (rating IN ('love', 'like', 'dislike', 'hate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_interactions_user ON movie_interactions(user_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);