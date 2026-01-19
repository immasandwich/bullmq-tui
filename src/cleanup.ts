import type { RedisAdapter } from "./adapter/redis.ts";

// Global adapter reference for cleanup after exit
let globalAdapter: RedisAdapter | null = null;

export function setGlobalAdapter(adapter: RedisAdapter | null) {
  globalAdapter = adapter;
}

export function getGlobalAdapter(): RedisAdapter | null {
  return globalAdapter;
}
