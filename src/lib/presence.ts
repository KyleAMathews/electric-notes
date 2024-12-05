import { sendHeartbeat } from './api';

// List of emojis for user identification
const userEmojis = [
  // Faces
  '😊', '😎', '🤓', '🧐', '🤠', '🤗', '🤪', '🤩',
  '😇', '🥳', '🤡', '👻', '🤖', '👽', '👾', '🦄',
  // Animals
  '🐱', '🐶', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
  '🦊', '🐸', '🐙', '🦋', '🐝', '🐞', '🦔', '🦦',
  '🦥', '🦦', '🦨', '🦘', '🦡', '🦃', '🦚', '🦜',
  '🐢', '🦎', '🐠', '🐡', '🐋', '🐳', '🦈', '🦭',
  // Nature
  '🌺', '🌸', '🌼', '🌻', '🌹', '🌷', '🌱', '🌲',
  '🍀', '🌵', '🌴', '🌳', '🌿', '☘️', '🍄', '🌎',
  // Objects
  '⭐️', '🌟', '✨', '💫', '☄️', '🌙', '⚡️', '🔥',
  '🎨', '🎭', '🎮', '🎯', '🎪', '🎫', '🎵', '🎹',
  '🎸', '🎺', '🪘', '🎻', '🎤', '🎧', '🪗', '🥁',
  // Food
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🫐',
  '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
  // Sports & Activities
  '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉',
  '🎱', '🏓', '🏸', '🏒', '🥍', '🏹', '🎣', '🥊',
  // Weather
  '☀️', '🌤', '⛅️', '🌥', '☁️', '🌦', '🌧', '🌩',
  // Hearts & Symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤',
  '💫', '💥', '💢', '💦', '💨', '🕊', '🦋', '🌈'
];

// Generate a random emoji for this session
export const sessionUserId = userEmojis[Math.floor(Math.random() * userEmojis.length)];

class PresenceManager {
  private currentNoteId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = true;

  constructor() {
    // Initialize activity listeners
    this.setupActivityListeners();
    // Start route monitoring
    this.monitorRouteChanges();
  }

  private setupActivityListeners() {
    const updateActivity = () => {
      this.lastActivity = Date.now();
      if (!this.isActive) {
        this.isActive = true;
        this.sendHeartbeat();
      }
    };

    // Listen for user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Check for inactivity every minute
    setInterval(() => {
      if (Date.now() - this.lastActivity > 60000) {
        this.isActive = false;
      }
    }, 60000);
  }

  private monitorRouteChanges() {
    // Check for route changes
    const checkRoute = () => {
      const noteId = window.location.pathname.split('/').pop();
      if (noteId && noteId !== this.currentNoteId) {
        this.updateCurrentNote(noteId);
      }
    };

    // Initial check
    checkRoute();

    // Listen for route changes
    window.addEventListener('popstate', checkRoute);
    
    // For client-side navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      originalPushState.apply(this, arguments as any);
      checkRoute();
    };
  }

  private updateCurrentNote(newNoteId: string) {
    // Send final heartbeat to previous note if exists
    if (this.currentNoteId) {
      sendHeartbeat(this.currentNoteId, sessionUserId).catch(console.error);
    }

    // Update current note
    this.currentNoteId = newNoteId;

    // Clear existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send initial heartbeat
    this.sendHeartbeat();

    // Start new interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }

  private sendHeartbeat() {
    if (this.currentNoteId && this.isActive) {
      sendHeartbeat(this.currentNoteId, sessionUserId).catch(console.error);
    }
  }

  // Cleanup method
  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.currentNoteId) {
      sendHeartbeat(this.currentNoteId, sessionUserId).catch(console.error);
    }
  }
}

// Create a singleton instance
export const presenceManager = new PresenceManager();

// Initialize presence management
if (typeof window !== 'undefined') {
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    presenceManager.cleanup();
  });
}
