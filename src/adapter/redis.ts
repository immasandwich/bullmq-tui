import { Queue, QueueEvents, type Job } from "bullmq";
import { Redis } from "ioredis";
import type { JobCounts, JobInfo, JobStatus, QueueEvent, QueueInfo } from "./types.ts";

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisAdapter {
  private config: RedisConnectionConfig;
  private redis: Redis | null = null;
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private eventCallbacks: Map<string, Set<(event: QueueEvent) => void>> = new Map();

  constructor(config: RedisConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const CONNECTION_TIMEOUT = 5000; // 5 seconds

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.redis) {
          this.redis.disconnect();
          this.redis = null;
        }
        reject(new Error(`Connection timeout: could not connect to ${this.config.host}:${this.config.port} within ${CONNECTION_TIMEOUT / 1000}s`));
      }, CONNECTION_TIMEOUT);

      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        maxRetriesPerRequest: null,
        retryStrategy: () => null, // Don't retry, fail fast
        lazyConnect: true,
      });

      this.redis.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });

      this.redis.connect()
        .then(() => this.redis!.ping())
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
  }

  async disconnect(): Promise<void> {
    // Close all queue event listeners
    for (const qe of this.queueEvents.values()) {
      await qe.close();
    }
    this.queueEvents.clear();

    // Close all queues
    for (const q of this.queues.values()) {
      await q.close();
    }
    this.queues.clear();

    // Close redis connection
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  async discoverQueues(): Promise<string[]> {
    if (!this.redis) throw new Error("Not connected to Redis");

    // BullMQ stores queue metadata in keys like "bull:<queueName>:meta"
    const keys = await this.redis.keys("bull:*:meta");
    
    const queueNames = keys
      .map((key) => {
        // Extract queue name between "bull:" and ":meta"
        // Handle queue names that might contain colons
        const match = key.match(/^bull:(.+):meta$/);
        return match?.[1] ?? null;
      })
      .filter((name): name is string => {
        // Filter out null, empty, and whitespace-only names
        return typeof name === "string" && name.trim().length > 0;
      });

    // Dedupe and sort
    return [...new Set(queueNames)].sort();
  }

  private getQueue(name: string): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue(name, { connection: this.config });
      this.queues.set(name, queue);
    }
    return queue;
  }

  async getQueueInfo(name: string): Promise<QueueInfo> {
    const queue = this.getQueue(name);
    const [counts, isPaused] = await Promise.all([
      queue.getJobCounts(
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed",
        "paused",
        "prioritized"
      ),
      queue.isPaused(),
    ]);

    return {
      name,
      counts: counts as unknown as JobCounts,
      isPaused,
    };
  }

  async getAllQueuesInfo(queueNames: string[]): Promise<QueueInfo[]> {
    return Promise.all(queueNames.map((name) => this.getQueueInfo(name)));
  }

  async getJobs(
    queueName: string,
    status: JobStatus,
    start = 0,
    end = 49
  ): Promise<JobInfo[]> {
    const queue = this.getQueue(queueName);
    const jobs = await queue.getJobs([status], start, end);
    return jobs.map(this.mapJob);
  }

  async getJob(queueName: string, jobId: string): Promise<JobInfo | null> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return null;
    return this.mapJob(job);
  }

  async getJobLogs(
    queueName: string,
    jobId: string
  ): Promise<{ logs: string[]; count: number }> {
    const queue = this.getQueue(queueName);
    return queue.getJobLogs(jobId);
  }

  private mapJob(job: Job): JobInfo {
    return {
      id: job.id ?? "",
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
      stacktrace: job.stacktrace,
    };
  }

  subscribeToQueue(queueName: string, callback: (event: QueueEvent) => void): void {
    // Get or create QueueEvents for this queue
    let qe = this.queueEvents.get(queueName);
    if (!qe) {
      qe = new QueueEvents(queueName, { connection: this.config });
      this.queueEvents.set(queueName, qe);

      // Wire up all events
      const emit = (type: QueueEvent["type"], jobId: string, data?: unknown) => {
        const event: QueueEvent = {
          type,
          queue: queueName,
          jobId,
          data,
          timestamp: Date.now(),
        };
        const callbacks = this.eventCallbacks.get(queueName);
        if (callbacks) {
          for (const cb of callbacks) {
            cb(event);
          }
        }
      };

      qe.on("waiting", ({ jobId }) => emit("waiting", jobId));
      qe.on("active", ({ jobId }) => emit("active", jobId));
      qe.on("completed", ({ jobId, returnvalue }) => emit("completed", jobId, returnvalue));
      qe.on("failed", ({ jobId, failedReason }) => emit("failed", jobId, failedReason));
      qe.on("progress", ({ jobId, data }) => emit("progress", jobId, data));
      qe.on("stalled", ({ jobId }) => emit("stalled", jobId));
      qe.on("removed", ({ jobId }) => emit("removed", jobId));
      qe.on("drained", () => emit("drained", ""));
    }

    // Register callback
    let callbacks = this.eventCallbacks.get(queueName);
    if (!callbacks) {
      callbacks = new Set();
      this.eventCallbacks.set(queueName, callbacks);
    }
    callbacks.add(callback);
  }

  unsubscribeFromQueue(queueName: string, callback: (event: QueueEvent) => void): void {
    const callbacks = this.eventCallbacks.get(queueName);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
}
