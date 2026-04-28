// ===== SSE SERVER EXAMPLE =====
// A simple server that sends events to clients in real-time
// Key difference from REST API: Connection stays open, server pushes data

const http = require('http');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.url === '/events' && req.method === 'GET') {
    console.log('✓ Client connected to SSE stream');

    // ===== SSE SETUP =====
    // Set these headers to enable SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',      // Tell browser this is a stream of events
      'Cache-Control': 'no-cache',              // Don't cache
      'Connection': 'keep-alive'                // Keep connection open
    });

    // ===== SEND INITIAL MESSAGE =====
    res.write('data: {"type": "connection", "message": "Connected to SSE server"}\n\n');

    // ===== SEND EVENTS PERIODICALLY =====
    let eventCount = 0;
    const interval = setInterval(() => {
      eventCount++;

      const event = {
        type: 'data',
        count: eventCount,
        timestamp: new Date().toISOString(),
        message: `Event #${eventCount}`
      };

      // SSE format: "data: " + JSON.stringify(data) + "\n\n"
      // The double newline signals end of message
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      console.log(`📤 Sent event #${eventCount}`);

      // Stop after 10 events
      if (eventCount >= 10) {
        clearInterval(interval);
        res.write(`data: {"type": "complete", "message": "Stream ended"}\n\n`);
        res.end();
        console.log('✗ Client disconnected');
      }
    }, 1000); // Send event every 1 second

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      console.log('✗ Client disconnected');
    });

  } else if (req.url === '/' && req.method === 'GET') {
    // Serve a simple HTML page to test SSE
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SSE Test</title>
        <style>
          body { font-family: monospace; margin: 20px; background: #0f172a; color: #e0e8f5; }
          .log { background: #1a2332; padding: 10px; border-radius: 4px; height: 400px; overflow-y: auto; }
          .event { padding: 5px; border-bottom: 1px solid #2a3f5e; }
          .connection { color: #10b981; }
          .data { color: #0ea5e9; }
          .complete { color: #f59e0b; }
          .error { color: #ef4444; }
        </style>
      </head>
      <body>
        <h1>SSE Client Example</h1>
        <p>Watch real-time events below:</p>
        <div class="log" id="log"></div>
        <p>
          <button onclick="connectSSE()">Connect</button>
          <button onclick="disconnectSSE()">Disconnect</button>
        </p>

        <script>
          let eventSource;

          function connectSSE() {
            const log = document.getElementById('log');
            log.innerHTML = '';

            eventSource = new EventSource('/events');

            eventSource.onopen = () => {
              console.log('EventSource opened');
              log.innerHTML += '<div class="event connection">✓ Connection opened</div>';
            };

            eventSource.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                const className = data.type;
                log.innerHTML += \`<div class="event \${className}">\${JSON.stringify(data)}</div>\`;
                log.scrollTop = log.scrollHeight;
              } catch (e) {
                log.innerHTML += '<div class="event error">Error parsing data</div>';
              }
            };

            eventSource.onerror = () => {
              log.innerHTML += '<div class="event error">✗ Connection error</div>';
              eventSource.close();
            };
          }

          function disconnectSSE() {
            if (eventSource) {
              eventSource.close();
              document.getElementById('log').innerHTML += '<div class="event error">✗ Disconnected</div>';
            }
          }

          // Auto-connect on page load
          connectSSE();
        </script>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('🚀 SSE Server running on http://localhost:3001');
  console.log('📡 Events available at http://localhost:3001/events');
});
