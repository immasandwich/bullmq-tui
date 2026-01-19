# bullmq-tui

A read-only terminal UI for monitoring BullMQ queues.

## Installation

```bash
npm install -g bullmq-tui
```

Or with bun:

```bash
bun install -g bullmq-tui
```

## Usage

```bash
# Connect with options
bullmq-tui --redis-host localhost --redis-port 6379

# Or use environment variables
export BULLMQ_TUI_REDIS_HOST=localhost
export BULLMQ_TUI_REDIS_PORT=6379
bullmq-tui
```

## Keybindings

| Key | Action |
|-----|--------|
| `j/k` | Navigate up/down |
| `enter` | Open queue/job |
| `h` | Go back |
| `H/L` | Switch status tabs |
| `/` | Filter queues |
| `q` | Quit |

## Development

```bash
bun install
bun run dev
```

## License

MIT
