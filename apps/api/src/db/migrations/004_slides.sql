CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  index INT NOT NULL,
  thumbnail_url TEXT,
  original_url TEXT,
  has_question BOOLEAN DEFAULT FALSE,
  UNIQUE(session_id, index)
);
