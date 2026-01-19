import React from "react";
import { Box, Text } from "ink";

type Color = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | 
  "redBright" | "greenBright" | "yellowBright" | "blueBright" | "magentaBright" | "cyanBright" | "whiteBright" |
  `#${string}`;

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  borderColor?: Color;
  focused?: boolean;
  width?: number | string;
  height?: number;
  padding?: number;
}

/**
 * A panel component with a title and border
 * When focused, the border is brighter
 */
export function Panel({
  children,
  title,
  borderColor = "gray",
  focused = false,
  width,
  height,
  padding = 1,
}: PanelProps) {
  const actualBorderColor = focused ? "cyanBright" : borderColor;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={actualBorderColor}
      width={width}
      height={height}
      paddingX={padding}
    >
      {title && (
        <Box marginTop={-1} marginLeft={1} marginBottom={0}>
          <Text color={actualBorderColor} bold={focused}>
            {" "}{title}{" "}
          </Text>
        </Box>
      )}
      {children}
    </Box>
  );
}

interface StatBoxProps {
  label: string;
  value: number | string;
  color?: Color;
  active?: boolean;
}

/**
 * A small stat box showing a label and value
 */
export function StatBox({ label, value, color = "gray", active = false }: StatBoxProps) {
  const displayColor = active ? color : "gray";
  
  return (
    <Box borderStyle="round" borderColor={displayColor} paddingX={1}>
      <Text color={displayColor} bold={active}>
        {label}: {value}
      </Text>
    </Box>
  );
}

interface TabBarProps {
  tabs: { id: string; label: string; count?: number; color?: Color }[];
  activeTab: string;
  onChange?: (id: string) => void;
}

/**
 * A tab bar for switching between views
 */
export function TabBar({ tabs, activeTab }: TabBarProps) {
  return (
    <Box gap={1}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const hasCount = tab.count !== undefined && tab.count > 0;
        const color = tab.color || "white";

        return (
          <Box
            key={tab.id}
            borderStyle={isActive ? "round" : "single"}
            borderColor={isActive ? color : "gray"}
            paddingX={1}
          >
            <Text color={isActive ? color : hasCount ? color : "gray"} bold={isActive}>
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
