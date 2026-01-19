import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

export interface ConfigAnswers {
  host: string;
  port: number;
  password?: string;
}

interface ConfigPromptProps {
  defaults: {
    host?: string;
    port?: number;
  };
  onComplete: (answers: ConfigAnswers) => void;
}

type Step = "host" | "port" | "password";

export function ConfigPrompt({ defaults, onComplete }: ConfigPromptProps) {
  const [step, setStep] = useState<Step>("host");
  const [host, setHost] = useState(defaults.host ?? "");
  const [port, setPort] = useState(defaults.port?.toString() ?? "6379");
  const [password, setPassword] = useState("");

  const handleSubmit = (value: string) => {
    if (step === "host") {
      setHost(value || "localhost");
      setStep("port");
    } else if (step === "port") {
      setPort(value || "6379");
      setStep("password");
    } else if (step === "password") {
      onComplete({
        host: host || "localhost",
        port: parseInt(port, 10) || 6379,
        password: value || undefined,
      });
    }
  };


  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          BullMQ TUI - Redis Connection Setup
        </Text>
      </Box>

      {/* Host */}
      <Box>
        <Text>Redis Host: </Text>
        {step === "host" ? (
          <TextInput
            value={host}
            onChange={setHost}
            onSubmit={handleSubmit}
            placeholder="localhost"
          />
        ) : (
          <Text color="green">{host || "localhost"}</Text>
        )}
      </Box>

      {/* Port */}
      {(step === "port" || step === "password") && (
        <Box>
          <Text>Redis Port: </Text>
          {step === "port" ? (
            <TextInput
              value={port}
              onChange={setPort}
              onSubmit={handleSubmit}
              placeholder="6379"
            />
          ) : (
            <Text color="green">{port || "6379"}</Text>
          )}
        </Box>
      )}

      {/* Password */}
      {step === "password" && (
        <Box>
          <Text>Redis Password: </Text>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handleSubmit}
            placeholder="(empty for none)"
            mask="*"
          />
        </Box>
      )}
    </Box>
  );
}
