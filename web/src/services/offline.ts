/**
 * Offline Detection Service
 * Monitors network connectivity and provides online/offline status
 */

type ConnectionStatus = 'online' | 'offline' | 'slow';

interface ConnectionQuality {
  effectiveType: string; // '4g', '3g', '2g', 'slow-2g'
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

type ConnectionListener = (status: ConnectionStatus, quality?: ConnectionQuality) => void;

class OfflineService {
  private listeners: Set<ConnectionListener> = new Set();
  private status: ConnectionStatus = 'online';
  private quality: ConnectionQuality | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize event listeners
   */
  private init(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Check connection quality periodically
    this.startQualityCheck();

    // Initial status check
    this.updateStatus();
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get current connection quality
   */
  getQuality(): ConnectionQuality | null {
    return this.quality;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.status === 'online';
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return this.status === 'offline';
  }

  /**
   * Subscribe to connection status changes
   */
  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('Connection restored');
    this.updateStatus();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('Connection lost');
    this.status = 'offline';
    this.quality = null;
    this.notifyListeners();
  };

  /**
   * Update connection status and quality
   */
  private updateStatus(): void {
    if (!navigator.onLine) {
      this.status = 'offline';
      this.quality = null;
      this.notifyListeners();
      return;
    }

    // Check connection quality via Network Information API
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      this.quality = {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 50,
        saveData: connection.saveData || false,
      };

      // Determine status based on connection quality
      if (connection.effectiveType === 'slow-2g' || connection.rtt > 1000) {
        this.status = 'slow';
      } else {
        this.status = 'online';
      }
    } else {
      // Fallback if Network Information API not available
      this.status = 'online';
      this.quality = null;
    }

    this.notifyListeners();
  }

  /**
   * Start periodic quality checks
   */
  private startQualityCheck(): void {
    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.updateStatus();
    }, 30000);
  }

  /**
   * Stop quality checks
   */
  private stopQualityCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.status, this.quality || undefined);
    });
  }

  /**
   * Ping server to verify connectivity
   */
  async pingServer(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Server ping failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopQualityCheck();
    this.listeners.clear();
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
export type { ConnectionStatus, ConnectionQuality, ConnectionListener };
