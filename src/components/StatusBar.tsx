import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store/index.ts";

export function StatusBar() {
  const { connectionStatus, connectionError, view, isFilteringQueues } = useStore();

  const statusIndicator = (() => {
    switch (connectionStatus) {
      case "connected":
        return <Text color="green">● Connected</Text>;
      case "connecting":
        return <Text color="yellow">◐ Connecting</Text>;
      case "error":
        return <Text color="red">✕ {connectionError?.slice(0, 30)}</Text>;
      default:
        return <Text color="gray">○ Disconnected</Text>;
    }
  })();

  const getHelp = () => {
    if (view === "queues" && isFilteringQueues) {
      return (
        <>
          <Text color="yellow">Enter</Text><Text dimColor> confirm </Text>
          <Text color="yellow">Esc</Text><Text dimColor> cancel</Text>
        </>
      );
    }
    if (view === "queues") {
      return (
        <>
          <Text color="cyan">j/k</Text><Text dimColor> nav </Text>
          <Text color="cyan">l</Text><Text dimColor> select </Text>
          <Text color="cyan">/</Text><Text dimColor> filter </Text>
          <Text color="cyan">q</Text><Text dimColor> quit</Text>
        </>
      );
    }
    if (view === "jobs") {
      return (
        <>
          <Text color="cyan">j/k</Text><Text dimColor> nav </Text>
          <Text color="cyan">H/L</Text><Text dimColor> tab </Text>
          <Text color="cyan">l</Text><Text dimColor> view </Text>
          <Text color="cyan">h</Text><Text dimColor> back</Text>
        </>
      );
    }
    if (view === "job-detail") {
      return (
        <>
          <Text color="cyan">H/L</Text><Text dimColor> tab </Text>
          <Text color="cyan">h</Text><Text dimColor> back</Text>
        </>
      );
    }
    return null;
  };

  return (
    <Box paddingX={1} justifyContent="space-between">
      <Box gap={1}>
        {getHelp()}
      </Box>
      {statusIndicator}
    </Box>
  );
}
