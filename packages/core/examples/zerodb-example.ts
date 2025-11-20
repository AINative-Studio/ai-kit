/**
 * ZeroDB CRUD Client Usage Examples
 *
 * This file demonstrates various features of the ZeroDB client
 * including CRUD operations, query builder, transactions, and more.
 */

import { createZeroDBClient } from '../src/zerodb'

// Initialize client
const client = createZeroDBClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  pool: {
    min: 2,
    max: 10
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000
  },
  debug: true
})

// Example 1: Basic CRUD Operations
async function basicCrudExample() {
  // Insert a user
  const insertResult = await client.insert('users', {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    status: 'active'
  }, { returning: true })

  console.log('Inserted user:', insertResult.rows[0])

  // Query users
  const users = await client.select('users', {
    filter: {
      condition: {
        field: 'status',
        operator: 'eq',
        value: 'active'
      }
    },
    sort: [{ field: 'created_at', direction: 'desc' }],
    limit: 10
  })

  console.log('Active users:', users.rows)

  // Update a user
  await client.update('users',
    { status: 'inactive' },
    {
      filter: {
        condition: {
          field: 'email',
          operator: 'eq',
          value: 'john@example.com'
        }
      }
    }
  )

  // Delete a user
  await client.delete('users', {
    filter: {
      condition: {
        field: 'email',
        operator: 'eq',
        value: 'john@example.com'
      }
    }
  })
}

// Example 2: Query Builder
async function queryBuilderExample() {
  // Simple query
  const activeUsers = await client.query('users')
    .where('status', 'eq', 'active')
    .orderBy('created_at', 'desc')
    .limit(10)
    .all()

  console.log('Active users:', activeUsers)

  // Complex query with multiple conditions
  const filteredUsers = await client.query('users')
    .select('id', 'name', 'email')
    .where('age', 'gte', 18)
    .and('status', 'eq', 'active')
    .and('verified', 'eq', true)
    .or('premium', 'eq', true)
    .orderBy('last_name', 'asc')
    .orderBy('first_name', 'asc')
    .paginate(1, 20)
    .all()

  console.log('Filtered users:', filteredUsers)

  // Get single user
  const user = await client.query('users')
    .where('email', 'eq', 'john@example.com')
    .first()

  console.log('User:', user)

  // Count users
  const userCount = await client.query('users')
    .where('status', 'eq', 'active')
    .count()

  console.log('Active user count:', userCount)
}

// Example 3: Transactions
async function transactionExample() {
  try {
    const result = await client.transaction(async (tx) => {
      // Insert user
      const user = await tx.insert('users', {
        name: 'Jane Smith',
        email: 'jane@example.com'
      }, { returning: true })

      const userId = user.rows[0].id

      // Insert profile
      await tx.insert('profiles', {
        user_id: userId,
        bio: 'Software Developer',
        location: 'San Francisco'
      })

      // Insert settings
      await tx.insert('settings', {
        user_id: userId,
        theme: 'dark',
        notifications: true
      })

      return { userId, success: true }
    })

    console.log('Transaction successful:', result)
  } catch (error) {
    console.error('Transaction failed:', error)
  }
}

// Example 4: Batch Operations
async function batchOperationsExample() {
  const result = await client.batch([
    {
      type: 'insert',
      table: 'logs',
      data: {
        level: 'info',
        message: 'User logged in',
        timestamp: new Date().toISOString()
      }
    },
    {
      type: 'update',
      table: 'users',
      data: { last_login: new Date().toISOString() },
      options: {
        filter: {
          condition: {
            field: 'id',
            operator: 'eq',
            value: 1
          }
        }
      }
    },
    {
      type: 'delete',
      table: 'sessions',
      options: {
        filter: {
          condition: {
            field: 'expires_at',
            operator: 'lt',
            value: new Date().toISOString()
          }
        }
      }
    }
  ])

  console.log('Batch result:', result)
}

// Example 5: Upsert Operations
async function upsertExample() {
  // Upsert single user
  await client.upsert('users', {
    email: 'john@example.com',
    name: 'John Doe',
    age: 31
  }, {
    onConflict: {
      target: ['email'],
      action: 'update',
      updateFields: ['name', 'age']
    }
  })

  // Bulk upsert
  await client.upsert('users', [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' }
  ])
}

// Example 6: Health Monitoring
async function healthMonitoringExample() {
  // Check health
  const health = await client.healthCheck()
  console.log('Health status:', health)

  // Get pool statistics
  const stats = client.getPoolStats()
  console.log('Pool stats:', stats)

  // Listen to events
  client.on('query', (operation, duration) => {
    console.log(`Query executed: ${operation} (${duration}ms)`)
  })

  client.on('error', (error) => {
    console.error('Database error:', error)
  })

  client.on('transactionStart', (id) => {
    console.log('Transaction started:', id)
  })

  client.on('transactionCommit', (id) => {
    console.log('Transaction committed:', id)
  })
}

// Example 7: Advanced Queries with JOINs
async function joinExample() {
  const usersWithProfiles = await client.select('users', {
    select: ['users.id', 'users.name', 'profiles.bio', 'profiles.location'],
    joins: [
      {
        table: 'profiles',
        type: 'left',
        on: { left: 'id', right: 'user_id' }
      }
    ],
    filter: {
      condition: {
        field: 'users.status',
        operator: 'eq',
        value: 'active'
      }
    }
  })

  console.log('Users with profiles:', usersWithProfiles.rows)
}

// Run all examples
async function runExamples() {
  try {
    console.log('\n=== Basic CRUD Operations ===')
    await basicCrudExample()

    console.log('\n=== Query Builder ===')
    await queryBuilderExample()

    console.log('\n=== Transactions ===')
    await transactionExample()

    console.log('\n=== Batch Operations ===')
    await batchOperationsExample()

    console.log('\n=== Upsert Operations ===')
    await upsertExample()

    console.log('\n=== Health Monitoring ===')
    await healthMonitoringExample()

    console.log('\n=== JOINs ===')
    await joinExample()

  } catch (error) {
    console.error('Error running examples:', error)
  } finally {
    // Clean up
    await client.close()
  }
}

// Export for use in other files
export {
  basicCrudExample,
  queryBuilderExample,
  transactionExample,
  batchOperationsExample,
  upsertExample,
  healthMonitoringExample,
  joinExample
}

// Run if executed directly
if (require.main === module) {
  runExamples()
}
