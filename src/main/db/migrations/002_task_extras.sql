ALTER TABLE tasks ADD COLUMN color TEXT;
ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'none';

CREATE INDEX idx_tasks_priority ON tasks(priority);
