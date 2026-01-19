import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../store/index.ts";
import { useTerminalSize, getListViewportSize } from "../hooks/useTerminalSize.ts";

type Tab = "info" | "data" | "error" | "result";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "Info" },
  { id: "data", label: "Data" },
  { id: "error", label: "Error" },
  { id: "result", label: "Result" },
];

function formatJson(data: unknown, indent = 2): string {
  try {
    return JSON.stringify(data, null, indent);
  } catch {
    return String(data);
  }
}

function formatDate(ts?: number): string {
  if (!ts) return "-";
  return new Date(ts).toISOString();
}

function formatDuration(start?: number, end?: number): string {
  if (!start || !end) return "-";
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

export function JobDetail() {
  const { selectedJob, selectJob, view, selectedQueue } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const { rows } = useTerminalSize();
  const contentHeight = getListViewportSize(rows, 10);

  useInput(
    (input, key) => {
      if (view !== "job-detail") return;

      if (key.escape || input === "q" || input === "h") {
        selectJob(null);
      } else if (input === "H" || (key.shift && key.tab)) {
        const idx = TABS.findIndex((t) => t.id === activeTab);
        setActiveTab(TABS[(idx - 1 + TABS.length) % TABS.length]!.id);
      } else if (input === "L" || key.tab) {
        const idx = TABS.findIndex((t) => t.id === activeTab);
        setActiveTab(TABS[(idx + 1) % TABS.length]!.id);
      }
    },
    { isActive: view === "job-detail" }
  );

  if (!selectedJob) return null;

  const {
    id,
    name,
    data,
    progress,
    attemptsMade,
    timestamp,
    processedOn,
    finishedOn,
    failedReason,
    returnvalue,
    stacktrace,
  } = selectedJob;

  const hasError = !!failedReason || (stacktrace && stacktrace.length > 0);
  const hasResult = returnvalue !== undefined;

  return (
    <Box flexDirection="column">
      {/* Tabs */}
      <Box marginBottom={1}>
        {TABS.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const tabColor = 
            tab.id === "error" && hasError ? "red" : 
            tab.id === "result" && hasResult ? "green" : 
            "magenta";
          const showIndicator = (tab.id === "error" && hasError) || (tab.id === "result" && hasResult);
          const isLast = index === TABS.length - 1;

          return (
            <Box key={tab.id}>
              {isActive ? (
                <Text backgroundColor={tabColor} color="white" bold>
                  {` ${tab.label} `}
                </Text>
              ) : (
                <>
                  <Text color={showIndicator ? tabColor : "gray"} bold={showIndicator}>
                    {tab.label}
                  </Text>
                  {tab.id === "error" && hasError && <Text color="red" bold> !</Text>}
                  {tab.id === "result" && hasResult && <Text color="green" bold> *</Text>}
                </>
              )}
              {!isLast && <Text color="gray"> · </Text>}
            </Box>
          );
        })}
      </Box>

      {/* Content */}
      <Box flexDirection="column" height={contentHeight} paddingLeft={1}>
        {activeTab === "info" && (
          <Box flexDirection="column">
            <Box>
              <Text color="magenta" bold>{"Name".padEnd(12)}</Text>
              <Text color="white">{name || "default"}</Text>
            </Box>
            <Box>
              <Text color="magenta" bold>{"ID".padEnd(12)}</Text>
              <Text color="white">{id}</Text>
            </Box>
            <Box>
              <Text color="magenta" bold>{"Attempts".padEnd(12)}</Text>
              <Text color="white">{attemptsMade}</Text>
            </Box>
            <Box>
              <Text color="magenta" bold>{"Progress".padEnd(12)}</Text>
              <Text color="cyan" bold>{typeof progress === "number" ? `${progress}%` : formatJson(progress)}</Text>
            </Box>
            <Box marginTop={1}>
              <Text color="magenta" bold>{"Created".padEnd(12)}</Text>
              <Text color="white">{formatDate(timestamp)}</Text>
            </Box>
            <Box>
              <Text color="magenta" bold>{"Started".padEnd(12)}</Text>
              <Text color="white">{formatDate(processedOn)}</Text>
            </Box>
            <Box>
              <Text color="magenta" bold>{"Finished".padEnd(12)}</Text>
              <Text color="white">{formatDate(finishedOn)}</Text>
            </Box>
            <Box>
              <Text color="magenta" bold>{"Duration".padEnd(12)}</Text>
              <Text color="yellow" bold>{formatDuration(processedOn, finishedOn)}</Text>
            </Box>
            {hasError && (
              <Box marginTop={1}>
                <Text color="magenta" bold>{"Status".padEnd(12)}</Text>
                <Text color="red" bold>Failed</Text>
              </Box>
            )}
          </Box>
        )}

        {activeTab === "data" && (
          <Box flexDirection="column">
            <Text wrap="wrap" color="cyan">{formatJson(data)}</Text>
          </Box>
        )}

        {activeTab === "error" && (
          <Box flexDirection="column">
            {failedReason ? (
              <>
                <Box marginBottom={1}>
                  <Text color="red" bold>Error</Text>
                </Box>
                <Box marginBottom={1}>
                  <Text color="red">{failedReason}</Text>
                </Box>
                {stacktrace && stacktrace.length > 0 && (
                  <>
                    <Box marginBottom={1}>
                      <Text color="yellow" bold>Stacktrace</Text>
                    </Box>
                    {stacktrace.slice(0, contentHeight - 6).map((line, i) => (
                      <Text key={i} color="gray" wrap="truncate-end">{line}</Text>
                    ))}
                  </>
                )}
              </>
            ) : (
              <Text color="gray">No error information available</Text>
            )}
          </Box>
        )}

        {activeTab === "result" && (
          <Box flexDirection="column">
            {hasResult ? (
              <Text color="green" bold wrap="wrap">{formatJson(returnvalue)}</Text>
            ) : (
              <Text color="gray">No return value</Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
