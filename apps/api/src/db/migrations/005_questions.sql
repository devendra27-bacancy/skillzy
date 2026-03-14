CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  slide_index INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq','text','drawing','rating','true_false')),
  prompt TEXT NOT NULL,
  options JSONB,
  correct_id TEXT,
  time_limit_s INT DEFAULT NULL,
  anonymous BOOLEAN DEFAULT TRUE,
  order_index INT NOT NULL DEFAULT 0
);
