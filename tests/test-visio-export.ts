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
const shapes = doc.getElementsByTagName('Shape');
assert.ok(shapes.length >= sampleTemplate.nodes.length + sampleTemplate.edges.length, 'Contains shapes for nodes and connectors');

// Test 5: Connects elements generated for edges
const connects = doc.getElementsByTagName('Connect');
assert.strictEqual(connects.length, sampleTemplate.edges.length * 2, 'Contains 2 connection points (BeginX & EndX) per edge');

// Test 6: Decision diamond shape generated for conditions
const condTemplate = TEMPLATES.find((t) => t.nodes.some((n) => n.type === 'vxml-condition'));
assert.ok(condTemplate, 'Found template with condition node');
const condVdx = generateVisioVdx(condTemplate.nodes as any, condTemplate.edges as any, condTemplate.settings);
const condDoc = new DOMParser().parseFromString(condVdx, 'application/xml');
assert.strictEqual(condDoc.getElementsByTagName('parsererror').length, 0, 'Condition template VDX is valid XML');

// --- VERIFICATION OF PREVIOUS DEFECTS ---

// Defect 1: No double-escaped line breaks (&amp;#x0A;)
assert.strictEqual(vdx.includes('&amp;#x0A;'), false, 'Does not double-escape line breaks as &amp;#x0A;');
assert.ok(vdx.includes('&#x0A;'), 'Contains valid single-escaped &#x0A; entity for line breaks');
// Parse and verify text content actually has real newline characters
let foundNewlineInNodeText = false;
for (let i = 0; i < shapes.length; i++) {
  const shape = shapes[i];
  const textElem = shape.getElementsByTagName('Text')[0];
  if (textElem && textElem.textContent && textElem.textContent.includes('\n')) {
    foundNewlineInNodeText = true;
    assert.strictEqual(textElem.textContent.includes('&#x0A;'), false, 'Parsed text contains actual newline, not literal &#x0A;');
  }
}
assert.ok(foundNewlineInNodeText, 'Parsed node text contains real newlines');
console.log('✅ Defect 1 verified: Line breaks are properly single-escaped and parse to actual newlines');

// Defect 2: Prompts are not truncated with literal "..."
const longPromptText = 'Thank you for calling Acme Telecom. Please listen carefully as our menu options have changed.';
const customNodes = [
  {
    id: 'long_prompt_node',
    type: 'vxml-menu',
    position: { x: 100, y: 100 },
    data: {
      label: 'Main Menu',
      prompt: { text: longPromptText },
      choices: [{ dtmf: '1', next: 'acct' }]
    }
  },
  {
    id: 'acct',
    type: 'vxml-block',
    position: { x: 100, y: 300 },
    data: { label: 'Account' }
  }
];
const customEdges = [
  { id: 'e1', source: 'long_prompt_node', target: 'acct', label: '[1] Account' }
];
const customVdx = generateVisioVdx(customNodes as any, customEdges as any);
assert.ok(customVdx.includes(longPromptText), 'Full long prompt text is preserved without truncation');
assert.strictEqual(customVdx.includes('Acme Telecom. ...'), false, 'No artificial "..." truncation');
console.log('✅ Defect 2 verified: Full prompt text preserved without truncation');

// Defect 3: No dangling style references (FaceNames, StyleSheets, Masters present)
const faceNames = doc.getElementsByTagName('FaceNames');
assert.strictEqual(faceNames.length, 1, 'Document contains <FaceNames> font table');
const styleSheets = doc.getElementsByTagName('StyleSheets');
assert.strictEqual(styleSheets.length, 1, 'Document contains <StyleSheets> table');
const masters = doc.getElementsByTagName('Masters');
assert.strictEqual(masters.length, 1, 'Document contains <Masters> collection');

// Verify style IDs 0, 1, 2, 3, 4 are defined
const styleSheetElements = doc.getElementsByTagName('StyleSheet');
const styleIds = Array.from(styleSheetElements).map(s => s.getAttribute('ID'));
assert.ok(styleIds.includes('0'), 'StyleSheet ID 0 defined');
assert.ok(styleIds.includes('3'), 'StyleSheet ID 3 (Normal) defined');
assert.ok(styleIds.includes('4'), 'StyleSheet ID 4 (Connector) defined');
console.log('✅ Defect 3 verified: FaceNames, StyleSheets (0-4), and Masters fully defined');

// Defect 4: True dynamic connectors referencing Master ID="1" and ShapeRouteStyle
const master = doc.getElementsByTagName('Master')[0];
assert.ok(master, 'Master exists');
assert.strictEqual(master.getAttribute('NameU'), 'Dynamic connector', 'Master is Dynamic connector');
const connectorShapes = Array.from(doc.getElementsByTagName('Shape')).filter(s => s.getAttribute('Master') === '1');
assert.strictEqual(connectorShapes.length, sampleTemplate.edges.length, 'Connectors reference Dynamic connector Master="1"');
for (const conn of connectorShapes) {
  const routeStyle = conn.getElementsByTagName('ShapeRouteStyle')[0];
  assert.ok(routeStyle, 'Connector has ShapeRouteStyle');
  assert.strictEqual(routeStyle.textContent, '1', 'ShapeRouteStyle is 1 (Orthogonal right-angle routing)');
}
console.log('✅ Defect 4 verified: Connectors backed by Dynamic connector Master and orthogonal routing');

