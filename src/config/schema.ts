import { z } from "zod";

export const configSchema = z.object({
  redis: z.object({
    host: z.string().default("localhost"),
    port: z.coerce.number().default(6379),
    password: z.string().optional(),
    db: z.coerce.number().default(0),
  }),
  mcp: z
    .object({
      enabled: z.boolean().default(false),
      port: z.coerce.number().default(3333),
      host: z.string().default("127.0.0.1"),
    })
    .optional(),
});

export type Config = z.infer<typeof configSchema>;
