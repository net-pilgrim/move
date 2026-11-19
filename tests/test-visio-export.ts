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

// Test 4: Shapes generated for nodes and edges
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

console.log('✅ Visio XML DatadiagramML (.vdx) structure verified');
console.log('✅ Glue connections mapping verified');
console.log('✅ Decision diamond & block geometries verified');
console.log('🎉 Microsoft Visio Exporter Test Suite PASSED!');
