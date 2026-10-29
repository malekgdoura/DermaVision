import { z } from "zod";

// Zod schemas for Groq chat completions (OpenAI-compatible).
// Reference: https://console.groq.com/docs/api-reference#chat-create
// Unknown fields are ignored rather than rejected.

export const groqChatCompletionSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z
    .array(
      z.object({
        index: z.number().int(),
        message: z.object({
          role: z.string(),
          content: z.string().nullable(),
        }),
        // "stop" when complete, "length" when cut by max tokens.
        finish_reason: z.string().nullable(),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative(),
      completion_tokens: z.number().int().nonnegative(),
      total_tokens: z.number().int().nonnegative(),
    })
    .optional(),
});

export const groqErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string().optional(),
    code: z.string().nullable().optional(),
  }),
});

export type GroqChatCompletion = z.infer<typeof groqChatCompletionSchema>;
