/**
 * Shared state management for agent execution
 */

export interface AgentState {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  stepName?: string;
  result?: unknown;
  error?: Error;
  startedAt?: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface StateUpdate {
  status?: AgentState['status'];
  currentStep?: number;
  totalSteps?: number;
  stepName?: string;
  result?: unknown;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export class StateManager {
  private states: Map<string, AgentState> = new Map();
  private listeners: Map<string, Set<(state: AgentState) => void>> = new Map();

  createState(id: string, metadata: Record<string, unknown> = {}): AgentState {
    const state: AgentState = {
      id,
      status: 'idle',
      currentStep: 0,
      totalSteps: 0,
      metadata,
    };

    this.states.set(id, state);
    return state;
  }

  getState(id: string): AgentState | undefined {
    return this.states.get(id);
  }

  updateState(id: string, update: StateUpdate): AgentState | undefined {
    const state = this.states.get(id);
    if (!state) return undefined;

    const updatedState: AgentState = {
      ...state,
      ...update,
      metadata: {
        ...state.metadata,
        ...(update.metadata || {}),
      },
    };

    if (update.status === 'running' && !state.startedAt) {
      updatedState.startedAt = new Date();
    }

    if (update.status === 'completed' || update.status === 'failed') {
      updatedState.completedAt = new Date();
    }

    this.states.set(id, updatedState);
    this.notifyListeners(id, updatedState);

    return updatedState;
  }

  subscribe(id: string, listener: (state: AgentState) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }

    this.listeners.get(id)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(id);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  private notifyListeners(id: string, state: AgentState): void {
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.forEach((listener) => listener(state));
    }
  }

  deleteState(id: string): void {
    this.states.delete(id);
    this.listeners.delete(id);
  }

  getAllStates(): AgentState[] {
    return Array.from(this.states.values());
  }
}

export const globalStateManager = new StateManager();
