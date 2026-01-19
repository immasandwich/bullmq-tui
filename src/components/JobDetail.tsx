import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { spawn } from "bun";
import { useStore } from "../store/index.ts";
import { useTerminalSize, getListViewportSize } from "../hooks/useTerminalSize.ts";

// Copy to clipboard using system command
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const cmd = process.platform === "darwin" ? "pbcopy" : "xclip";
    const args = process.platform === "darwin" ? [] : ["-selection", "clipboard"];
    const proc = spawn([cmd, ...args], { stdin: "pipe" });
    proc.stdin.write(text);
    proc.stdin.end();
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

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

function splitLines(text: string): string[] {
  return text.split("\n");
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
  const { selectedJob, selectJob, view } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const { rows } = useTerminalSize();
  const contentHeight = getListViewportSize(rows, 12);

  // Get raw content for copying
  const rawContent = useMemo(() => {
    if (!selectedJob) return "";
    if (activeTab === "data") {
      return formatJson(selectedJob.data);
    }
    if (activeTab === "result" && selectedJob.returnvalue !== undefined) {
      return formatJson(selectedJob.returnvalue);
    }
    if (activeTab === "error") {
      const parts: string[] = [];
      if (selectedJob.failedReason) {
        parts.push(selectedJob.failedReason);
      }
      if (selectedJob.stacktrace && selectedJob.stacktrace.length > 0) {
        parts.push(...selectedJob.stacktrace);
      }
      return parts.join("\n");
    }
    return "";
  }, [selectedJob, activeTab]);

  // Get content lines for display
  const contentLines = useMemo(() => {
    if (!selectedJob) return [];
    if (activeTab === "data") {
      return splitLines(formatJson(selectedJob.data));
    }
    if (activeTab === "result" && selectedJob.returnvalue !== undefined) {
      return splitLines(formatJson(selectedJob.returnvalue));
    }
    if (activeTab === "error") {
      const lines: string[] = [];
      if (selectedJob.failedReason) {
        lines.push("Error:", selectedJob.failedReason, "");
      }
      if (selectedJob.stacktrace && selectedJob.stacktrace.length > 0) {
        lines.push("Stacktrace:");
        lines.push(...selectedJob.stacktrace);
      }
      return lines;
    }
    return [];
  }, [selectedJob, activeTab]);

  // Reset scroll when changing tabs
  const handleTabChange = (newTab: Tab) => {
    setActiveTab(newTab);
  };

  useInput(
    (input, key) => {
      if (view !== "job-detail") return;

      if (key.escape || input === "q" || input === "h") {
        selectJob(null);
      } else if (input === "H" || (key.shift && key.tab)) {
        const idx = TABS.findIndex((t) => t.id === activeTab);
        handleTabChange(TABS[(idx - 1 + TABS.length) % TABS.length]!.id);
      } else if (input === "L" || key.tab) {
        const idx = TABS.findIndex((t) => t.id === activeTab);
        handleTabChange(TABS[(idx + 1) % TABS.length]!.id);
      } else if (input === "y" && activeTab !== "info" && rawContent) {
        copyToClipboard(rawContent).then((success) => {
          setCopyStatus(success ? "copied" : "failed");
          setTimeout(() => setCopyStatus("idle"), 2000);
        });
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
      <Box marginBottom={1} justifyContent="space-between">
        <Box>
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
        {copyStatus === "copied" && <Text color="green">Copied!</Text>}
        {copyStatus === "failed" && <Text color="red">Copy failed</Text>}
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
            {contentLines.length === 0 ? (
              <Text color="gray">No data</Text>
            ) : (
              contentLines.slice(0, contentHeight).map((line, i) => (
                <Text key={i} color="cyan" wrap="truncate-end">{line}</Text>
              ))
            )}
          </Box>
        )}

        {activeTab === "error" && (
          <Box flexDirection="column">
            {!hasError ? (
              <Text color="gray">No error information available</Text>
            ) : (
              contentLines.slice(0, contentHeight).map((line, i) => {
                const isErrorLabel = line === "Error:";
                const isStacktraceLabel = line === "Stacktrace:";
                return (
                  <Text
                    key={i}
                    color={isErrorLabel ? "red" : isStacktraceLabel ? "yellow" : "gray"}
                    bold={isErrorLabel || isStacktraceLabel}
                    wrap="truncate-end"
                  >
                    {line}
                  </Text>
                );
              })
            )}
          </Box>
        )}

        {activeTab === "result" && (
          <Box flexDirection="column">
            {!hasResult ? (
              <Text color="gray">No return value</Text>
            ) : (
              contentLines.slice(0, contentHeight).map((line, i) => (
                <Text key={i} color="green" wrap="truncate-end">{line}</Text>
              ))
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
