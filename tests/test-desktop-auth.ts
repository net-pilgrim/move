import assert from 'node:assert';
import { isDesktopApp, openFileWithNativeDialog, saveFileWithNativeDialog } from '../src/lib/file-dialogs.js';

console.log('🧪 Starting Desktop & Feature Flag Test Suite...');

// Test 1: Feature flag evaluation logic
const evaluateAuthFeature = (env: Record<string, string | undefined>) => {
  return Boolean(env.VITE_ENABLE_AUTH === 'true' || env.VITE_ENABLE_CLERK_AUTH === 'true');
};

assert.strictEqual(evaluateAuthFeature({}), false, 'Auth should be disabled when unset');
assert.strictEqual(evaluateAuthFeature({ VITE_ENABLE_AUTH: 'false' }), false, 'Auth should be disabled when false');
assert.strictEqual(evaluateAuthFeature({ VITE_ENABLE_AUTH: 'true' }), true, 'Auth should be enabled when true');
assert.strictEqual(evaluateAuthFeature({ VITE_ENABLE_CLERK_AUTH: 'true' }), true, 'Auth should be enabled via VITE_ENABLE_CLERK_AUTH');
console.log('✅ Feature flag evaluation correctly defaults to false');

// Test 2: isDesktopApp detection function
const isDesktop = isDesktopApp();
assert.strictEqual(typeof isDesktop, 'boolean', 'isDesktopApp should return boolean');
console.log(`✅ isDesktopApp returns boolean (currently: ${isDesktop})`);

// Test 3: Dialog functions exported
assert.strictEqual(typeof openFileWithNativeDialog, 'function', 'openFileWithNativeDialog is exported');
assert.strictEqual(typeof saveFileWithNativeDialog, 'function', 'saveFileWithNativeDialog is exported');
console.log('✅ Native dialog helpers exported properly');

console.log('🎉 Desktop & Feature Flag Test Suite PASSED!');

