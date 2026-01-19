import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { useStore } from "../store/index.ts";
import { useViewport } from "../hooks/useViewport.ts";
import { useTerminalSize, getListViewportSize } from "../hooks/useTerminalSize.ts";
import type { JobStatus } from "../adapter/types.ts";

const STATUS_TABS: { id: JobStatus; label: string; color: string }[] = [
  { id: "active", label: "Active", color: "yellow" },
  { id: "waiting", label: "Waiting", color: "cyan" },
  { id: "failed", label: "Failed", color: "red" },
  { id: "completed", label: "Done", color: "green" },
  { id: "delayed", label: "Delayed", color: "magenta" },
];

function formatAge(ts?: number): string {
  if (!ts) return "-";
  const diff = Date.now() - ts;
  if (diff < 1000) return "now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function formatProgress(progress: unknown): string {
  if (typeof progress === "number") return `${progress}%`;
  if (progress && typeof progress === "object") return JSON.stringify(progress).slice(0, 10);
  return "-";
}

export function JobList() {
  const {
    selectedQueue,
    jobs,
    jobStatusFilter,
    setJobStatusFilter,
    selectJob,
    selectQueue,
    view,
    queues,
    connectionStatus,
  } = useStore();

  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loadingFilter, setLoadingFilter] = useState<string | null>(jobStatusFilter);
  const { rows } = useTerminalSize();
  const viewportSize = getListViewportSize(rows, 10);

  const {
    cursor,
    visibleItems,
    scrollInfo,
    moveUp,
    moveDown,
    goToTop,
    goToBottom,
    pageUp,
    pageDown,
    viewportStart,
    setCursor,
  } = useViewport({
    itemCount: jobs.length,
    viewportSize,
  });

  const queueInfo = selectedQueue ? queues.get(selectedQueue) : null;

  // Reset cursor when filter or queue changes
  useEffect(() => {
    setCursor(0);
    setLoadingFilter(jobStatusFilter);
  }, [jobStatusFilter, selectedQueue]);

  // Mark loading complete when jobs arrive for current filter
  useEffect(() => {
    if (loadingFilter === jobStatusFilter) {
      setLoadingFilter(null);
    }
  }, [jobs]);

  useInput(
    (input, key) => {
      if (view !== "jobs") return;

      if (key.upArrow || input === "k") {
        moveUp();
        setLastKey(null);
      } else if (key.downArrow || input === "j") {
        moveDown();
        setLastKey(null);
      } else if (key.return || input === "l") {
        const job = jobs[cursor];
        if (job) selectJob(job);
        setLastKey(null);
      } else if (key.escape || input === "q" || input === "h") {
        selectQueue(null);
        setLastKey(null);
      } else if (key.tab || input === "L") {
        const idx = STATUS_TABS.findIndex((t) => t.id === jobStatusFilter);
        setJobStatusFilter(STATUS_TABS[(idx + 1) % STATUS_TABS.length]!.id);
        setLastKey(null);
      } else if ((key.shift && key.tab) || input === "H") {
        const idx = STATUS_TABS.findIndex((t) => t.id === jobStatusFilter);
        setJobStatusFilter(STATUS_TABS[(idx - 1 + STATUS_TABS.length) % STATUS_TABS.length]!.id);
        setLastKey(null);
      } else if (input === "G") {
        goToBottom();
        setLastKey(null);
      } else if (input === "g") {
        if (lastKey === "g") {
          goToTop();
          setLastKey(null);
        } else {
          setLastKey("g");
        }
      } else if (key.ctrl && input === "d") {
        pageDown();
        setLastKey(null);
      } else if (key.ctrl && input === "u") {
        pageUp();
        setLastKey(null);
      } else {
        setLastKey(null);
      }
    },
    { isActive: view === "jobs" }
  );

  if (!selectedQueue) return null;

  const visibleJobs = visibleItems(jobs);

  return (
    <Box flexDirection="column">
      {/* Status tabs */}
      <Box marginBottom={1}>
        {STATUS_TABS.map((tab, index) => {
          const isActive = tab.id === jobStatusFilter;
          const count = queueInfo?.counts?.[tab.id] ?? 0;
          const hasItems = count > 0;
          const isLast = index === STATUS_TABS.length - 1;

          return (
            <Box key={tab.id}>
              {isActive ? (
                <Text backgroundColor={tab.color} color="black" bold>
                  {` ${tab.label} ${count} `}
                </Text>
              ) : (
                <>
                  <Text color={hasItems ? tab.color : "gray"} bold={hasItems}>
                    {tab.label}
                  </Text>
                  {hasItems && <Text color="white"> {count}</Text>}
                </>
              )}
              {!isLast && <Text color="gray"> · </Text>}
            </Box>
          );
        })}
      </Box>

      {/* Loading */}
      {loadingFilter && connectionStatus === "connected" && (
        <Box paddingLeft={1}>
          <Text color="magenta">
            <Spinner type="dots" />
          </Text>
          <Text color="white"> Loading jobs...</Text>
        </Box>
      )}

      {/* Empty */}
      {!loadingFilter && jobs.length === 0 && (
        <Box paddingLeft={1}>
          <Text color="gray">No {jobStatusFilter} jobs in this queue</Text>
        </Box>
      )}

      {/* Job list */}
      {!loadingFilter && jobs.length > 0 && (
        <>
          {/* Headers */}
          <Box marginBottom={1} paddingLeft={1}>
            <Text backgroundColor="gray" color="white" bold>
              {"   "}{"ID".padEnd(14)}{"Name".padEnd(22)}{"Progress".padEnd(10)}{"Age".padEnd(8)}{"  "}
            </Text>
          </Box>

          {/* Scroll up */}
          {scrollInfo.canScrollUp && (
            <Box paddingLeft={1}>
              <Text color="cyan">   ↑ {viewportStart} more</Text>
            </Box>
          )}

          {visibleJobs.map((job, i) => {
            const actualIndex = viewportStart + i;
            const isSelected = cursor === actualIndex;
            const hasError = !!job.failedReason;

            return (
              <Box key={job.id} paddingLeft={1}>
                <Text
                  backgroundColor={isSelected ? "magenta" : undefined}
                  color={isSelected ? "white" : hasError ? "red" : "white"}
                >
                  <Text color={isSelected ? "white" : "magenta"} bold>{isSelected ? " ▸ " : "   "}</Text>
                  <Text bold={isSelected}>
                    {(job.id?.slice(0, 12) ?? "?").padEnd(14)}
                    {(job.name?.slice(0, 20) ?? "default").padEnd(22)}
                    {formatProgress(job.progress).padEnd(10)}
                    {formatAge(job.timestamp).padEnd(8)}
                  </Text>
                  {isSelected && <Text> </Text>}
                </Text>
              </Box>
            );
          })}

          {/* Scroll down */}
          {scrollInfo.canScrollDown && (
            <Box paddingLeft={1}>
              <Text color="cyan">   ↓ {jobs.length - viewportStart - viewportSize} more</Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
