# SSE (Server-Sent Events) Learning Guide

## Quick Start

This folder contains three simple examples to help you understand SSE:

### 1. **Server** (`sse-server.js`)
A Node.js SSE server that:
- ✅ Accepts client connections
- ✅ Sends real-time events every 1 second
- ✅ Includes HTML UI for testing in the browser

### 2. **Client (Node.js)** (`sse-client.js`)
A Node.js client that:
- ✅ Connects to the SSE server
- ✅ Parses streaming events
- ✅ Shows key SSE concepts

### 3. **Browser Client** (Built into `sse-server.js`)
An HTML page with EventSource API example

---

## Running the Examples

### Terminal 1: Start the Server
```bash
node sse-server.js
```

Output:
```
🚀 SSE Server running on http://localhost:3001
📡 Events available at http://localhost:3001/events
```

### Terminal 2: Run the Client
```bash
node sse-client.js
```

### Browser: Test the HTML UI
Open `http://localhost:3001` in your browser and click "Connect"

---

## What is SSE?

**SSE = Server-Sent Events** — a way for a server to push real-time data to a client without the client asking for it repeatedly.

### REST API (Traditional)
```
Client                          Server
  |                              |
  |-------- GET /data --------->|
  |                              |
  |<------ {data} ---------|
  |                              |
  [wait 5 seconds]
  |                              |
  |-------- GET /data --------->|
  |                              |
  |<------ {data} ---------|
```

### SSE (Push from Server)
```
Client                          Server
  |                              |
  |------- Open Connection ----->|
  |<----- Connection Open -------|
  |                              |
  |<------- {event 1} ----------|
  |<------- {event 2} ----------|
  |<------- {event 3} ----------|
  |                              |
  [single connection, server pushes whenever]
```

---

## SSE Message Format

Every SSE message has this format:

```
data: {"type": "message", "value": 123}

```

**Important:** Each message ends with `\n\n` (double newline)

### Examples

**Simple Event:**
```
data: {"message": "Hello"}

```

**Named Event (optional):**
```
event: my-event
data: {"message": "Hello"}

```

**With ID (for reconnection):**
```
id: 42
data: {"message": "Hello"}

```

---

## Browser API: EventSource

In the browser, you use the `EventSource` API:

```javascript
const eventSource = new EventSource('/events');

// When connection opens
eventSource.onopen = () => {
  console.log('Connected!');
};

// When a message arrives
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// On error
eventSource.onerror = () => {
  console.log('Connection lost');
};

// To close
eventSource.close();
```

---

## Node.js: Raw HTTP Request

In Node.js, you make a regular HTTP GET request and listen for data chunks:

```javascript
const http = require('http');

const req = http.get('http://localhost:3001/events', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);

  let buffer = '';

  res.on('data', (chunk) => {
    buffer += chunk;
    const events = buffer.split('\n\n');
    
    // Process complete events
    for (let i = 0; i < events.length - 1; i++) {
      if (events[i].startsWith('data: ')) {
        const data = JSON.parse(events[i].slice(6));
        console.log('Event:', data);
      }
    }

    buffer = events[events.length - 1];
  });

  res.on('end', () => {
    console.log('Stream ended');
  });
});
```

---

## Key Differences: REST vs SSE vs WebSocket

| Feature | REST API | SSE | WebSocket |
|---------|----------|-----|-----------|
| **Data Flow** | Request ↔ Response | Server → Client | Bidirectional |
| **Connection** | New per request | Single, long-lived | Single, long-lived |
| **Server Push** | ❌ No | ✅ Yes | ✅ Yes |
| **Client Request** | ✅ Required | ❌ Not needed | ✅ Possible |
| **Use Case** | Data on demand | Real-time updates | Chat, games |
| **Complexity** | Simple | Simple | Moderate |
| **Browser API** | `fetch()` | `EventSource` | `WebSocket` |

---

## Real-World Examples

### Use SSE For:
- **Live notifications** (new messages, alerts)
- **Live feeds** (Twitter, news updates)
- **Stock tickers** (live price updates)
- **Log streaming** (CI/CD pipelines, debugging)
- **Progress bars** (file uploads, batch operations)
- **Chat** (one-way, server to clients)

### Use REST API For:
- **Data fetching** (GET requests)
- **Creating resources** (POST requests)
- **Updating resources** (PUT/PATCH requests)
- **Deleting resources** (DELETE requests)
- **One-off queries** (weather, location)

### Use WebSocket For:
- **Bidirectional chat** (client ↔ server)
- **Real-time games**
- **Collaborative editing**
- **Financial trading** (high-frequency updates)

---

## Testing the Refiner API with SSE

Now that you understand SSE, here's what the Refiner API does:

```javascript
// Request
{
  "requirements": ["ACC should brake at 100km/h", "..."],
  "feature": "ACC"
}

// Response Headers
Content-Type: application/json  // NOT text/event-stream (NOT SSE!)

// Response Body (single JSON response, NOT streamed)
{
  "refining_id": "abc123",
  "feature": "ACC",
  "pipeline_status": {...},
  "summary": {...},
  "requirements": [...],
  "conflicts": [...]
}
```

**Important:** The Refiner API uses **regular JSON**, not SSE. It returns a single response, not a stream.

---

## Summary

1. **SSE = Server Push** — server continuously sends events to connected clients
2. **Format** — plain text with `data: {...}\n\n`
3. **Browser** — use `EventSource` API
4. **Node.js** — use regular `http.get()` and parse chunks
5. **When to use** — real-time notifications, live updates, log streaming

Now run the examples and experiment!
