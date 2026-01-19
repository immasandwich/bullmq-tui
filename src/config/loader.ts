import { configSchema, type Config } from "./schema.ts";

interface LoadConfigOptions {
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
  redisDb?: number;
}

export function loadConfigFromEnv(overrides: LoadConfigOptions = {}): Config {
  const raw = {
    redis: {
      host: overrides.redisHost ?? process.env.BULLMQ_TUI_REDIS_HOST ?? "localhost",
      port: overrides.redisPort ?? process.env.BULLMQ_TUI_REDIS_PORT ?? 6379,
      password: overrides.redisPassword ?? process.env.BULLMQ_TUI_REDIS_PASSWORD,
      db: overrides.redisDb ?? process.env.BULLMQ_TUI_REDIS_DB ?? 0,
    },
    mcp: {
      enabled: process.env.BULLMQ_TUI_MCP_ENABLED === "true",
      port: process.env.BULLMQ_TUI_MCP_PORT ?? 3333,
      host: process.env.BULLMQ_TUI_MCP_HOST ?? "127.0.0.1",
    },
  };

  return configSchema.parse(raw);
}

export function getMissingConfigFields(overrides: LoadConfigOptions = {}): string[] {
  const missing: string[] = [];
  
  const host = overrides.redisHost ?? process.env.BULLMQ_TUI_REDIS_HOST;
  if (!host) {
    missing.push("redis.host");
  }
  
  return missing;
}
