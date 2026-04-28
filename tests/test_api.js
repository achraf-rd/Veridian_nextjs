// test-sse.js
const url = "https://adas-req-refiner.fly.dev/refine/stream";

async function testSSE() {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    },
    body: JSON.stringify({
      requirements: [
        "Test ACC when vehicle ahead brakes suddenly.",
        "Verify LKA behavior on curved roads at highway speed."
      ],
      feature: "ACC"
    })
  });

  if (!response.ok) {
    console.error("HTTP error:", response.status);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6);
        try {
          const event = JSON.parse(json);
          console.log("📡 EVENT:", event);
        } catch (err) {
          console.log("⚠️ Non-JSON:", json);
        }
      }
    }
  }

  console.log("✅ Stream ended");
}

testSSE();