import { useState, useEffect } from "react";

interface TerminalSize {
  columns: number;
  rows: number;
}

export function useTerminalSize(): TerminalSize {
  const [size, setSize] = useState<TerminalSize>({
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        columns: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
      });
    };

    process.stdout.on("resize", handleResize);
    return () => {
      process.stdout.off("resize", handleResize);
    };
  }, []);

  return size;
}

/**
 * Calculate available viewport rows for a list, accounting for UI chrome
 * (header, footer, status bar, borders, etc.)
 */
export function getListViewportSize(terminalRows: number, chromeRows: number = 10): number {
  // Reserve rows for: header, column headers, legend/help, status bar, padding, scroll indicators
  return Math.max(5, terminalRows - chromeRows);
}
