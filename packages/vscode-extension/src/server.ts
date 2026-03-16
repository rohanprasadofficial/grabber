import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import type { GrabberPayload, GrabberResponse } from './types';

export class GrabberServer extends EventEmitter {
  private httpServer: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private port: number;

  constructor(port: number) {
    super();
    this.port = port;
  }

  start(): void {
    this.httpServer = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on('connection', (ws) => {
      this.handleWebSocketConnection(ws);
    });

    this.wss.on('error', (error) => {
      console.error('[Grabber Server] WebSocket error:', error);
      this.emit('error', error);
    });

    this.httpServer.listen(this.port, '127.0.0.1', () => {
      console.log(`[Grabber Server] Listening on port ${this.port}`);
    });

    this.httpServer.on('error', (error) => {
      console.error('[Grabber Server] HTTP error:', error);
      this.emit('error', error);
    });
  }

  private handleHttpRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/context') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const payload = JSON.parse(body) as GrabberPayload;
          this.emit('context', payload);

          const response: GrabberResponse = {
            success: true,
            timestamp: Date.now(),
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          const response: GrabberResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          };

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        }
      });

      return;
    }

    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          clients: this.clients.size,
          timestamp: Date.now(),
        })
      );
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  private handleWebSocketConnection(ws: WebSocket): void {
    console.log('[Grabber Server] Client connected');
    this.clients.add(ws);
    this.emit('connected');

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString()) as GrabberPayload;

        // Handle ping/pong for keepalive
        if (payload.type === 'GRABBER_PING') {
          ws.send(JSON.stringify({ type: 'GRABBER_PONG', timestamp: Date.now() }));
          return;
        }

        this.emit('context', payload);

        // Send acknowledgment
        ws.send(
          JSON.stringify({
            type: 'GRABBER_ACK',
            success: true,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error('[Grabber Server] Error parsing message:', error);
        ws.send(
          JSON.stringify({
            type: 'GRABBER_ACK',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          })
        );
      }
    });

    ws.on('close', () => {
      console.log('[Grabber Server] Client disconnected');
      this.clients.delete(ws);
      this.emit('disconnected');
    });

    ws.on('error', (error) => {
      console.error('[Grabber Server] Client error:', error);
      this.clients.delete(ws);
    });
  }

  get isConnected(): boolean {
    return this.clients.size > 0;
  }

  stop(): void {
    // Close all WebSocket connections
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }

    console.log('[Grabber Server] Stopped');
  }
}
