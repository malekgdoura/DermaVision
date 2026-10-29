import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createChatCompletion } from "./client";
import { resetGroqConfigCache } from "./config";

const messages = [{ role: "user" as const, content: "Hello" }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function completion(content: string | null, finishReason = "stop") {
  return {
    id: "chatcmpl-1",
    model: "llama-3.3-70b-versatile",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: finishReason }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  };
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  resetGroqConfigCache();
  vi.stubEnv("GROQ_API_KEY", "test-key");
  vi.stubEnv("GROQ_MODEL", "");
  vi.stubEnv("GROQ_BASE_URL", "");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("createChatCompletion", () => {
  it("sends the request to Groq with the key and the default model", async () => {
    fetchMock.mockResolvedValue(jsonResponse(completion("Draft text")));

    const result = await createChatCompletion({ messages, temperature: 0.2, maxTokens: 500 });

    expect(result).toEqual({
      ok: true,
      data: { content: "Draft text", model: "llama-3.3-70b-versatile", truncated: false },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init?.body as string)).toMatchObject({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.2,
      max_completion_tokens: 500,
    });
  });

  it("uses GROQ_MODEL when it is set", async () => {
    vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-120b");
    fetchMock.mockResolvedValue(jsonResponse(completion("Draft")));

    await createChatCompletion({ messages });

    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string).model).toBe("openai/gpt-oss-120b");
  });

  it("flags a draft cut by the token limit", async () => {
    fetchMock.mockResolvedValue(jsonResponse(completion("Draft cut", "length")));
    const result = await createChatCompletion({ messages });
    expect(result.ok && result.data.truncated).toBe(true);
  });

  it("refuses to call Groq without a key", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const result = await createChatCompletion({ messages });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe("configuration");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, { error: { message: "Invalid API Key", code: "invalid_api_key" } }, "configuration", false],
    [429, { error: { message: "Rate limit", code: "rate_limit_exceeded" } }, "rate_limited", true],
    [400, { error: { message: "decommissioned", code: "model_decommissioned" } }, "model_unavailable", false],
    [404, { error: { message: "not found" } }, "model_unavailable", false],
    [500, { error: { message: "boom" } }, "provider", true],
  ])("maps HTTP %i to %s", async (status, body, kind, retryable) => {
    fetchMock.mockResolvedValue(jsonResponse(body, status));

    const result = await createChatCompletion({ messages });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe(kind);
      expect(result.error.retryable).toBe(retryable);
      // The raw provider message is never exposed.
      expect(result.error.message).not.toContain(body.error.message);
    }
  });

  it("treats a non-JSON error page as a provider error", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));
    const result = await createChatCompletion({ messages });
    expect(!result.ok && result.error.kind).toBe("provider");
  });

  it("reports network failures and timeouts", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const network = await createChatCompletion({ messages });
    expect(!network.ok && network.error.kind).toBe("network");

    fetchMock.mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"));
    const timeout = await createChatCompletion({ messages });
    expect(!timeout.ok && timeout.error.kind).toBe("timeout");
  });

  it("rejects unexpected or empty answers", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ unexpected: true }));
    const invalid = await createChatCompletion({ messages });
    expect(!invalid.ok && invalid.error.kind).toBe("invalid_response");

    fetchMock.mockResolvedValueOnce(jsonResponse(completion("   ")));
    const empty = await createChatCompletion({ messages });
    expect(!empty.ok && empty.error.kind).toBe("empty_draft");
  });
});
