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

  // Breadcrumb based on current view
  const breadcrumb = (() => {
    const filteredCount = queueFilter 
      ? queueNames.filter(n => n.toLowerCase().includes(queueFilter.toLowerCase())).length
      : queueNames.length;

    if (view === "queues") {
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
          <Text color="white">Queues / </Text>
          <Text color="magenta" bold>{selectedQueue}</Text>
          {queueInfo?.isPaused && <Text color="yellow" bold> (paused)</Text>}
        </>
      );
    }
    if (view === "job-detail" && selectedQueue && selectedJob) {
      return (
        <>
          <Text color="white">Queues / {selectedQueue} / </Text>
          <Text color="magenta" bold>#{selectedJob.id}</Text>
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
          <Text color="magenta" bold>enter</Text><Text color="white"> open</Text>
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
          <Text color="magenta" bold>enter</Text><Text color="white"> view</Text>
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
        borderStyle="single"
        borderColor="magenta"
        borderTop={false}
        borderLeft={false}
        borderRight={false}
      >
        <Box>
          {breadcrumb}
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

      {/* Main content area with left accent border */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left accent */}
        <Box width={1} flexDirection="column">
          {Array.from({ length: rows - 2 }, (_, i) => (
            <Text key={`border-${i}`} color="magenta">│</Text>
          ))}
        </Box>
        
        {/* Content */}
        <Box flexGrow={1} flexDirection="column" paddingLeft={1}>
          {children}
        </Box>
      </Box>

      {/* Bottom bar - help and status */}
      <Box 
        paddingX={1} 
        justifyContent="space-between"
        borderStyle="single"
        borderColor="magenta"
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
      >
        <Box>{helpText}</Box>
        {statusText}
      </Box>
    </Box>
  );
}
