# 🐂 bullmq-tui

A read-only terminal UI for monitoring BullMQ queues.

## ✨ Features

- 📊 Real-time queue monitoring
- 🔍 Filter queues by name
- 📋 View jobs by status (active, waiting, failed, completed, delayed)
- 🔎 Inspect job details, data, and stack traces
- ⌨️ Vim-style keyboard navigation
- 🔒 Read-only - safely monitor production queues

## 📦 Installation

```bash
npm install -g bullmq-tui
```

Or with bun:

```bash
bun install -g bullmq-tui
```

## 🚀 Usage

```bash
# Interactive setup
bmq

# Connect with options
bmq --redis-host localhost --redis-port 6379

# Or use environment variables
export BULLMQ_TUI_REDIS_HOST=localhost
export BULLMQ_TUI_REDIS_PORT=6379
bmq
```

## ⌨️ Keybindings

| Key | Action |
|-----|--------|
| `j/k` | Navigate up/down |
| `l/enter` | Open queue/job |
| `h` | Go back |
| `H/L` | Switch status tabs |
| `/` | Filter queues |
| `g g` | Go to top |
| `G` | Go to bottom |
| `ctrl+d/u` | Page down/up |
| `q` | Quit |

## 🛠️ Development

```bash
bun install
bun run dev
```

## 📄 License

MIT
