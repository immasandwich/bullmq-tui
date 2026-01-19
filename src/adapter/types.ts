export interface JobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  prioritized: number;
}

export interface QueueInfo {
  name: string;
  counts: JobCounts;
  isPaused: boolean;
}

export interface JobInfo {
  id: string;
  name: string;
  data: unknown;
  progress: unknown;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  returnvalue?: unknown;
  stacktrace?: string[];
}

export type JobStatus = "waiting" | "active" | "completed" | "failed" | "delayed" | "prioritized";

export type QueueEventType =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "progress"
  | "stalled"
  | "removed"
  | "drained";

export interface QueueEvent {
  type: QueueEventType;
  queue: string;
  jobId: string;
  data?: unknown;
  timestamp: number;
}
