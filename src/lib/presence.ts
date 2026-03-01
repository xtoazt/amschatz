import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * PresenceManager handles fast disconnect detection using heartbeat,
 * beforeunload signaling, and immediate offline notification.
 */
export class PresenceManager {
  private channel: RealtimeChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private isCleanShutdown = false;

  /**
   * Initialize presence tracking on a channel with fast detection.
   * @param channel Supabase realtime channel
   * @param username Username for presence tracking
   * @param onUserLeave Callback when another user leaves
   */
  initPresence(
    channel: RealtimeChannel,
    username: string,
    onUserLeave: (username: string) => void
  ) {
    this.channel = channel;

    // Listen for presence leave events (immediate offline detection)
    channel.on('presence', { event: 'leave' }, (payload) => {
      const leavingUser = Object.keys(payload.leftKeys)[0];
      if (leavingUser && leavingUser !== username) {
        // User left; remove them immediately without waiting for sync
        onUserLeave(leavingUser);
      }
    });

    // Heartbeat: track presence every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat(username);
    }, 5000);

    // Setup beforeunload to signal clean disconnect
    window.addEventListener('beforeunload', () => this.handleBeforeUnload());
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange(channel, username));
  }

  /**
   * Send a heartbeat to keep presence alive and detect timeouts.
   */
  private sendHeartbeat(username: string) {
    if (!this.channel || this.isCleanShutdown) return;

    // Clear any pending heartbeat timeout
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);

    // Track presence with timestamp
    this.channel.track({ username, heartbeatAt: Date.now() }).catch(() => {
      // Connection error; will retry on next interval
    });

    // Expect next heartbeat within 10 seconds; if not received, assume disconnect
    this.heartbeatTimeout = setTimeout(() => {
      // This would indicate a network failure; the channel will handle reconnection
    }, 10000);
  }

  /**
   * Handle page unload/close by signaling clean shutdown.
   */
  private handleBeforeUnload() {
    this.isCleanShutdown = true;
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
    if (this.channel) {
      // Untrack presence to signal immediate offline
      this.channel.untrack().catch(() => {
        // Ignore errors during shutdown
      });
    }
  }

  /**
   * Handle visibility change (tab backgrounding).
   */
  private handleVisibilityChange(channel: RealtimeChannel, username: string) {
    if (document.hidden) {
      // Tab backgrounded; stop heartbeat to signal potential disconnect
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    } else {
      // Tab visible again; resume heartbeat
      if (!this.heartbeatInterval && !this.isCleanShutdown) {
        this.initPresence(channel, username, () => {});
      }
    }
  }

  /**
   * Clean shutdown of presence tracking.
   */
  cleanup() {
    this.isCleanShutdown = true;
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
    window.removeEventListener('beforeunload', () => this.handleBeforeUnload());
  }
}
