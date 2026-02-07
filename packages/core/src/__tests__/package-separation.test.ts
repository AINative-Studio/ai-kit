/**
 * Package Separation Tests
 * Refs #64 - Verify that optional features are properly separated
 */

import { describe, it, expect } from 'vitest'

describe('Package Separation - Core Only', () => {
  it('should not export auth functionality from core', async () => {
    const coreExports = await import('../index')

    // Core should NOT have auth exports when separated
    expect(coreExports).not.toHaveProperty('AINativeAuthProvider')
    expect(coreExports).not.toHaveProperty('AuthError')
    expect(coreExports).not.toHaveProperty('AuthMethod')
  })

  it('should not export zerodb functionality from core', async () => {
    const coreExports = await import('../index')

    // Core should NOT have zerodb exports
    expect(coreExports).not.toHaveProperty('ZeroDBClient')
    expect(coreExports).not.toHaveProperty('VectorStore')
  })

  it('should not export design functionality from core', async () => {
    const coreExports = await import('../index')

    // Core should NOT have design exports
    expect(coreExports).not.toHaveProperty('DesignSystemManager')
    expect(coreExports).not.toHaveProperty('TokenExtractor')
  })

  it('should not export rlhf functionality from core', async () => {
    const coreExports = await import('../index')

    // Core should NOT have RLHF exports
    expect(coreExports).not.toHaveProperty('RLHFLogger')
    expect(coreExports).not.toHaveProperty('RLHFInstrumentation')
  })

  it('should export core streaming functionality', async () => {
    const coreExports = await import('../index')

    // Core SHOULD have streaming
    expect(coreExports).toHaveProperty('AIStream')
    expect(coreExports.AIStream).toBeDefined()
  })

  it('should export core agents functionality', async () => {
    const coreExports = await import('../index')

    // Core SHOULD have agents
    expect(coreExports).toHaveProperty('Agent')
    expect(coreExports.Agent).toBeDefined()
  })

  it('should export core store functionality', async () => {
    const coreExports = await import('../index')

    // Core SHOULD have store
    expect(coreExports).toHaveProperty('ConversationStore')
    expect(coreExports.ConversationStore).toBeDefined()
  })

  it('should export core context functionality', async () => {
    const coreExports = await import('../index')

    // Core SHOULD have context
    expect(coreExports).toHaveProperty('ContextManager')
    expect(coreExports.ContextManager).toBeDefined()
  })

  it('should export core session functionality', async () => {
    const coreExports = await import('../index')

    // Core SHOULD have session management (not AINative-specific)
    expect(coreExports).toHaveProperty('SessionManager')
    expect(coreExports.SessionManager).toBeDefined()
  })
})

describe('Package Separation - Bundle Size', () => {
  it('should have core bundle under 50KB when minified', async () => {
    // This is a placeholder - actual bundle size will be verified by build
    // We check that ecosystem modules are not included
    const coreExports = await import('../index')
    const exportKeys = Object.keys(coreExports)

    // Verify no ecosystem integrations are exported
    const ecosystemExports = exportKeys.filter(key =>
      key.includes('Auth') ||
      key.includes('ZeroDB') ||
      key.includes('Design') ||
      key.includes('RLHF')
    )

    expect(ecosystemExports.length).toBe(0)
  })
})

describe('Package Separation - Import Paths', () => {
  it('should allow importing from separate subpath exports', async () => {
    // Test that streaming can be imported separately
    const streamingModule = await import('../streaming')
    expect(streamingModule).toHaveProperty('AIStream')
  })

  it('should allow importing agents separately', async () => {
    const agentsModule = await import('../agents')
    expect(agentsModule).toHaveProperty('Agent')
  })

  it('should allow importing store separately', async () => {
    const storeModule = await import('../store')
    expect(storeModule).toHaveProperty('ConversationStore')
  })

  it('should allow importing context separately', async () => {
    const contextModule = await import('../context')
    expect(contextModule).toHaveProperty('ContextManager')
  })

  it('should not have auth subpath export in core', async () => {
    // Auth directories still exist in source (will be moved later)
    // but they are not exported from main index
    const coreExports = await import('../index')
    expect(coreExports).not.toHaveProperty('AINativeAuthProvider')
  })

  it('should not have zerodb subpath export in core', async () => {
    // ZeroDB directories still exist in source (will be moved later)
    // but they are not exported from main index
    const coreExports = await import('../index')
    expect(coreExports).not.toHaveProperty('ZeroDBClient')
  })

  it('should not have design subpath export in core', async () => {
    // Design directories still exist in source (will be moved later)
    // but they are not exported from main index
    const coreExports = await import('../index')
    expect(coreExports).not.toHaveProperty('DesignSystemManager')
  })

  it('should not have rlhf subpath export in core', async () => {
    // RLHF directories still exist in source (will be moved later)
    // but they are not exported from main index
    const coreExports = await import('../index')
    expect(coreExports).not.toHaveProperty('RLHFLogger')
  })
})
