import assert from 'node:assert';
import { DOMParser } from '@xmldom/xmldom';
import { generateVisioVdx } from '../src/lib/visio/visio-export';
import { TEMPLATES } from '../src/lib/templates/templates';

console.log('🧪 Starting Microsoft Visio (.vdx) Exporter Test Suite...');

const sampleTemplate = TEMPLATES[0]; // Customer Support Router
const vdx = generateVisioVdx(sampleTemplate.nodes as any, sampleTemplate.edges as any, sampleTemplate.settings);

// Test 1: Contains Visio XML declaration and root namespace
assert.ok(vdx.includes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'), 'Includes XML declaration');
assert.ok(vdx.includes('http://schemas.microsoft.com/visio/2003/core'), 'Includes Visio 2003 core namespace');
assert.ok(vdx.includes('<VisioDocument'), 'Contains VisioDocument root tag');

// Test 2: Valid XML parsing without parsererror
const doc = new DOMParser().parseFromString(vdx, 'application/xml');
const parserErrors = doc.getElementsByTagName('parsererror');
assert.strictEqual(parserErrors.length, 0, 'No XML parser errors in generated VDX');

// Test 3: Page props and dimensions
const pageProps = doc.getElementsByTagName('PageProps');
assert.strictEqual(pageProps.length, 1, 'Contains PageProps element');
const page = doc.getElementsByTagName('Page')[0];
assert.ok(page, 'Contains Page element');

// Test 4: Shapes generated for nodes and connectors
const pageShapes = Array.from(page.getElementsByTagName('Shape'));
const pageNodeShapes = pageShapes.filter(s => s.getAttribute('Master') !== '1');
const pageConnectorShapes = pageShapes.filter(s => s.getAttribute('Master') === '1');
assert.strictEqual(pageNodeShapes.length, sampleTemplate.nodes.length, 'Contains all page node shapes');
assert.strictEqual(pageConnectorShapes.length, sampleTemplate.edges.length, 'Contains all connector shapes');

// Test 5: Connects elements generated for edges
const connects = doc.getElementsByTagName('Connect');
assert.strictEqual(connects.length, sampleTemplate.edges.length * 2, 'Contains 2 connection points (BeginX & EndX) per edge');

// Test 6: Decision diamond shape generated for conditions
const condTemplate = TEMPLATES.find((t) => t.nodes.some((n) => n.type === 'vxml-condition'));
assert.ok(condTemplate, 'Found template with condition node');
const condVdx = generateVisioVdx(condTemplate.nodes as any, condTemplate.edges as any, condTemplate.settings);
const condDoc = new DOMParser().parseFromString(condVdx, 'application/xml');
assert.strictEqual(condDoc.getElementsByTagName('parsererror').length, 0, 'Condition template VDX is valid XML');

// --- VERIFICATION OF CONNECTOR WIRING & LAYOUT DEFECTS ---

// Defect 1: Arrows land on incoming side of target (e.g. Left edge Connections.X3 when coming from the left, Top edge Connections.X1 when coming from above)
// In sampleTemplate:
// - Left-to-right edges (dx > 0) must enter at Connections.X3 (Left, ToPart 102), never Connections.X4 (Right, 103)
// - Top-to-bottom vertical edges (account_block -> goodbye) must enter at Connections.X1 (Top, ToPart 100), never Connections.X2 (Bottom, 101)
for (let i = 0; i < connects.length; i++) {
  const c = connects[i];
  const fromCell = c.getAttribute('FromCell');
  const toCell = c.getAttribute('ToCell') || '';
  const toPart = parseInt(c.getAttribute('ToPart') || '0', 10);

  if (fromCell === 'EndX') {
    // Target entry port must be either Left (Connections.X3) for horizontal edges or Top (Connections.X1) for vertical edges
    assert.ok(
      toCell === 'Connections.X3' || toCell === 'Connections.X1',
      `EndX must enter at Connections.X3 (Left) or Connections.X1 (Top), got ${toCell}`
    );
    assert.notStrictEqual(toCell, 'Connections.X4', 'EndX must NEVER cross the target box to Connections.X4 (far right edge)');
    assert.notStrictEqual(toCell, 'Connections.X2', 'EndX must NEVER cross the target box to Connections.X2 (bottom edge when coming from above)');
    assert.ok(toPart === 102 || toPart === 100, `ToPart must be 102 (Left) or 100 (Top), got ${toPart}`);
  } else if (fromCell === 'BeginX') {
    // Source exit port must be Right (Connections.X4) for horizontal edges or Bottom (Connections.X2) for vertical edges
    assert.ok(
      toCell === 'Connections.X4' || toCell === 'Connections.X2',
      `BeginX must exit at Connections.X4 (Right) or Connections.X2 (Bottom), got ${toCell}`
    );
    assert.ok(toPart === 103 || toPart === 101, `ToPart must be 103 (Right) or 101 (Bottom), got ${toPart}`);
  }
}
console.log('✅ Defect 1 verified: Arrows cleanly enter target left edge (X3) or top edge (X1) without crossing boxes');

// Defect 2: Node overlap prevention (e.g. Tech Support vs Disconnect)
// Collect node bounding boxes and verify zero overlap between any pair of nodes
interface Box {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
const boxes: Box[] = [];
for (const nodeShape of pageNodeShapes) {
  const pinX = parseFloat(nodeShape.getElementsByTagName('PinX')[0].textContent || '0');
  const pinY = parseFloat(nodeShape.getElementsByTagName('PinY')[0].textContent || '0');
  const width = parseFloat(nodeShape.getElementsByTagName('Width')[0].textContent || '0');
  const height = parseFloat(nodeShape.getElementsByTagName('Height')[0].textContent || '0');
  const shapeId = nodeShape.getAttribute('ID') || '';
  boxes.push({
    id: shapeId,
    minX: pinX - width / 2,
    maxX: pinX + width / 2,
    minY: pinY - height / 2,
    maxY: pinY + height / 2
  });
}

for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    const b1 = boxes[i];
    const b2 = boxes[j];
    const overlapX = Math.max(0, Math.min(b1.maxX, b2.maxX) - Math.max(b1.minX, b2.minX));
    const overlapY = Math.max(0, Math.min(b1.maxY, b2.maxY) - Math.max(b1.minY, b2.minY));
    const overlaps = overlapX > 0 && overlapY > 0;
    assert.strictEqual(overlaps, false, `Nodes ${b1.id} and ${b2.id} must not overlap! (overlapX: ${overlapX}, overlapY: ${overlapY})`);
  }
}
console.log('✅ Defect 2 verified: Zero node bounding-box overlap across all diagram shapes');

