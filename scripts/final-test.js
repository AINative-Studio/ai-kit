console.log('=== FINAL PACKAGE VERIFICATION ===\n');

let passCount = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ ${name}`);
    passCount++;
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 1: Load React package
test('React package loads via require()', () => {
  const pkg = require('./packages/react/dist/index.js');
  if (!pkg) throw new Error('Package is undefined');
  if (Object.keys(pkg).length === 0) throw new Error('No exports found');
});

// Test 2: Check React package version
test('React package version is 0.1.0-alpha.2', () => {
  const pkg = require('./packages/react/package.json');
  if (pkg.version !== '0.1.0-alpha.2') throw new Error(`Version is ${pkg.version}`);
});

// Test 3: Verify React dependencies are external
test('react-syntax-highlighter is external in React package', () => {
  const fs = require('fs');
  const dist = fs.readFileSync('./packages/react/dist/index.js', 'utf-8');
  if (!dist.includes('require(')) throw new Error('No require calls found');
  if (!dist.includes('react-syntax-highlighter')) throw new Error('Dependency not found');
});

// Test 4: Load Testing package
test('Testing package loads via require()', () => {
  const pkg = require('./packages/testing/dist/index.js');
  if (!pkg) throw new Error('Package is undefined');
  if (Object.keys(pkg).length === 0) throw new Error('No exports found');
});

// Test 5: Check Testing package version
test('Testing package version is 0.1.3', () => {
  const pkg = require('./packages/testing/package.json');
  if (pkg.version !== '0.1.3') throw new Error(`Version is ${pkg.version}`);
});

// Test 6: Verify vitest is external
test('vitest is external in Testing package', () => {
  const fs = require('fs');
  const dist = fs.readFileSync('./packages/testing/dist/index.js', 'utf-8');
  if (!dist.includes('require(')) throw new Error('No require calls found');
  if (!dist.includes('vitest')) throw new Error('vitest not found');
});

// Test 7: Lazy loading works
test('Testing package lazy loads vitest (fails only when used)', () => {
  const pkg = require('./packages/testing/dist/index.js');
  // This should succeed (package loads)
  try {
    pkg.createMockServerResponse();
    // If vitest is installed, this might succeed - that's OK
  } catch (error) {
    // Should fail with helpful error message
    if (!error.message.includes('vitest is required')) {
      throw new Error(`Wrong error: ${error.message}`);
    }
  }
});

// Test 8: React package has correct exports
test('React package exports expected components', () => {
  const pkg = require('./packages/react/dist/index.js');
  const expectedExports = ['CodeBlock', 'MarkdownRenderer', 'AgentResponse'];
  for (const exp of expectedExports) {
    if (!pkg[exp]) throw new Error(`Missing export: ${exp}`);
  }
});

// Test 9: Testing package has correct exports
test('Testing package exports expected utilities', () => {
  const pkg = require('./packages/testing/dist/index.js');
  const expectedExports = ['createMockServerResponse', 'createMockFetchResponse', 'assertValidMessage'];
  for (const exp of expectedExports) {
    if (!pkg[exp]) throw new Error(`Missing export: ${exp}`);
  }
});

console.log(`\n=== RESULTS ===`);
console.log(`Passed: ${passCount}/${totalTests}`);
console.log(`Status: ${passCount === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
