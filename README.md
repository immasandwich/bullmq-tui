# bullmq-tui

A read-only terminal UI for monitoring BullMQ queues.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/immasandwich/bullmq-tui/main/install.sh | sh
```

Or download a binary directly from [releases](https://github.com/immasandwich/bullmq-tui/releases).

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

## Building

```bash
# Build for current platform
bun run build

# Build for all platforms
bun run build:all
```

## License

MIT
