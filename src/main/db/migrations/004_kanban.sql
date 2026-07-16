ALTER TABLE tasks ADD COLUMN kanban_status TEXT NOT NULL DEFAULT 'backlog';
UPDATE tasks SET kanban_status = 'done' WHERE is_done = 1;
