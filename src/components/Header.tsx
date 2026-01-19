import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../store/index.ts";

export function Header() {
  const { view, selectedQueue, queueFilter, connectionStatus } = useStore();

  // Breadcrumb path
  const getBreadcrumb = () => {
    const parts: React.ReactNode[] = [
      <Text key="home" color="cyan" bold>
        BullMQ
      </Text>,
    ];

    if (view === "queues") {
      parts.push(
        <Text key="sep1" dimColor> › </Text>,
        <Text key="queues" color="white">Queues</Text>
      );
      if (queueFilter) {
        parts.push(
          <Text key="filter" dimColor> (filtered)</Text>
        );
      }
    } else if (view === "jobs" && selectedQueue) {
      parts.push(
        <Text key="sep1" dimColor> › </Text>,
        <Text key="queues" dimColor>Queues</Text>,
        <Text key="sep2" dimColor> › </Text>,
        <Text key="queue" color="white">{selectedQueue}</Text>
      );
    } else if (view === "job-detail" && selectedQueue) {
      parts.push(
        <Text key="sep1" dimColor> › </Text>,
        <Text key="queues" dimColor>Queues</Text>,
        <Text key="sep2" dimColor> › </Text>,
        <Text key="queue" dimColor>{selectedQueue}</Text>,
        <Text key="sep3" dimColor> › </Text>,
        <Text key="job" color="white">Job Details</Text>
      );
    }

    return parts;
  };

  // Connection indicator
  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case "connected":
        return <Text color="green">● Connected</Text>;
      case "connecting":
        return <Text color="yellow">◐ Connecting...</Text>;
      case "error":
        return <Text color="red">✕ Error</Text>;
      default:
        return <Text color="gray">○ Disconnected</Text>;
    }
  };

  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      justifyContent="space-between"
    >
      <Box>{getBreadcrumb()}</Box>
      <Box>{getConnectionIndicator()}</Box>
    </Box>
  );
}
