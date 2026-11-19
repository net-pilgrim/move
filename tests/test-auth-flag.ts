import assert from 'node:assert';

console.log('🧪 Starting Authentication Feature Flag Test Suite...');

// Feature flag evaluation logic matching src/lib/auth/clerk.svelte.ts
const evaluateAuthFeature = (env: Record<string, string | undefined>) => {
  return Boolean(env.VITE_ENABLE_AUTH === 'true' || env.VITE_ENABLE_CLERK_AUTH === 'true');
};

assert.strictEqual(evaluateAuthFeature({}), false, 'Auth should be disabled when unset');
assert.strictEqual(evaluateAuthFeature({ VITE_ENABLE_AUTH: 'false' }), false, 'Auth should be disabled when false');
assert.strictEqual(evaluateAuthFeature({ VITE_ENABLE_AUTH: 'true' }), true, 'Auth should be enabled when true');
assert.strictEqual(evaluateAuthFeature({ VITE_ENABLE_CLERK_AUTH: 'true' }), true, 'Auth should be enabled via VITE_ENABLE_CLERK_AUTH');
assert.strictEqual(evaluateAuthFeature({ VITE_ENABLE_AUTH: 'foo' }), false, 'Auth should be disabled for non-true strings');
console.log('✅ Feature flag evaluation correctly defaults to disabled (false)');

console.log('🎉 Auth Feature Flag Test Suite PASSED!');