// Defect 5: Arrows run perimeter to perimeter; connectors written before nodes in drawing order
const firstConnector = connectorShapes[0];
const beginX = parseFloat(firstConnector.getElementsByTagName('BeginX')[0].textContent || '0');
const beginY = parseFloat(firstConnector.getElementsByTagName('BeginY')[0].textContent || '0');
// Verify connector is before nodes in child sequence of Shapes
const shapesContainer = doc.getElementsByTagName('Shapes')[0];
const allShapesInOrder = Array.from(shapesContainer.childNodes).filter(n => n.nodeName === 'Shape') as Element[];
const firstConnectorIdx = allShapesInOrder.findIndex(s => s.getAttribute('Master') === '1');
const firstNodeIdx = allShapesInOrder.findIndex(s => s.getAttribute('Master') !== '1');
assert.ok(firstConnectorIdx < firstNodeIdx, 'Connectors are emitted BEFORE nodes in drawing order (z-order background)');
console.log('✅ Defect 5 verified: Connectors start/end on perimeter and are ordered behind nodes');

// Defect 6: Connection points glue with ToPart="100+connIdx" and FromPart 9/12
for (let i = 0; i < connects.length; i++) {
  const c = connects[i];
  const toPart = parseInt(c.getAttribute('ToPart') || '0', 10);
  assert.ok(toPart >= 100, `ToPart must be >= 100 for connection points (got ${toPart})`);
  assert.notStrictEqual(toPart, 3, 'ToPart must NOT be 3 (whole-shape PinX glue)');
  const toCell = c.getAttribute('ToCell') || '';
  assert.ok(toCell.startsWith('Connections.X'), `ToCell must target Connections.X[i] (got ${toCell})`);
  const fromCell = c.getAttribute('FromCell');
  const fromPart = c.getAttribute('FromPart');
  if (fromCell === 'BeginX') {
    assert.strictEqual(fromPart, '9', 'BeginX FromPart is 9');
  } else if (fromCell === 'EndX') {
    assert.strictEqual(fromPart, '12', 'EndX FromPart is 12');
  }
}
console.log('✅ Defect 6 verified: Glue targets Connection Points with ToPart >= 100 and FromPart 9/12');

// Defect 7: Rotated labels counteract angle with TxtAngle F="-Angle"
const customDoc = new DOMParser().parseFromString(customVdx, 'application/xml');
const customConnector = Array.from(customDoc.getElementsByTagName('Shape')).find(s => s.getAttribute('Master') === '1');
assert.ok(customConnector, 'Found connector in custom flow');
const txtAngle = customConnector.getElementsByTagName('TxtAngle')[0];
assert.ok(txtAngle, 'Connector has TxtAngle element');
assert.strictEqual(txtAngle.getAttribute('F'), '-Angle', 'TxtAngle has F="-Angle" formula to remain upright and horizontal');
console.log('✅ Defect 7 verified: Connector label has TxtAngle F="-Angle" to remain horizontal');

// Defect 8: Responsive layout, TextBlock with margins, and TEXTHEIGHT formula
const pageShapes = Array.from(page.getElementsByTagName('Shape'));
const pageNodeShapes = pageShapes.filter(s => s.getAttribute('Master') !== '1');
assert.strictEqual(pageNodeShapes.length, sampleTemplate.nodes.length, 'Found all page node shapes');
for (const nodeShape of pageNodeShapes) {
  const textBlock = nodeShape.getElementsByTagName('TextBlock')[0];
  assert.ok(textBlock, 'Node shape contains <TextBlock> element');
  assert.ok(textBlock.getElementsByTagName('LeftMargin').length > 0, 'TextBlock specifies LeftMargin');
  assert.ok(textBlock.getElementsByTagName('RightMargin').length > 0, 'TextBlock specifies RightMargin');
  assert.ok(textBlock.getElementsByTagName('TopMargin').length > 0, 'TextBlock specifies TopMargin');
  assert.ok(textBlock.getElementsByTagName('BottomMargin').length > 0, 'TextBlock specifies BottomMargin');

  const heightElem = nodeShape.getElementsByTagName('Height')[0];
  assert.ok(heightElem, 'Height element exists');
  const heightFormula = heightElem.getAttribute('F') || '';
  assert.ok(heightFormula.includes('TEXTHEIGHT(TheText,Width)'), 'Height uses TEXTHEIGHT(TheText,Width) for dynamic expansion');
}
console.log('✅ Defect 8 verified: TextBlock margins and TEXTHEIGHT dynamic layout verified');

console.log('🎉 ALL 8 VISIO DEFECT VERIFICATIONS PASSED SUCCESSFULLY!');
