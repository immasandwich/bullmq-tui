import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store/index.ts";
import { useTerminalSize } from "../hooks/useTerminalSize.ts";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { connectionStatus, connectionError, queueNames, queues, view, isFilteringQueues, selectedQueue, selectedJob, queueFilter } = useStore();
  const { columns, rows } = useTerminalSize();

  // Calculate totals
  const totals = queueNames.reduce(
    (acc, n) => {
      const c = queues.get(n)?.counts;
      return {
        active: acc.active + (c?.active ?? 0),
        waiting: acc.waiting + (c?.waiting ?? 0),
        failed: acc.failed + (c?.failed ?? 0),
        completed: acc.completed + (c?.completed ?? 0),
      };
    },
    { active: 0, waiting: 0, failed: 0, completed: 0 }
  );

  const totalJobs = totals.active + totals.waiting + totals.failed + totals.completed;

  // Title based on current view
  const title = (() => {
    if (view === "queues") {
      const filteredCount = queueFilter 
        ? queueNames.filter(n => n.toLowerCase().includes(queueFilter.toLowerCase())).length
        : queueNames.length;
      return (
        <>
          <Text color="magenta" bold>Queues</Text>
          <Text color="white"> ({filteredCount})</Text>
          {queueFilter && <Text color="yellow"> filtered</Text>}
        </>
      );
    }
    if (view === "jobs" && selectedQueue) {
      const queueInfo = queues.get(selectedQueue);
      return (
        <>
          <Text color="magenta" bold>{selectedQueue}</Text>
          {queueInfo?.isPaused && <Text color="yellow" bold> (paused)</Text>}
        </>
      );
    }
    if (view === "job-detail" && selectedJob) {
      const jobId = selectedJob.id;
      const maxIdLen = 20;
      const displayId = jobId.length > maxIdLen
        ? `${jobId.slice(0, 8)}...${jobId.slice(-8)}`
        : jobId;
      return (
        <>
          <Text color="magenta" bold>#{displayId}</Text>
          {selectedJob.name && selectedJob.name !== "default" && (
            <Text color="cyan"> ({selectedJob.name})</Text>
          )}
        </>
      );
    }
    return <Text color="magenta" bold>Queues</Text>;
  })();

  // Status text
  const statusText = (() => {
    switch (connectionStatus) {
      case "connected":
        return <Text color="green">● connected</Text>;
      case "connecting":
        return <Text color="yellow">◐ connecting</Text>;
      case "error":
        return <Text color="red">✕ {connectionError?.slice(0, 20)}</Text>;
      default:
        return <Text color="gray">○ disconnected</Text>;
    }
  })();

  // Help text based on view - vibrant colors
  const helpText = (() => {
    if (view === "queues" && isFilteringQueues) {
      return (
        <>
          <Text backgroundColor="yellow" color="black" bold> enter </Text>
          <Text color="white"> confirm </Text>
          <Text backgroundColor="gray" color="white" bold> esc </Text>
          <Text color="white"> cancel</Text>
        </>
      );
    }
    if (view === "queues") {
      return (
        <>
          <Text color="magenta" bold>j/k</Text><Text color="white"> nav</Text>
          <Text color="gray">  </Text>
          <Text color="magenta" bold>/</Text><Text color="white"> filter</Text>
          <Text color="gray">  </Text>
          <Text color="magenta" bold>l/enter</Text><Text color="white"> open</Text>
          <Text color="gray">  </Text>
          <Text color="magenta" bold>q</Text><Text color="white"> quit</Text>
        </>
      );
    }
    if (view === "jobs") {
      return (
        <>
          <Text color="magenta" bold>j/k</Text><Text color="white"> nav</Text>
          <Text color="gray">  </Text>
          <Text color="magenta" bold>H/L</Text><Text color="white"> status</Text>
          <Text color="gray">  </Text>
          <Text color="magenta" bold>l/enter</Text><Text color="white"> view</Text>
          <Text color="gray">  </Text>
          <Text color="magenta" bold>h</Text><Text color="white"> back</Text>
        </>
      );
    }
    if (view === "job-detail") {
      return (
        <>
          <Text color="magenta" bold>H/L</Text><Text color="white"> tabs</Text>
          <Text color="gray">  </Text>
          <Text color="magenta" bold>h</Text><Text color="white"> back</Text>
        </>
      );
    }
    return null;
  })();

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      {/* Top bar - breadcrumb and stats */}
      <Box 
        paddingX={1} 
        justifyContent="space-between"
        marginBottom={1}
      >
        <Box>
          {title}
        </Box>
        <Box gap={2}>
          <Text>
            <Text color="yellow" bold>{totals.active}</Text>
            <Text color="white"> active</Text>
          </Text>
          <Text>
            <Text color="cyan" bold>{totals.waiting}</Text>
            <Text color="white"> wait</Text>
          </Text>
          <Text>
            <Text color={totals.failed > 0 ? "red" : "gray"} bold>{totals.failed}</Text>
            <Text color="white"> fail</Text>
          </Text>
          <Text>
            <Text color="green" bold>{totals.completed}</Text>
            <Text color="white"> done</Text>
          </Text>
        </Box>
      </Box>

      {/* Main content area */}
      <Box flexGrow={1} flexDirection="column" paddingX={1}>
        {children}
      </Box>

      {/* Bottom bar - help and status */}
      <Box 
        paddingX={1} 
        justifyContent="space-between"
        marginTop={1}
      >
        <Box>{helpText}</Box>
        {statusText}
      </Box>
    </Box>
  );
}
