import * as Y from 'yjs'
import * as  awarenessProtocol from "y-protocols/awareness";

interface ClientActivity {
  timestamp: number
  generation: number
}

interface LeaderState {
  clientId: number
  timestamp: number
}

interface CleanupOptions {
  debug?: boolean
  leaderTimeout?: number  // How long before leader considered inactive
  cleanupInterval?: number  // How often to run cleanup
  staleTimeout?: number  // How long before client considered stale
  verificationDelay?: number  // How long to wait before confirming cleanup
}

const DEFAULT_OPTIONS: Required<CleanupOptions> = {
  debug: false,
  leaderTimeout: 15000,
  cleanupInterval: 10000,
  staleTimeout: 30000,
  verificationDelay: 5000
}

export class ConservativeAwarenessCleanup {
  private awareness: awarenessProtocol.Awareness
  private doc: Y.Doc
  private clientActivity: Y.Map<ClientActivity>
  private coordination: Y.Map<LeaderState>
  private intervals: Set<ReturnType<typeof setInterval>>
  private options: Required<CleanupOptions>
  private debug: (message: string, data?: Record<string, unknown>) => void

  constructor(awareness: awarenessProtocol.Awareness, options: CleanupOptions = {}) {
    this.awareness = awareness
    this.doc = awareness.doc
    this.clientActivity = this.doc.getMap('client-activity')
    this.coordination = this.doc.getMap('cleanup-coordination')
    this.intervals = new Set()
    this.options = { ...DEFAULT_OPTIONS, ...options }
    
    // Set up debug logging
    this.debug = this.options.debug 
      ? (message: string, data?: Record<string, unknown>) => 
          console.log(`[YjsCleanup ${this.doc.clientID}]`, message, data)
      : () => {}

    this.debug('Initializing cleanup system')
    this.setupTracking()
  }

  private setupTracking(): void {
    // Try to become leader periodically
    this.addInterval(setInterval(() => {
      this.tryBecomeLeader()
    }, this.options.leaderTimeout / 3))

    // Current leader updates their timestamp
    this.addInterval(setInterval(() => {
      if (this.isLeader()) {
        this.updateLeaderTimestamp()
      }
    }, this.options.leaderTimeout / 5))

    // Track awareness updates
    this.awareness.on('update', ({ added, updated }) => {
      const now = Date.now()
      const changedClients = [...added, ...updated]
      
      this.debug('Awareness update', { changedClients })
      
      for (const clientId of changedClients) {
        this.clientActivity.set(String(clientId), {
          timestamp: now,
          generation: (this.getClientActivity(clientId)?.generation || 0) + 1
        })
      }
    })

    // If we're leader, do cleanup
    this.addInterval(setInterval(() => {
      if (this.isLeader()) {
        this.debug('Starting cleanup as leader')
        this.conservativeCleanup()
      }
    }, this.options.cleanupInterval))

    // Debug logging for state changes
    if (this.options.debug) {
      this.coordination.observe(() => {
        const leader = this.coordination.get('leader')
        this.debug('Leader state changed', { leader })
      })

      this.clientActivity.observe(() => {
        const activities = Object.fromEntries(this.clientActivity.entries())
        this.debug('Client activity changed', { activities })
      })
    }
  }

  private addInterval(interval: ReturnType<typeof setInterval>): void {
    this.intervals.add(interval)
  }

  private getClientActivity(clientId: number): ClientActivity | undefined {
    return this.clientActivity.get(String(clientId))
  }

  private isLeader(): boolean {
    const leader = this.coordination.get('leader')
    return leader?.clientId === this.doc.clientID
  }

  private tryBecomeLeader(): void {
    const now = Date.now()
    const leader = this.coordination.get('leader')
    
    if (!leader || now - leader.timestamp > this.options.leaderTimeout) {
      this.debug('Becoming leader', {
        previousLeader: leader
      })
      
      this.coordination.set('leader', {
        clientId: this.doc.clientID,
        timestamp: now
      })

      // Immediately do an aggressive cleanup of old clients when becoming leader
      this.immediateCleanup()
    }
  }

