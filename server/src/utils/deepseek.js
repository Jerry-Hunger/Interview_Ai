import axios from "axios";

const deepseekClient = axios.create({
  baseURL: "https://api.deepseek.com",
  timeout: parseInt(process.env.DEEPSEEK_TIMEOUT || "60000", 10),
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  },
});

const withRetry = async (fn, retries = parseInt(process.env.DEEPSEEK_MAX_RETRIES || "2", 10)) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      if (status >= 400 && status < 500) throw err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
};

export const streamDeepSeekResponse = async function* (prompt) {
  const response = await withRetry(() =>
    deepseekClient.post(
      "/chat/completions",
      {
        model: "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        stream: true,
      },
      { responseType: "stream" }
    )
  );

  const stream = response.data;
  let buffer = "";

  for await (const chunk of stream) {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
};
