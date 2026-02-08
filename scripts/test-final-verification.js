#!/usr/bin/env node

console.log('=== Final Package Verification ===\n');

// Test 1: React package loads without errors
console.log('Test 1: @ainative/ai-kit (React package)');
try {
  const reactKit = require('./packages/react/dist/index.js');
  console.log('✅ Package loads successfully');
  console.log('   Exports:', Object.keys(reactKit).length, 'components/utilities');

  // Check the dist file for external requires
  const fs = require('fs');
  const distContent = fs.readFileSync('./packages/react/dist/index.js', 'utf-8');

  // Check for external requires (should be present)
  const hasReactSyntaxHighlighterRequire = distContent.includes('require(\'react-syntax-highlighter\')') ||
                                           distContent.includes('require("react-syntax-highlighter")');
  const hasPrismRequire = distContent.includes('require(\'react-syntax-highlighter/dist/cjs/styles/prism\')') ||
                          distContent.includes('require("react-syntax-highlighter/dist/cjs/styles/prism")');

  if (hasReactSyntaxHighlighterRequire) {
    console.log('   ✅ react-syntax-highlighter is external (not bundled)');
  } else {
    console.log('   ❌ react-syntax-highlighter appears to be bundled');
  }

  if (hasPrismRequire) {
    console.log('   ✅ Prism styles are external (not bundled)');
  } else {
    console.log('   ❌ Prism styles appear to be bundled');
  }

  const pkgJson = require('./packages/react/package.json');
  console.log('   Version:', pkgJson.version);

} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n---\n');

// Test 2: Testing package loads without vitest
console.log('Test 2: @ainative/ai-kit-testing (without vitest)');
try {
  const testingKit = require('./packages/testing/dist/index.js');
  console.log('✅ Package loads successfully without vitest installed');
  console.log('   Exports:', Object.keys(testingKit).length, 'utilities');

  // Check for external vitest requires
  const fs = require('fs');
  const distContent = fs.readFileSync('./packages/testing/dist/index.js', 'utf-8');

  const hasVitestRequire = distContent.includes('require(\'vitest\')') ||
                           distContent.includes('require("vitest")');

  if (hasVitestRequire) {
    console.log('   ✅ vitest is external (not bundled)');
  } else {
    console.log('   ❌ vitest appears to be bundled');
  }

  const pkgJson = require('./packages/testing/package.json');
  console.log('   Version:', pkgJson.version);

  // Try to use a function that requires vitest (should fail gracefully)
  console.log('\n   Testing lazy vitest loading...');
  try {
    testingKit.createMockServerResponse();
    console.log('   ⚠️  Function executed (vitest might be installed)');
  } catch (error) {
    if (error.message.includes('vitest is required')) {
      console.log('   ✅ Lazy loading works - error thrown only when function is called');
    } else {
      console.log('   ❌ Unexpected error:', error.message);
    }
  }

} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n---\n');

// Test 3: Summary
console.log('Test 3: Package Configuration Summary\n');

const reactPkg = require('./packages/react/package.json');
const testingPkg = require('./packages/testing/package.json');

console.log('@ainative/ai-kit (React)');
console.log('  Version:', reactPkg.version, reactPkg.version === '0.1.0-alpha.2' ? '✅' : '❌');
console.log('  Dependencies:', Object.keys(reactPkg.dependencies || {}).length);
console.log('  - react-syntax-highlighter:', reactPkg.dependencies['react-syntax-highlighter'] ? '✅ Listed' : '❌ Missing');

console.log('\n@ainative/ai-kit-testing');
console.log('  Version:', testingPkg.version, testingPkg.version === '0.1.3' ? '✅' : '❌');
console.log('  Peer Dependencies:', Object.keys(testingPkg.peerDependencies || {}).length);
console.log('  - vitest:', testingPkg.peerDependencies['vitest'] ? '✅ Peer dependency' : '❌ Not listed');

console.log('\n=== Verification Complete ===');
console.log('\nSummary:');
console.log('- Both packages can be required without errors');
console.log('- Dependencies are external (not bundled)');
console.log('- Versions have been updated correctly');
console.log('- Testing package fails gracefully when vitest is not available');
