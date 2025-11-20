/**
 * Test data fixtures for E2E tests
 *
 * Provides consistent test data across all E2E tests
 */

/**
 * Chat message fixtures
 */
export const chatMessages = {
  simple: {
    user: 'Hello, how are you?',
    expectedKeywords: ['hello', 'hi', 'good', 'well'],
  },
  complex: {
    user: 'Can you explain quantum computing in simple terms?',
    expectedKeywords: ['quantum', 'computing', 'qubit', 'superposition'],
  },
  codeRequest: {
    user: 'Write a Python function to calculate fibonacci numbers',
    expectedKeywords: ['python', 'fibonacci', 'function', 'def'],
  },
  toolUse: {
    user: 'What is the weather in San Francisco?',
    expectedKeywords: ['weather', 'san francisco', 'temperature'],
  },
  multiTurn: [
    {
      user: 'What is React?',
      expectedKeywords: ['react', 'javascript', 'library', 'ui'],
    },
    {
      user: 'How is it different from Vue?',
      expectedKeywords: ['vue', 'react', 'difference', 'framework'],
    },
    {
      user: 'Which one should I use?',
      expectedKeywords: ['depends', 'project', 'team', 'preference'],
    },
  ],
};

/**
 * Agent task fixtures
 */
export const agentTasks = {
  research: {
    topic: 'Latest advances in AI language models',
    expectedSections: ['Introduction', 'Key Findings', 'Summary', 'Citations'],
    minCitations: 3,
  },
  codeReview: {
    code: `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}
    `,
    expectedIssues: ['var', 'modern syntax', 'const', 'let'],
  },
  support: {
    ticket: {
      subject: 'Cannot login to my account',
      description: 'I keep getting an error message when trying to login',
      priority: 'high',
    },
    expectedActions: ['routing', 'specialist', 'authentication'],
  },
  dataAnalysis: {
    dataset: {
      name: 'sales_data.csv',
      rows: 1000,
      columns: ['date', 'product', 'quantity', 'revenue'],
    },
    expectedInsights: ['trend', 'correlation', 'summary'],
  },
};

/**
 * Dashboard data fixtures
 */
export const dashboardData = {
  metrics: {
    totalRequests: 12543,
    successRate: 98.5,
    avgResponseTime: 245,
    totalCost: 125.67,
  },
  dateRanges: [
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
  ],
  chartData: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    requests: [1200, 1500, 1800, 2100, 2400, 1600, 1300],
    costs: [12.5, 15.2, 18.7, 21.3, 24.8, 16.4, 13.1],
  },
};

/**
 * CLI command fixtures
 */
export const cliCommands = {
  create: {
    templates: [
      'nextjs-chatbot',
      'react-chat',
      'vue-assistant',
      'svelte-minimal',
      'research-agent',
      'code-reviewer',
      'support-agent',
      'analytics-dashboard',
    ],
    projectName: 'test-ai-app',
  },
  prompt: {
    simple: 'Tell me a joke',
    complex: 'Analyze the sentiment of customer reviews',
    withVariables: 'Summarize this text: {{text}}',
  },
};

/**
 * User profile fixtures
 */
export const userProfiles = {
  admin: {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@aikit.test',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    apiKeys: [
      {
        name: 'Development Key',
        key: 'ak_dev_12345',
        created: '2024-01-01',
      },
    ],
  },
  user: {
    id: 'user-001',
    name: 'Test User',
    email: 'user@aikit.test',
    role: 'user',
    permissions: ['read', 'write'],
    apiKeys: [
      {
        name: 'Production Key',
        key: 'ak_prod_67890',
        created: '2024-01-15',
      },
    ],
  },
  developer: {
    id: 'dev-001',
    name: 'Developer User',
    email: 'dev@aikit.test',
    role: 'developer',
    permissions: ['read', 'write', 'deploy'],
    apiKeys: [],
  },
};

/**
 * Tool execution fixtures
 */
export const toolExecutions = {
  calculator: {
    input: '2 + 2 * 3',
    expectedOutput: '8',
    toolName: 'calculator',
  },
  weather: {
    input: { location: 'San Francisco, CA' },
    expectedOutput: {
      temperature: expect.any(Number),
      condition: expect.any(String),
    },
    toolName: 'get_weather',
  },
  webSearch: {
    input: { query: 'AI Kit framework' },
    expectedOutput: {
      results: expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String),
          url: expect.any(String),
          snippet: expect.any(String),
        }),
      ]),
    },
    toolName: 'web_search',
  },
};

/**
 * Error scenarios
 */
export const errorScenarios = {
  network: {
    type: 'network_error',
    message: 'Failed to connect',
    recovery: 'retry',
  },
  authentication: {
    type: 'auth_error',
    message: 'Invalid credentials',
    recovery: 'reauth',
  },
  rateLimit: {
    type: 'rate_limit',
    message: 'Too many requests',
    recovery: 'wait',
  },
  invalidInput: {
    type: 'validation_error',
    message: 'Invalid input format',
    recovery: 'correct',
  },
};

/**
 * Performance benchmarks
 */
export const performanceBenchmarks = {
  pageLoad: {
    maxTime: 3000, // 3 seconds
    metric: 'load',
  },
  firstContentfulPaint: {
    maxTime: 2000, // 2 seconds
    metric: 'FCP',
  },
  timeToInteractive: {
    maxTime: 5000, // 5 seconds
    metric: 'TTI',
  },
  streamingResponse: {
    maxTime: 1000, // 1 second for first token
    metric: 'TTFT',
  },
  apiResponse: {
    maxTime: 500, // 500ms
    metric: 'API',
  },
};

/**
 * Accessibility requirements
 */
export const accessibilityRequirements = {
  colorContrast: {
    minRatio: 4.5, // WCAG AA
    targets: ['text', 'buttons', 'links'],
  },
  keyboardNavigation: {
    required: true,
    elements: ['buttons', 'links', 'forms', 'modals'],
  },
  screenReader: {
    required: true,
    attributes: ['aria-label', 'aria-describedby', 'role'],
  },
  focusIndicators: {
    required: true,
    visible: true,
  },
};

/**
 * Mobile viewport configurations
 */
export const mobileViewports = {
  iPhone: { width: 375, height: 667 },
  iPhonePlus: { width: 414, height: 736 },
  iPhoneX: { width: 375, height: 812 },
  iPad: { width: 768, height: 1024 },
  androidPhone: { width: 360, height: 640 },
  androidTablet: { width: 800, height: 1280 },
};

/**
 * Visual regression test configurations
 */
export const visualTests = {
  fullPage: {
    fullPage: true,
    animations: 'disabled',
  },
  component: {
    fullPage: false,
    animations: 'disabled',
  },
  hover: {
    fullPage: false,
    animations: 'allow',
  },
};
