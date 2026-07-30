# AmirTime

A personal time-tracking and task management desktop app built with Electron.  
Tracks time against tasks, runs a Pomodoro timer, and shows where your hours actually go.

## Features

### Tasks
- Create tasks with title, description, project, tags, priority, color, due date and time estimate
- Subtasks with progress badge (e.g. 2/5)
- Kanban board (Backlog / In Progress / Done) with drag-and-drop
- Today view — overdue tasks + tasks scheduled for today
- Search, sort and keyboard shortcuts (`N` new task, `/` search, `P` Pomodoro)

### Time tracking
- Start/stop timer per task
- Manual time edit in HH:MM format
- Forgotten timer reminder — notification after X hours, auto-stop after 5 more minutes
- Time entries stored with timestamps for accurate reporting

### Pomodoro
- Configurable work / short break / long break durations
- Link a task to the session — time is tracked automatically
- Wall-clock based countdown (stays accurate when the window is minimised)
- Desktop notifications on phase transitions

### Reports
- Filter by week, month or custom date range
- Charts: time per day, per project, per task

### Sync
- File-based sync between devices — no account required
- Works with any file sync tool: Syncthing, Nextcloud, Dropbox, etc.
- Auto-exports on every change (3 s debounce), auto-imports when the file changes externally
- Smart merge: last-write-wins per record based on `updated_at`

### Other
- Projects and tags with custom colours
- Calendar view
- Export / import all data as JSON
- Light / dark / auto theme
- Czech and English UI

## Installation

Download the latest release for your platform from the [Releases](../../releases) page:

| Platform | File |
|----------|------|
| Linux | `AmirTime-x.x.x.AppImage` |
| Windows | `AmirTime Setup x.x.x.exe` |

### Linux (AppImage)
```bash
chmod +x AmirTime-*.AppImage
./AmirTime-*.AppImage
```

### Sync setup
1. Settings → Sync → **Choose sync file…**
2. Pick a path inside a folder your sync tool already watches  
   (e.g. `~/Nextcloud/amirtime-sync.json`)
3. Repeat on the second device pointing to the same file
4. Changes sync automatically from that point on

## Building from source

```bash
# Clone and install
git clone https://github.com/mirda16/amirtime.git
cd amirtime
npm install

# Development
npm run dev

# Production build
npm run dist:linux   # Linux AppImage
npm run dist:win     # Windows installer
```

**Requirements:** Node.js 20+, npm 10+

## Tech stack

- [Electron](https://www.electronjs.org/) 35
- [React](https://react.dev/) 19 + TypeScript
- [Mantine](https://mantine.dev/) v9 (UI components)
- [SQLite](https://www.sqlite.org/) via better-sqlite3
- [Zustand](https://zustand-demo.pmnd.rs/) (state management)
- [@dnd-kit](https://dndkit.com/) (drag and drop)
- [Recharts](https://recharts.org/) (charts)

## License

MIT
