/**
 * WebSocket Service
 * Manages WebSocket connections for real-time exam updates
 * Integrates with offline resilience for checkpoint queuing
 */

import type {
  WebSocketMessage,
  CheckpointRequest,
  CheckpointAck,
  TimeUpdate,
  Notification,
} from '../types';
import { offlineService } from './offline';
import { idbService } from './idb';
import { backgroundSyncService } from './backgroundSync';

// Use relative WebSocket URL to work with proxy
// In dev: ws://localhost:5173/api/v1/ws (proxied to backend)
// In prod: wss://yourdomain.com/api/v1/ws
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || `${WS_PROTOCOL}//${window.location.host}`;
const WS_PREFIX = '/api/v1/ws';
const HEARTBEAT_INTERVAL = (import.meta.env.VITE_WS_HEARTBEAT_INTERVAL || 30) * 1000;
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (error: Event | Error) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private attemptId: number | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private heartbeatInterval: number | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private isManualDisconnect = false;
  private sequenceNumbers: Map<number, number> = new Map(); // questionId -> sequence

  /**
   * Connect to WebSocket server for an exam attempt
   */
  connect(attemptId: number, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.attemptId = attemptId;
      this.token = token;
      this.isManualDisconnect = false;

      const wsUrl = `${WS_BASE_URL}${WS_PREFIX}/attempts/${attemptId}?token=${token}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WS] Connected to exam attempt', attemptId);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          // Trigger background sync on reconnection
          if (this.reconnectAttempts > 0) {
            console.log('[WS] Triggering background sync after reconnection');
            backgroundSyncService.syncAll().catch((error) => {
              console.error('[WS] Background sync failed:', error);
            });
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);

            // Resolve on connection confirmation
            if (message.type === 'connected') {
              resolve();
            }
          } catch (error) {
            console.error('[WS] Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] WebSocket error:', error);
          this.errorHandlers.forEach((handler) => handler(error));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[WS] Connection closed:', event.code, event.reason);
          this.stopHeartbeat();

          if (!this.isManualDisconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.attemptId = null;
    this.token = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Send a checkpoint (answer save) message
   * Queues to IndexedDB if offline, sends immediately if online
   */
  async sendCheckpoint(
    questionId: number,
    answer: any,
    isFlagged: boolean = false,
    timeSpent: number = 0
  ): Promise<void> {
    // Increment sequence number for this question
    const currentSeq = this.sequenceNumbers.get(questionId) || 0;
    const newSeq = currentSeq + 1;
    this.sequenceNumbers.set(questionId, newSeq);

    const checkpoint: CheckpointRequest = {
      type: 'checkpoint',
      question_id: questionId,
      answer,
      is_flagged: isFlagged,
      time_spent_seconds: timeSpent,
      sequence: newSeq,
    };

    // Check if online
    const isOnline = offlineService.getStatus() === 'online';

    if (isOnline && this.isConnected()) {
      // Send immediately if online and connected
      this.send(checkpoint);
    } else if (this.attemptId) {
      // Queue to IndexedDB if offline or disconnected
      console.log('[WS] Offline/disconnected, queuing checkpoint for question', questionId);
      
      await idbService.enqueueCheckpoint({
        attemptId: this.attemptId,
        questionId,
        answer,
        isFlagged,
        timeSpentSeconds: timeSpent,
        sequence: newSeq,
        timestamp: Date.now(),
        retryCount: 0,
      });
    } else {
      console.warn('[WS] Cannot send or queue checkpoint: no attempt ID');
    }
  }

  /**
   * Request time synchronization
   */
  syncTime(): void {
    this.send({
      type: 'time_sync',
      client_timestamp: new Date().toISOString(),
    });
  }

  /**
   * Flag or unflag a question
   */
  flagQuestion(questionId: number, isFlagged: boolean): void {
    this.send({
      type: 'flag',
      question_id: questionId,
      is_flagged: isFlagged,
    });
  }

  /**
   * Send pong response to ping
   */
  private sendPong(): void {
    this.send({
      type: 'pong',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generic send method
   */
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send message, WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WS] Error sending message:', error);
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('[WS] Received:', message.type, message);

    // Handle ping automatically
    if (message.type === 'ping') {
      this.sendPong();
      return;
    }

    // Notify registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WS] Error in message handler:', error);
        }
      });
    }

    // Notify wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WS] Error in wildcard handler:', error);
        }
      });
    }
  }

  /**
   * Register a message handler for a specific message type
   */
  on(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }

    this.messageHandlers.get(messageType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(messageType);
        }
      }
    };
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = window.setInterval(() => {
      // Heartbeat is handled by server pings
      // We just need to ensure connection is alive
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        this.stopHeartbeat();
        if (!this.isManualDisconnect) {
          this.scheduleReconnect();
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.isManualDisconnect) {
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WS] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;

      if (this.attemptId && this.token) {
        this.connect(this.attemptId, this.token).catch((error) => {
          console.error('[WS] Reconnection failed:', error);
        });
      }
    }, RECONNECT_DELAY);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current attempt ID
   */
  getAttemptId(): number | null {
    return this.attemptId;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
