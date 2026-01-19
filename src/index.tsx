#!/usr/bin/env bun
import React, { useState, useCallback } from "react";
import { render } from "ink";
import { program } from "commander";
import { App } from "./app.tsx";
import { ConfigPrompt, type ConfigAnswers } from "./components/ConfigPrompt.tsx";
import type { Config } from "./config/schema.ts";
import { getGlobalAdapter } from "./cleanup.ts";

program
  .name("bullmq-tui")
  .description("Terminal UI for monitoring BullMQ queues")
  .version("0.1.0")
  .option("--redis-host <host>", "Redis host", undefined)
  .option("--redis-port <port>", "Redis port", undefined)
  .option("--redis-password <password>", "Redis password", undefined)
  .option("--redis-db <db>", "Redis database number", undefined)
  .parse();

const opts = program.opts();

// Check what we have from env/args
const envHost = opts.redisHost ?? process.env.BULLMQ_TUI_REDIS_HOST;
const envPort = opts.redisPort ?? process.env.BULLMQ_TUI_REDIS_PORT;
const envPassword = opts.redisPassword ?? process.env.BULLMQ_TUI_REDIS_PASSWORD;
const envDb = opts.redisDb ?? process.env.BULLMQ_TUI_REDIS_DB;

const needsPrompt = !envHost;

function Root() {
  const [config, setConfig] = useState<Config | null>(() => {
    if (needsPrompt) return null;
    return {
      redis: {
        host: envHost ?? "localhost",
        port: envPort ? parseInt(envPort, 10) : 6379,
        password: envPassword,
        db: envDb ? parseInt(envDb, 10) : 0,
      },
    };
  });

  const handleConfigComplete = useCallback((answers: ConfigAnswers) => {
    setConfig({
      redis: {
        host: answers.host,
        port: answers.port,
        password: answers.password,
        db: envDb ? parseInt(envDb, 10) : 0,
      },
    });
  }, []);

  if (!config) {
    return (
      <ConfigPrompt
        defaults={{
          host: envHost,
          port: envPort ? parseInt(envPort, 10) : undefined,
        }}
        onComplete={handleConfigComplete}
      />
    );
  }

  return <App config={config} />;
}

const { waitUntilExit } = render(<Root />);

await waitUntilExit();

// Ensure Redis connections are fully closed before exiting
const adapter = getGlobalAdapter();
if (adapter) {
  await adapter.disconnect();
}

// Force exit since BullMQ/ioredis may leave lingering handles
process.exit(0);