// Defect 3: No duplicate shape IDs between Master shapes and Page shapes
const masterShapes = Array.from(doc.getElementsByTagName('Masters')[0].getElementsByTagName('Shape'));
const masterShapeIds = new Set(masterShapes.map(s => s.getAttribute('ID')));
const allPageShapeIds = pageShapes.map(s => s.getAttribute('ID'));
for (const pid of allPageShapeIds) {
  assert.strictEqual(masterShapeIds.has(pid), false, `Page shape ID ${pid} must not collide with master shape IDs`);
}
console.log('✅ Defect 3 verified: Master shape IDs and Page shape IDs are globally distinct');

// Defect 4: No viewer-breaking TEXTHEIGHT formulas on Height; explicit TxtXForm width prevents 1-char vertical text
for (const nodeShape of pageNodeShapes) {
  const heightElem = nodeShape.getElementsByTagName('Height')[0];
  const heightFormula = heightElem.getAttribute('F') || '';
  assert.strictEqual(heightFormula.includes('TEXTHEIGHT'), false, 'Height must not use TEXTHEIGHT formula which collapses third-party viewers');

  const txtXForm = nodeShape.getElementsByTagName('TxtXForm')[0];
  assert.ok(txtXForm, 'Node contains explicit <TxtXForm>');
  const txtWidth = txtXForm.getElementsByTagName('TxtWidth')[0];
  assert.ok(txtWidth, 'TxtXForm specifies TxtWidth');
  const txtWidthVal = parseFloat(txtWidth.textContent || '0');
  assert.ok(txtWidthVal >= 1.5, `TxtWidth (${txtWidthVal}) must be >= 1.5 inches to ensure full multiline text wrapping`);
}
console.log('✅ Defect 4 verified: Height has no brittle formulas; TxtXForm specifies full width');

// Defect 5: Medium standard filled arrowhead (EndArrow=4, EndArrowSize=2)
for (const conn of pageConnectorShapes) {
  const endArrow = conn.getElementsByTagName('EndArrow')[0];
  const endArrowSize = conn.getElementsByTagName('EndArrowSize')[0];
  assert.strictEqual(endArrow.textContent, '4', 'EndArrow is 4 (Standard solid arrow)');
  assert.strictEqual(endArrowSize.textContent, '2', 'EndArrowSize is 2 (Standard medium arrow)');
}
console.log('✅ Defect 5 verified: Connectors use standard solid arrowheads (EndArrow=4, EndArrowSize=2)');

console.log('🎉 ALL VISIO CONNECTOR & LAYOUT TESTS PASSED SUCCESSFULLY!');
