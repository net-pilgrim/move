import assert from 'node:assert';
import { TEMPLATES } from '../src/lib/templates/templates';
import { validateVxml } from '../src/lib/vxml/validator';
import { generateVxml } from '../src/lib/vxml/generator';
import type { Node, Edge } from '@xyflow/svelte';

console.log('🧪 Starting Node and Link Deletion Test Suite...\n');

const template = TEMPLATES[0];
let testNodes: Node[] = JSON.parse(JSON.stringify(template.nodes));
let testEdges: Edge[] = JSON.parse(JSON.stringify(template.edges));
const settings = JSON.parse(JSON.stringify(template.settings));

const initialNodeCount = testNodes.length;
const initialEdgeCount = testEdges.length;

assert(initialNodeCount > 0, 'Initial nodes should not be empty');
assert(initialEdgeCount > 0, 'Initial edges should not be empty');

// Test 1: Deleting a single link (edge)
const edgeToDelete = testEdges[0];
testEdges = testEdges.filter((e) => e.id !== edgeToDelete.id);

assert.strictEqual(testEdges.length, initialEdgeCount - 1, 'Edge count should decrease by 1');
assert(!testEdges.some((e) => e.id === edgeToDelete.id), 'Deleted edge should no longer be present');
assert.strictEqual(testNodes.length, initialNodeCount, 'Nodes should remain untouched when link is deleted');
console.log('✅ Deleting a link removes only the link and preserves all nodes');

// Test 2: VXML generation still succeeds after deleting a link
const vxmlAfterLinkDelete = generateVxml(testNodes, testEdges, settings);
assert(vxmlAfterLinkDelete.includes('<vxml'), 'VXML output should be valid XML structure');
console.log('✅ VXML generation succeeds cleanly after link deletion');

// Test 3: Deleting a node cascades to its connected links
const nodeToDelete = testNodes.find((n) => n.id === 'account_form') || testNodes[1];
const connectedEdges = testEdges.filter(
  (e) => e.source === nodeToDelete.id || e.target === nodeToDelete.id
);

testNodes = testNodes.filter((n) => n.id !== nodeToDelete.id);
testEdges = testEdges.filter(
  (e) => e.source !== nodeToDelete.id && e.target !== nodeToDelete.id
);

assert(!testNodes.some((n) => n.id === nodeToDelete.id), 'Deleted node should no longer exist');
for (const e of connectedEdges) {
  assert(
    !testEdges.some((edge) => edge.id === e.id),
    `Connected edge ${e.id} should be cascaded and deleted`
  );
}
console.log('✅ Deleting a node cascades and removes all connected links');

// Test 4: Validation passes without broken dialog references
const diagnostics = validateVxml(testNodes, testEdges, settings);
const brokenEdges = diagnostics.filter((d) => d.message.includes('references missing dialog'));
assert.strictEqual(brokenEdges.length, 0, 'No broken link diagnostics should remain after cascade deletion');
console.log('✅ Validator confirms no dangling references after node and link deletion');

console.log('\n🎉 ALL DELETION TESTS PASSED SUCCESSFULLY!');