  private immediateCleanup(): void {
    const states = this.awareness.getStates()
    const clientsToRemove = new Set<number>()

    // Check awareness states
    states.forEach((state, clientId) => {
      const activity = this.getClientActivity(clientId)
      // If there's no activity record or it's an old client without the new generation tracking
      if (!activity || activity.generation === undefined) {
        clientsToRemove.add(clientId)
      }
    })

    // Also check clientActivity for old entries
    this.clientActivity.forEach((activity, clientIdStr) => {
      const clientId = Number(clientIdStr)
      if (activity.generation === undefined) {
        clientsToRemove.add(clientId)
      }
    })

    if (clientsToRemove.size > 0) {
      this.debug('Immediate cleanup of old clients', {
        removingClients: Array.from(clientsToRemove)
      })

      // Remove old clients
      awarenessProtocol.removeAwarenessStates(this.awareness, Array.from(clientsToRemove), 'old client cleanup')
      
      // Clean up activity tracking
      for (const clientId of clientsToRemove) {
        this.clientActivity.delete(String(clientId))
      }
    }
  }

  private updateLeaderTimestamp(): void {
    const leader = this.coordination.get('leader')
    if (leader?.clientId === this.doc.clientID) {
      leader.timestamp = Date.now()
      this.coordination.set('leader', leader)
      this.debug('Updated leader timestamp')
    }
  }

  private async conservativeCleanup(): Promise<void> {
    const now = Date.now()
    const states = this.awareness.getStates()
    
    // First phase: mark potential stale clients
    const potentialStaleClients = new Set<number>()

    // Check both awareness states and activity tracking
    states.forEach((state, clientId) => {
      const activity = this.getClientActivity(clientId)
      
      if (!activity || now - activity.timestamp > this.options.staleTimeout) {
        this.debug('Marking client as potentially stale', {
          clientId,
          lastActivity: activity?.timestamp,
          timeSinceActivity: activity ? now - activity.timestamp : 'never'
        })
        potentialStaleClients.add(clientId)
      }
    })

    // Also check clientActivity for stale entries that might not be in awareness states
    this.clientActivity.forEach((activity, clientIdStr) => {
      const clientId = Number(clientIdStr)
      if (now - activity.timestamp > this.options.staleTimeout) {
        potentialStaleClients.add(clientId)
      }
    })

    if (potentialStaleClients.size > 0) {
      this.debug('Waiting for verification delay before cleanup', {
        potentialStaleClients: Array.from(potentialStaleClients)
      })
      
      // Wait to see if any marked clients become active
      await new Promise(resolve => setTimeout(resolve, this.options.verificationDelay))

      // Second phase: verify and cleanup
      for (const clientId of Array.from(potentialStaleClients)) {
        const activity = this.getClientActivity(clientId)
        
        if (!activity || 
            now - activity.timestamp > this.options.staleTimeout + this.options.verificationDelay) {
          // Double check we're still leader before cleanup
          if (this.isLeader()) {
            this.debug('Cleaning up stale client', {
              clientId,
              lastActivity: activity?.timestamp,
              timeSinceActivity: activity ? now - activity.timestamp : 'never'
            })
            // Remove from awareness states
            awarenessProtocol.removeAwarenessStates(this.awareness, [clientId], 'stale client')
            // Also clean up the activity tracking
            this.clientActivity.delete(String(clientId))
          } else {
            this.debug('Aborted cleanup - no longer leader')
          }
        } else {
          this.debug('Client became active during verification', { clientId })
        }
      }
    }
  }

  public destroy(): void {
    this.debug('Destroying cleanup system')
    
    // Clear all intervals
    for (const interval of Array.from(this.intervals)) {
      clearInterval(interval)
    }
    this.intervals.clear()

    // If we're the leader, clear leader state
    if (this.isLeader()) {
      this.debug('Clearing leadership before destroy')
      this.coordination.delete('leader')
    }

    // Clear our activity
    this.clientActivity.delete(String(this.doc.clientID))
  }
}
