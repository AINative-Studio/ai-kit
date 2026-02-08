#!/usr/bin/env node

console.log('=== Testing Package require() Functionality ===\n');

// Test 1: @ainative/ai-kit (React package)
console.log('Test 1: @ainative/ai-kit (React package)');
console.log('Location: /Users/aideveloper/ai-kit/packages/react');
console.log('Issue: react-syntax-highlighter should be external, not bundled');
console.log('Expected: Should require() successfully without bundling react-syntax-highlighter\n');

try {
  const reactKit = require('./packages/react/dist/index.js');
  console.log('✅ SUCCESS: @ainative/ai-kit loaded successfully');
  console.log('   Exported keys:', Object.keys(reactKit).length > 0 ? Object.keys(reactKit).slice(0, 5).join(', ') + '...' : 'None');

  // Check if react-syntax-highlighter is being required (not bundled)
  const distContent = require('fs').readFileSync('./packages/react/dist/index.js', 'utf-8');
  const hasExternalRequire = distContent.includes('require("react-syntax-highlighter")');
  const isBundled = distContent.includes('react-syntax-highlighter') && !hasExternalRequire;

  if (hasExternalRequire) {
    console.log('   ✅ react-syntax-highlighter is external (proper require() call found)');
  } else if (isBundled) {
    console.log('   ⚠️  WARNING: react-syntax-highlighter appears to be bundled');
  }
} catch (error) {
  console.log('❌ FAILED: @ainative/ai-kit');
  console.log('   Error:', error.message);
}

console.log('\n---\n');

// Test 2: @ainative/ai-kit-testing
console.log('Test 2: @ainative/ai-kit-testing');
console.log('Location: /Users/aideveloper/ai-kit/packages/testing');
console.log('Issue: vitest should be external, not bundled');
console.log('Expected: Should require() successfully even without vitest installed\n');

try {
  const testingKit = require('./packages/testing/dist/index.js');
  console.log('✅ SUCCESS: @ainative/ai-kit-testing loaded successfully');
  console.log('   Exported keys:', Object.keys(testingKit).length > 0 ? Object.keys(testingKit).slice(0, 5).join(', ') + '...' : 'None');

  // Check if vitest is being required (not bundled)
  const distContent = require('fs').readFileSync('./packages/testing/dist/index.js', 'utf-8');
  const hasExternalRequire = distContent.includes('require("vitest")');
  const isBundled = distContent.includes('vitest') && !hasExternalRequire && !distContent.includes('peerDependencies');

  if (hasExternalRequire) {
    console.log('   ✅ vitest is external (proper require() call found)');
  } else if (isBundled) {
    console.log('   ⚠️  WARNING: vitest appears to be bundled');
  }
} catch (error) {
  console.log('❌ FAILED: @ainative/ai-kit-testing');
  console.log('   Error:', error.message);
}

console.log('\n---\n');

// Test 3: Verify package.json versions
console.log('Test 3: Verify updated versions');
const reactPkg = require('./packages/react/package.json');
const testingPkg = require('./packages/testing/package.json');

console.log('✅ @ainative/ai-kit version:', reactPkg.version);
console.log('   Expected: 0.1.0-alpha.2');
console.log('   Match:', reactPkg.version === '0.1.0-alpha.2' ? '✅ YES' : '❌ NO');

console.log('\n✅ @ainative/ai-kit-testing version:', testingPkg.version);
console.log('   Expected: 0.1.3');
console.log('   Match:', testingPkg.version === '0.1.3' ? '✅ YES' : '❌ NO');

console.log('\n=== Test Complete ===');
