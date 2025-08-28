//
// Perplexity API client for streaming chat responses
// Reads API key from environment variables and exposes a simple sendChatPrompt function.
//

// PUBLIC_INTERFACE
export async function sendChatPrompt({ prompt, onToken, onStart, onComplete, onError }) {
  /**
   * This is a public function to stream a response from Perplexity given a user prompt.
   * Params:
   *  - prompt: string user message
   *  - onToken: function(token: string) called for each streamed token
   *  - onStart: function() called once the request is initiated
   *  - onComplete: function(finalText: string) called when stream ends successfully
   *  - onError: function(error: Error) called on error
   * Returns:
   *  - nothing (streams via callbacks)
   *
   * Important:
   *  - Requires PERPLEXITY_API_KEY to be set in environment variables.
   */

  // Read API key from environment. Prefer the correct CRA-prefixed key, but
  // also support a mis-prefixed variant observed in some environments and a non-CRA name.
  const apiKey =
    process.env.REACT_APP_PERPLEXITY_API_KEY ||
    process.env.REACT_APP_REACT_APP_PERPLEXITY_API_KEY ||
    process.env.PERPLEXITY_API_KEY; // support both CRA and non-CRA names

  if (!apiKey) {
    const err = new Error(
      "Missing Perplexity API key. Please set one of the following in your .env (and restart): REACT_APP_PERPLEXITY_API_KEY (preferred, CRA), REACT_APP_REACT_APP_PERPLEXITY_API_KEY (legacy/mis-prefixed), or PERPLEXITY_API_KEY."
    );
    if (onError) onError(err);
    throw err;
  }

  // Fire start callback
  if (onStart) onStart();

  try {
    // Perplexity API (OpenAI-compatible) with streaming enabled
    // Reference: https://docs.perplexity.ai/guides/api-reference
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-chat", // a fast, cost-effective chat model
        stream: true,
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      const err = new Error(`Perplexity request failed: ${response.status} ${text}`);
      if (onError) onError(err);
      throw err;
    }

    // Read the response as a stream of server-sent events lines containing JSON chunks
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullText = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Perplexity streams as lines starting with "data: {json}"
      const lines = buffer.split("\n");
      // Keep the last partial line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === "data: [DONE]") {
          // Stream finished
          if (onComplete) onComplete(fullText);
          return;
        }
        if (!trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.replace(/^data:\s*/, "");
        try {
          const parsed = JSON.parse(dataStr);
          // Two possible formats depending on provider:
          // 1) OpenAI-style chat.completions chunks: choices[0].delta.content
          // 2) Some providers use choices[0].message.content (non-streaming)
          // We'll support streaming "delta"
          const delta = parsed?.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            if (onToken) onToken(delta);
          }
        } catch (e) {
          // Non-JSON line or parsing issue; ignore
        }
      }
    }

    // If stream closed without the [DONE] line, still finalize
    if (onComplete) onComplete(fullText);
  } catch (error) {
    if (onError) onError(error);
    throw error;
  }
}
