CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  title           TEXT NOT NULL,
  scheduledTime   TEXT,
  completed       INTEGER DEFAULT 0,
  description     TEXT DEFAULT '',
  project         TEXT DEFAULT '',
  "order"         INTEGER DEFAULT 0,
  persistent      INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending',
  priority        TEXT DEFAULT 'medium',
  tags            TEXT DEFAULT '[]',
  estimatedDuration INTEGER,
  timeTracking    TEXT DEFAULT '{}',
  recurrence      TEXT DEFAULT '{}',
  PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, scheduledTime);
CREATE INDEX IF NOT EXISTS idx_tasks_persistent ON tasks(user_id, persistent, completed);

CREATE TABLE IF NOT EXISTS ideas (
  id          TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  project     TEXT DEFAULT '',
  createdAt   TEXT NOT NULL,
  "order"     INTEGER DEFAULT 0,
  PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ideas_user ON ideas(user_id, "order");

CREATE TABLE IF NOT EXISTS projects (
  id      TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title   TEXT NOT NULL,
  color   TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, "order");
