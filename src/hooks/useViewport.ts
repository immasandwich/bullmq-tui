import { useState, useEffect, useMemo } from "react";

interface UseViewportOptions {
  itemCount: number;
  viewportSize: number;
  initialCursor?: number;
}

interface UseViewportResult {
  cursor: number;
  setCursor: (cursor: number | ((prev: number) => number)) => void;
  viewportStart: number;
  viewportEnd: number;
  visibleItems: <T>(items: T[]) => T[];
  scrollInfo: {
    showing: string;
    canScrollUp: boolean;
    canScrollDown: boolean;
  };
  moveUp: () => void;
  moveDown: () => void;
  goToTop: () => void;
  goToBottom: () => void;
  pageUp: () => void;
  pageDown: () => void;
}

export function useViewport({
  itemCount,
  viewportSize,
  initialCursor = 0,
}: UseViewportOptions): UseViewportResult {
  const [cursor, setCursorRaw] = useState(initialCursor);
  const [viewportStart, setViewportStart] = useState(0);

  // Clamp cursor to valid range when item count changes
  useEffect(() => {
    if (cursor >= itemCount && itemCount > 0) {
      setCursorRaw(itemCount - 1);
    }
  }, [itemCount, cursor]);

  // Adjust viewport when cursor moves outside visible area
  useEffect(() => {
    if (cursor < viewportStart) {
      setViewportStart(cursor);
    } else if (cursor >= viewportStart + viewportSize) {
      setViewportStart(cursor - viewportSize + 1);
    }
  }, [cursor, viewportStart, viewportSize]);

  const setCursor = (value: number | ((prev: number) => number)) => {
    setCursorRaw((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      return Math.max(0, Math.min(itemCount - 1, next));
    });
  };

  const viewportEnd = Math.min(viewportStart + viewportSize, itemCount);

  const visibleItems = <T,>(items: T[]): T[] => {
    return items.slice(viewportStart, viewportEnd);
  };

  const scrollInfo = useMemo(() => {
    if (itemCount === 0) {
      return { showing: "0 items", canScrollUp: false, canScrollDown: false };
    }
    const start = viewportStart + 1;
    const end = Math.min(viewportStart + viewportSize, itemCount);
    return {
      showing: `${start}-${end} of ${itemCount}`,
      canScrollUp: viewportStart > 0,
      canScrollDown: viewportEnd < itemCount,
    };
  }, [viewportStart, viewportSize, itemCount, viewportEnd]);

  const moveUp = () => setCursor((c) => c - 1);
  const moveDown = () => setCursor((c) => c + 1);
  const goToTop = () => {
    setCursorRaw(0);
    setViewportStart(0);
  };
  const goToBottom = () => {
    const newCursor = Math.max(0, itemCount - 1);
    setCursorRaw(newCursor);
    setViewportStart(Math.max(0, itemCount - viewportSize));
  };
  const pageUp = () => {
    const newCursor = Math.max(0, cursor - viewportSize);
    setCursorRaw(newCursor);
    setViewportStart(Math.max(0, viewportStart - viewportSize));
  };
  const pageDown = () => {
    const newCursor = Math.min(itemCount - 1, cursor + viewportSize);
    setCursorRaw(newCursor);
    setViewportStart(Math.min(Math.max(0, itemCount - viewportSize), viewportStart + viewportSize));
  };

  return {
    cursor,
    setCursor,
    viewportStart,
    viewportEnd,
    visibleItems,
    scrollInfo,
    moveUp,
    moveDown,
    goToTop,
    goToBottom,
    pageUp,
    pageDown,
  };
}
