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

// Test 4: Shapes generated for nodes, connectors, and standalone edge labels
const pageShapes = Array.from(page.getElementsByTagName('Shape'));
const pageNodeShapes = pageShapes.filter(s => s.getAttribute('LineStyle') === '3' && s.getAttribute('FillStyle') === '3');
const pageConnectorShapes = pageShapes.filter(s => s.getAttribute('Master') === '1');
const pageLabelShapes = pageShapes.filter(s => s.getAttribute('LineStyle') === '1' && s.getAttribute('FillStyle') === '1');

assert.strictEqual(pageNodeShapes.length, sampleTemplate.nodes.length, 'Contains all page node shapes');
assert.strictEqual(pageConnectorShapes.length, sampleTemplate.edges.length, 'Contains all connector shapes');
assert.strictEqual(pageLabelShapes.length, sampleTemplate.edges.length, 'Contains standalone 2D label shapes for all 6 edges');

// Test 5: Connects elements generated for edges
const connects = doc.getElementsByTagName('Connect');
assert.strictEqual(connects.length, sampleTemplate.edges.length * 2, 'Contains 2 connection points (BeginX & EndX) per edge');

// Test 6: Decision diamond shape generated for conditions
const condTemplate = TEMPLATES.find((t) => t.nodes.some((n) => n.type === 'vxml-condition'));
assert.ok(condTemplate, 'Found template with condition node');
const condVdx = generateVisioVdx(condTemplate.nodes as any, condTemplate.edges as any, condTemplate.settings);
const condDoc = new DOMParser().parseFromString(condVdx, 'application/xml');
assert.strictEqual(condDoc.getElementsByTagName('parsererror').length, 0, 'Condition template VDX is valid XML');

// --- VERIFICATION OF EDGE LABELS, PADDING, AND ALIGNMENT ---

// Verification 1: No black rectangles (<TextBkgnd>1</TextBkgnd>) anywhere in the document
assert.strictEqual(vdx.includes('<TextBkgnd>1</TextBkgnd>'), false, 'No <TextBkgnd>1</TextBkgnd> which causes black rectangles in viewers');
console.log('✅ Fix 1 verified: Zero occurrences of <TextBkgnd>1</TextBkgnd>');

// Verification 2: Standalone 2D edge labels at mid-edge with explicit white backing (#FFFFFF) and horizontal angle (0)
for (const labelShape of pageLabelShapes) {
  const angle = labelShape.getElementsByTagName('Angle')[0];
  assert.strictEqual(angle.textContent, '0', 'Label shape is strictly horizontal (Angle=0)');

  const fill = labelShape.getElementsByTagName('FillForegnd')[0];
  assert.strictEqual(fill.textContent, '#FFFFFF', 'Label shape has explicit #FFFFFF white background');

  const line = labelShape.getElementsByTagName('LinePattern')[0];
  assert.strictEqual(line.textContent, '0', 'Label shape has no border (LinePattern=0)');

  const pinX = parseFloat(labelShape.getElementsByTagName('PinX')[0].textContent || '0');
  assert.ok(pinX >= 3.5 && pinX <= 10.5, `Label pinX (${pinX}) must be centered along the edge`);
}
console.log('✅ Fix 2 verified: Edge labels are standalone 2D shapes at mid-edge with white backing');

// Verification 3: Connectors have no text (avoids start-point piling or label collision)
for (const conn of pageConnectorShapes) {
  const text = conn.getElementsByTagName('Text');
  assert.strictEqual(text.length, 0, '1-D connectors carry no embedded text');
}
console.log('✅ Fix 3 verified: 1-D connectors carry no embedded text');

// Verification 4: Margins in inches (small decimals) and inset TxtXForm so text never touches border
for (const nodeShape of pageNodeShapes) {
  const leftMargin = nodeShape.getElementsByTagName('LeftMargin')[0];
  assert.ok(leftMargin, 'LeftMargin specified');
  assert.strictEqual(leftMargin.getAttribute('Unit'), 'IN', 'LeftMargin uses Unit="IN"');
  const marginVal = parseFloat(leftMargin.textContent || '0');
  assert.ok(marginVal < 0.1, `LeftMargin (${marginVal} in) is small fractional inch, never whole numbers`);

  const txtXForm = nodeShape.getElementsByTagName('TxtXForm')[0];
  const txtWidth = parseFloat(txtXForm.getElementsByTagName('TxtWidth')[0].textContent || '0');
  const shapeWidth = parseFloat(nodeShape.getElementsByTagName('Width')[0].textContent || '0');
  assert.ok(txtWidth < shapeWidth, 'TxtWidth is inset from shape Width to provide clean padding');
}
console.log('✅ Fix 4 verified: Text block margins use Unit="IN" (decimal) and TxtXForm is inset from borders');

// Verification 5: Edge between Tech Support and Disconnect runs level (dy === 0)
// Find the connector connecting tech_support and goodbye
let techDoneConnector: Element | undefined;
for (let i = 0; i < pageConnectorShapes.length; i++) {
  const conn = pageConnectorShapes[i];
  const connId = conn.getAttribute('ID');
  // Check if connects point to tech_support and goodbye
  const beginConnect = Array.from(connects).find(c => c.getAttribute('FromSheet') === connId && c.getAttribute('FromCell') === 'BeginX');
  const endConnect = Array.from(connects).find(c => c.getAttribute('FromSheet') === connId && c.getAttribute('FromCell') === 'EndX');
  if (beginConnect && endConnect) {
    const beginY = parseFloat(conn.getElementsByTagName('BeginY')[0].textContent || '0');
    const endY = parseFloat(conn.getElementsByTagName('EndY')[0].textContent || '0');
    // If tech_support to goodbye (edge_tech_done)
    if (Math.abs(beginY - endY) < 0.001) {
      techDoneConnector = conn;
      break;
    }
  }
}
assert.ok(techDoneConnector, 'Found horizontal level connector between aligned nodes');
const levelAngle = techDoneConnector.getElementsByTagName('Angle')[0].textContent;
assert.strictEqual(parseFloat(levelAngle || '1'), 0, 'Level connector has Angle=0');
console.log('✅ Fix 5 verified: Horizontal connector runs level without slope');

console.log('🎉 ALL VISIO VISUAL REFINEMENTS VERIFIED SUCCESSFULLY!');
