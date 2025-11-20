/**
 * State Manager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../src/state-manager';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should create state', () => {
    const state = stateManager.createState('test-1', { key: 'value' });
    expect(state.id).toBe('test-1');
    expect(state.status).toBe('idle');
    expect(state.metadata).toEqual({ key: 'value' });
  });

  it('should get state', () => {
    stateManager.createState('test-2');
    const state = stateManager.getState('test-2');
    expect(state).toBeDefined();
    expect(state?.id).toBe('test-2');
  });

  it('should update state', () => {
    stateManager.createState('test-3');
    const updated = stateManager.updateState('test-3', {
      status: 'running',
      currentStep: 1,
    });

    expect(updated?.status).toBe('running');
    expect(updated?.currentStep).toBe(1);
  });

  it('should track execution time', () => {
    stateManager.createState('test-4');
    stateManager.updateState('test-4', { status: 'running' });
    const state = stateManager.getState('test-4');
    expect(state?.startedAt).toBeDefined();
  });

  it('should subscribe to state changes', () => {
    stateManager.createState('test-5');
    let notified = false;

    stateManager.subscribe('test-5', (state) => {
      notified = true;
    });

    stateManager.updateState('test-5', { status: 'running' });
    expect(notified).toBe(true);
  });

  it('should unsubscribe from state changes', () => {
    stateManager.createState('test-6');
    let count = 0;

    const unsubscribe = stateManager.subscribe('test-6', () => {
      count++;
    });

    stateManager.updateState('test-6', { currentStep: 1 });
    unsubscribe();
    stateManager.updateState('test-6', { currentStep: 2 });

    expect(count).toBe(1);
  });

  it('should delete state', () => {
    stateManager.createState('test-7');
    stateManager.deleteState('test-7');
    const state = stateManager.getState('test-7');
    expect(state).toBeUndefined();
  });

  it('should get all states', () => {
    stateManager.createState('test-8');
    stateManager.createState('test-9');
    const allStates = stateManager.getAllStates();
    expect(allStates.length).toBeGreaterThanOrEqual(2);
  });
});
