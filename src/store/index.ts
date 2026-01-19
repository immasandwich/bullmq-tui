import { create } from "zustand";
import type { JobInfo, JobStatus, QueueEvent, QueueInfo } from "../adapter/types.ts";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface TuiState {
  // Connection
  connectionStatus: ConnectionStatus;
  connectionError: string | null;

  // Data
  queueNames: string[];
  queues: Map<string, QueueInfo>;
  jobs: JobInfo[];
  selectedJob: JobInfo | null;

  // UI State
  selectedQueue: string | null;
  jobStatusFilter: JobStatus;
  view: "queues" | "jobs" | "job-detail";
  queueFilter: string;
  isFilteringQueues: boolean;

  // Actions
  setConnectionStatus: (status: ConnectionStatus, error?: string) => void;
  setQueueNames: (names: string[]) => void;
  updateQueue: (info: QueueInfo) => void;
  updateQueues: (infos: QueueInfo[]) => void;
  selectQueue: (name: string | null) => void;
  setJobs: (jobs: JobInfo[]) => void;
  selectJob: (job: JobInfo | null) => void;
  setJobStatusFilter: (status: JobStatus) => void;
  setView: (view: TuiState["view"]) => void;
  setQueueFilter: (filter: string) => void;
  setIsFilteringQueues: (isFiltering: boolean) => void;
  handleQueueEvent: (event: QueueEvent) => void;
}

export const useStore = create<TuiState>((set, get) => ({
  // Initial state
  connectionStatus: "disconnected",
  connectionError: null,
  queueNames: [],
  queues: new Map(),
  jobs: [],
  selectedJob: null,
  selectedQueue: null,
  jobStatusFilter: "active",
  view: "queues",
  queueFilter: "",
  isFilteringQueues: false,

  // Actions
  setConnectionStatus: (status, error) =>
    set({ connectionStatus: status, connectionError: error ?? null }),

  setQueueNames: (names) => set({ queueNames: names }),

  updateQueue: (info) =>
    set((state) => {
      const queues = new Map(state.queues);
      queues.set(info.name, info);
      return { queues };
    }),

  updateQueues: (infos) =>
    set((state) => {
      const queues = new Map(state.queues);
      for (const info of infos) {
        queues.set(info.name, info);
      }
      return { queues };
    }),

  selectQueue: (name) =>
    set({
      selectedQueue: name,
      view: name ? "jobs" : "queues",
      jobs: [],
      selectedJob: null,
    }),

  setJobs: (jobs) => set({ jobs }),

  selectJob: (job) =>
    set({
      selectedJob: job,
      view: job ? "job-detail" : get().selectedQueue ? "jobs" : "queues",
    }),

  setJobStatusFilter: (status) => set({ jobStatusFilter: status }),

  setView: (view) => set({ view }),

  setQueueFilter: (filter) => set({ queueFilter: filter }),

  setIsFilteringQueues: (isFiltering) => set({ isFilteringQueues: isFiltering }),

  handleQueueEvent: (event) => {
    // For now, we'll just trigger a refresh
    // In a more sophisticated implementation, we'd update specific jobs
    const state = get();
    if (event.queue === state.selectedQueue) {
      // The component will handle refreshing
    }
  },
}));
