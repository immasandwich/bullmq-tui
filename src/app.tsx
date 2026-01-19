import React, { useEffect, useCallback, useRef } from "react";
import { useApp, useInput } from "ink";
import { useStore } from "./store/index.ts";
import { RedisAdapter } from "./adapter/redis.ts";
import type { Config } from "./config/schema.ts";
import { QueueList } from "./components/QueueList.tsx";
import { JobList } from "./components/JobList.tsx";
import { JobDetail } from "./components/JobDetail.tsx";
import { Layout } from "./components/Layout.tsx";
import { setGlobalAdapter } from "./cleanup.ts";

interface AppProps {
  config: Config;
}

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const adapterRef = useRef<RedisAdapter | null>(null);

  const {
    setConnectionStatus,
    setQueueNames,
    updateQueues,
    connectionStatus,
    queueNames,
    selectedQueue,
    jobStatusFilter,
    setJobs,
    view,
    isFilteringQueues,
    handleQueueEvent,
  } = useStore();

  // Connect to Redis
  const connect = useCallback(async () => {
    // Clean up existing adapter if retrying
    if (adapterRef.current) {
      try {
        await adapterRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }

    const adapter = new RedisAdapter({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });
    adapterRef.current = adapter;
    setGlobalAdapter(adapter);

    setConnectionStatus("connecting");
    try {
      await adapter.connect();
      setConnectionStatus("connected");

      // Discover queues
      const names = await adapter.discoverQueues();
      setQueueNames(names);

      // Get initial queue info
      if (names.length > 0) {
        const infos = await adapter.getAllQueuesInfo(names);
        updateQueues(infos);
      }

      // Subscribe to events for all queues
      for (const name of names) {
        adapter.subscribeToQueue(name, handleQueueEvent);
      }
    } catch (err) {
      setConnectionStatus("error", err instanceof Error ? err.message : String(err));
    }
  }, [config, setConnectionStatus, setQueueNames, updateQueues, handleQueueEvent]);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      // Disconnect is awaited in index.tsx after waitUntilExit()
      setGlobalAdapter(null);
    };
  }, [connect]);

  // Refresh queue counts periodically
  useEffect(() => {
    if (connectionStatus !== "connected" || !adapterRef.current) return;

    const interval = setInterval(async () => {
      const adapter = adapterRef.current;
      if (!adapter) return;

      try {
        const infos = await adapter.getAllQueuesInfo(queueNames);
        updateQueues(infos);
      } catch {
        // Ignore refresh errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionStatus, queueNames]);

  // Fetch jobs when queue or filter changes
  useEffect(() => {
    if (!selectedQueue || !adapterRef.current || connectionStatus !== "connected") {
      return;
    }

    const adapter = adapterRef.current;

    async function fetchJobs() {
      try {
        const jobs = await adapter.getJobs(selectedQueue!, jobStatusFilter, 0, 99);
        setJobs(jobs);
      } catch {
        setJobs([]);
      }
    }

    fetchJobs();

    // Also refresh jobs periodically
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [selectedQueue, jobStatusFilter, connectionStatus]);

  // Manual refresh
  const refresh = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter || connectionStatus !== "connected") return;

    try {
      const infos = await adapter.getAllQueuesInfo(queueNames);
      updateQueues(infos);

      if (selectedQueue) {
        const jobs = await adapter.getJobs(selectedQueue, jobStatusFilter, 0, 99);
        setJobs(jobs);
      }
    } catch {
      // Ignore
    }
  }, [connectionStatus, queueNames, selectedQueue, jobStatusFilter]);

  // Global key bindings
  useInput((input, key) => {
    // Don't intercept when in filter input mode
    if (isFilteringQueues) return;

    // Retry connection on Enter when in error state
    if (connectionStatus === "error" && key.return) {
      connect();
      return;
    }

    if (input === "q" && !key.ctrl && view === "queues") {
      exit();
    } else if (input === "r" && key.ctrl) {
      refresh();
    } else if (input === "r" && !key.ctrl) {
      refresh();
    }
  });

  return (
    <Layout>
      {view === "queues" && <QueueList />}
      {view === "jobs" && <JobList />}
      {view === "job-detail" && <JobDetail />}
    </Layout>
  );
}
