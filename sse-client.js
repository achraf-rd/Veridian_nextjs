// ===== SSE CLIENT EXAMPLE =====
// A Node.js client that connects to an SSE server and listens for events

const https = require('https');
const http = require('http');

// ===== METHOD 1: Raw HTTP Request (Simple) =====
function connectToSSEWithRawRequest(url) {
  console.log('\n📡 METHOD 1: Raw HTTP Request');
  console.log('='.repeat(60));
  console.log(`🔗 Connecting to: ${url}`);

  const urlObj = new URL(url);
  const protocol = urlObj.protocol === 'https:' ? https : http;

  const req = protocol.get(url, (res) => {
    // Check headers
    console.log(`✓ Status: ${res.statusCode}`);
    console.log(`✓ Content-Type: ${res.headers['content-type']}`);
    console.log('');
    console.log('📥 Receiving events:');

    let buffer = '';
    let eventCount = 0;

    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const events = buffer.split('\n\n');

      // Process complete events (ending with \n\n)
      for (let i = 0; i < events.length - 1; i++) {
        const eventData = events[i].trim();
        if (eventData.startsWith('data: ')) {
          eventCount++;
          const jsonStr = eventData.slice(6); // Remove "data: "
          try {
            const data = JSON.parse(jsonStr);
            console.log(`  ${eventCount}. [${data.type}] ${JSON.stringify(data)}`);
          } catch (e) {
            console.log(`  ${eventCount}. [raw] ${jsonStr}`);
          }
        }
      }

      // Keep the last incomplete event in buffer
      buffer = events[events.length - 1];
    });

    res.on('end', () => {
      console.log('');
      console.log('✓ Stream ended');
    });

    res.on('error', (err) => {
      console.log(`✗ Error: ${err.message}`);
    });
  });

  req.on('error', (err) => {
    console.log(`✗ Connection error: ${err.message}`);
  });

  req.setTimeout(30000); // 30 second timeout
}

// ===== METHOD 2: Using EventSource API (Browser-like) =====
// Note: EventSource is not available in Node.js natively
// But let's show what it looks like for educational purposes
function connectToSSEWithEventSource(url) {
  console.log('\n📡 METHOD 2: EventSource API (Browser Only)');
  console.log('='.repeat(60));
  console.log(`Code example for browser:\n`);
  console.log(`
    const eventSource = new EventSource('${url}');

    // Fires when connection opens
    eventSource.onopen = () => {
      console.log('Connected');
    };

    // Fires for any message event
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
    };

    // Fires on connection error
    eventSource.onerror = () => {
      console.log('Error or disconnected');
    };

    // Close connection when done
    eventSource.close();
  `);
}

// ===== KEY CONCEPTS =====
function printConcepts() {
  console.log('\n' + '█'.repeat(60));
  console.log('SSE vs Regular API - Key Differences');
  console.log('█'.repeat(60));

  const comparison = `
┌─────────────────┬──────────────────────────┬──────────────────────────┐
│ Aspect          │ Regular REST API          │ Server-Sent Events (SSE) │
├─────────────────┼──────────────────────────┼──────────────────────────┤
│ Connection      │ Client initiates request  │ Client connects once,    │
│                 │ for each data fetch       │ server keeps pushing     │
│                 │                          │                          │
│ Data Flow       │ Request → Response        │ Stream (long-lived)      │
│                 │ (one-shot)               │                          │
│                 │                          │                          │
│ Use Case        │ Fetch data on demand      │ Real-time updates        │
│                 │ (GET /users)             │ (notifications, logs)    │
│                 │                          │                          │
│ Format          │ application/json         │ text/event-stream        │
│                 │                          │                          │
│ Message Format  │ {...}                    │ data: {...}\\n\\n        │
│                 │                          │                          │
│ Browser Support │ fetch(), axios, etc      │ EventSource API          │
│                 │                          │                          │
│ Performance     │ Multiple requests        │ Single connection +      │
│                 │ overhead                 │ less overhead            │
│                 │                          │                          │
│ Latency         │ Higher (polling)         │ Lower (push)             │
│                 │                          │                          │
│ Examples        │ Twitter API              │ Live chat, stock tickers,│
│                 │ GitHub API               │ notification feeds       │
└─────────────────┴──────────────────────────┴──────────────────────────┘

WHEN TO USE:
  ✓ SSE if you need SERVER → CLIENT updates
  ✓ REST API if you need REQUEST → RESPONSE pattern
  ✓ WebSocket if you need bidirectional communication (client ↔ server)
  `;

  console.log(comparison);
}

// ===== SSE MESSAGE FORMAT =====
function printMessageFormat() {
  console.log('\n' + '█'.repeat(60));
  console.log('SSE Message Format');
  console.log('█'.repeat(60));

  const format = `
SSE messages are plain text with a simple format:

  data: <json-payload>
  \\n\\n

Examples:

  1. Simple data:
     data: {"type": "message", "text": "Hello"}
     \\n\\n

  2. Named event:
     event: message
     data: {"type": "message", "text": "Hello"}
     \\n\\n

  3. ID for reconnection:
     id: 123
     data: {"type": "message", "text": "Hello"}
     \\n\\n

  4. Retry hint:
     retry: 5000
     data: {"type": "reconnect", "after_ms": 5000}
     \\n\\n

IMPORTANT:
  - Each message MUST end with \\n\\n (double newline)
  - Partial messages are buffered until \\n\\n is received
  - Fields: data, event, id, retry, comment
  `;

  console.log(format);
}

// ===== MAIN =====
console.log('\n' + '█'.repeat(60));
console.log('SSE (Server-Sent Events) Learning Guide');
console.log('█'.repeat(60));

printConcepts();
printMessageFormat();

// Connect to the SSE server
console.log('\n' + '█'.repeat(60));
console.log('Testing Connection');
console.log('█'.repeat(60));

// Try to connect to local SSE server
const sseUrl = 'http://localhost:3001/events';
connectToSSEWithRawRequest(sseUrl);
connectToSSEWithEventSource(sseUrl);

console.log('\n💡 To run the server, use: node sse-server.js');
console.log('💡 Then run this client: node sse-client.js');
