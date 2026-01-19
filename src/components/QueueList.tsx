import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { useStore } from "../store/index.ts";
import { useViewport } from "../hooks/useViewport.ts";
import { useTerminalSize, getListViewportSize } from "../hooks/useTerminalSize.ts";

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function QueueList() {
  const {
    queueNames,
    queues,
    selectQueue,
    view,
    connectionStatus,
    queueFilter,
    setQueueFilter,
    isFilteringQueues,
    setIsFilteringQueues,
  } = useStore();
  const [lastKey, setLastKey] = useState<string | null>(null);
  const { rows } = useTerminalSize();
  const viewportSize = getListViewportSize(rows, 8);

  const filteredQueues = useMemo(() => {
    if (!queueFilter.trim()) return queueNames;
    const lower = queueFilter.toLowerCase();
    return queueNames.filter((name) => name.toLowerCase().includes(lower));
  }, [queueNames, queueFilter]);

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
    itemCount: filteredQueues.length,
    viewportSize,
  });

  React.useEffect(() => {
    setCursor(0);
  }, [queueFilter]);

  useInput(
    (input, key) => {
      if (view !== "queues") return;

      if (isFilteringQueues) {
        if (key.escape) {
          setQueueFilter("");
          setIsFilteringQueues(false);
        } else if (key.return) {
          setIsFilteringQueues(false);
        }
        return;
      }

      if (input === "/") {
        setIsFilteringQueues(true);
        setLastKey(null);
      } else if (key.escape) {
        if (queueFilter) setQueueFilter("");
        setLastKey(null);
      } else if (key.upArrow || input === "k") {
        moveUp();
        setLastKey(null);
      } else if (key.downArrow || input === "j") {
        moveDown();
        setLastKey(null);
      } else if (key.return || input === "l") {
        const name = filteredQueues[cursor];
        if (name) selectQueue(name);
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
    { isActive: view === "queues" }
  );

  if (connectionStatus === "connecting") {
    return (
      <Box flexDirection="column">
        <Box paddingLeft={1}>
          <Text color="magenta">
            <Spinner type="dots" />
          </Text>
          <Text color="white"> Connecting to Redis...</Text>
        </Box>
      </Box>
    );
  }

  if (connectionStatus === "error") {
    return (
      <Box flexDirection="column">
        <Box paddingLeft={1}>
          <Text color="red" bold>Connection failed</Text>
          <Text color="white"> - check your Redis settings</Text>
        </Box>
      </Box>
    );
  }

  if (queueNames.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box paddingLeft={1}>
          <Text color="gray">No queues found in this Redis instance</Text>
        </Box>
      </Box>
    );
  }

  const maxNameLen = Math.min(35, Math.max(...queueNames.map((n) => n.length)));
  const visibleQueues = visibleItems(filteredQueues);



  return (
    <Box flexDirection="column">
      {/* Filter input */}
      {isFilteringQueues && (
        <Box marginBottom={1} paddingLeft={1}>
          <Text color="yellow">/</Text>
          <Text> </Text>
          <TextInput
            value={queueFilter}
            onChange={setQueueFilter}
            placeholder="type to filter..."
          />
        </Box>
      )}

      {/* Active filter display */}
      {!isFilteringQueues && queueFilter && (
        <Box marginBottom={1} paddingLeft={1}>
          <Text color="white">filter: </Text>
          <Text color="yellow" bold>{queueFilter}</Text>
          <Text color="gray"> ({filteredQueues.length}/{queueNames.length} matching)</Text>
        </Box>
      )}

      {/* Column headers */}
      <Box marginBottom={0} paddingLeft={1}>
        <Text color="white" bold>
          {"  "}{"Name".padEnd(maxNameLen + 2)}
          {"Active".padStart(8)}
          {"Wait".padStart(8)}
          {"Fail".padStart(8)}
          {"Done".padStart(10)}
        </Text>
      </Box>
      <Box marginBottom={1} paddingLeft={1}>
        <Text color="magenta">{"─".repeat(maxNameLen + 40)}</Text>
      </Box>

      {/* Scroll up indicator */}
      {scrollInfo.canScrollUp && (
        <Box paddingLeft={1}>
          <Text color="cyan">  ↑ {viewportStart} more</Text>
        </Box>
      )}

      {/* No results */}
      {filteredQueues.length === 0 && queueFilter && (
        <Box paddingLeft={2}>
          <Text color="white">No queues match "</Text>
          <Text color="yellow" bold>{queueFilter}</Text>
          <Text color="white">"</Text>
        </Box>
      )}

      {/* Queue rows */}
      {visibleQueues.map((name, i) => {
        const actualIndex = viewportStart + i;
        const info = queues.get(name);
        const isSelected = cursor === actualIndex;
        const counts = info?.counts;

        const active = counts?.active ?? 0;
        const waiting = counts?.waiting ?? 0;
        const failed = counts?.failed ?? 0;
        const completed = counts?.completed ?? 0;

        return (
          <Box key={name} paddingLeft={1}>
            <Text
              backgroundColor={isSelected ? "magenta" : undefined}
              color={isSelected ? "white" : undefined}
            >
              <Text color={isSelected ? "white" : "magenta"} bold>{isSelected ? " ▸ " : "   "}</Text>
              <Text bold={isSelected} color={isSelected ? "white" : "white"}>
                {name.length > maxNameLen ? name.slice(0, maxNameLen - 1) + "…" : name.padEnd(maxNameLen)}
              </Text>
              {info?.isPaused ? <Text color={isSelected ? "white" : "yellow"} bold> ⏸</Text> : <Text>  </Text>}
              <Text color={isSelected ? "white" : active > 0 ? "yellow" : "gray"} bold={active > 0}>
                {formatCount(active).padStart(8)}
              </Text>
              <Text color={isSelected ? "white" : waiting > 0 ? "cyan" : "gray"} bold={waiting > 0}>
                {formatCount(waiting).padStart(8)}
              </Text>
              <Text color={isSelected ? "white" : failed > 0 ? "red" : "gray"} bold={failed > 0}>
                {formatCount(failed).padStart(8)}
              </Text>
              <Text color={isSelected ? "white" : completed > 0 ? "green" : "gray"} bold={completed > 0}>
                {formatCount(completed).padStart(10)}
              </Text>
              {isSelected && <Text> </Text>}
            </Text>
          </Box>
        );
      })}

      {/* Scroll down indicator */}
      {scrollInfo.canScrollDown && (
        <Box paddingLeft={1}>
          <Text color="cyan">  ↓ {filteredQueues.length - viewportStart - viewportSize} more</Text>
        </Box>
      )}
    </Box>
  );
}
