import { TEMPLATES } from '../src/lib/templates/templates';
import { generateVxml } from '../src/lib/vxml/generator';
import { parseVxml } from '../src/lib/vxml/parser';
import { validateVxml } from '../src/lib/vxml/validator';
import { autoLayoutNodes } from '../src/lib/vxml/layout';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log('🧪 Starting VoiceXML 2.1 Compliance & Architecture Test Suite...\n');

// Test 1: Generate VXML from Customer Support Router Template
const t1 = TEMPLATES[0];
const vxml1 = generateVxml(t1.nodes, t1.edges, t1.settings);

assert(vxml1.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Includes XML declaration');
assert(vxml1.includes('version="2.1"'), 'Root element specifies version="2.1"');
assert(vxml1.includes('xmlns="http://www.w3.org/2001/vxml"'), 'Root element includes standard W3C VXML namespace');
assert(vxml1.includes('<menu id="main_menu" dtmf="true">'), 'Generates <menu> dialog with DTMF attribute');
assert(vxml1.includes('<choice dtmf="1" next="#account_form">Account Services</choice>'), 'Generates choice with next target and DTMF key');
assert(vxml1.includes('<field name="acc_num" type="digits?minlength=6;maxlength=8">'), 'Generates field with type and parameters');
assert(vxml1.includes('<transfer name="agent_xfer" dest="tel:+18005550199" bridge="true" connecttimeout="30s">'), 'Generates transfer element with telephony destination and bridge');
assert(vxml1.includes('<disconnect/>'), 'Generates disconnect tag');

// Test 2: Generate VXML for VXML 2.1 <data> feature
const t2 = TEMPLATES[1];
const vxml2 = generateVxml(t2.nodes, t2.edges, t2.settings);

assert(vxml2.includes('<data name="user_data" src="/api/v1/customer/lookup" method="post" namelist="auth_pin"/>'), 'Generates VXML 2.1 <data> element with method and namelist');
assert(vxml2.includes('<if cond="auth_pin === &apos;1234&apos;">'), 'Generates <if> condition with XML escaping');
assert(vxml2.includes('<else/>'), 'Generates <else/> branch');

// Test 3: Generate Audio Recording Template
const t3 = TEMPLATES[2];
const vxml3 = generateVxml(t3.nodes, t3.edges, t3.settings);

assert(vxml3.includes('<record name="caller_voicemail" beep="true" maxtime="45s" dtmfterm="true" type="audio/x-wav">'), 'Generates audio record tag with beep, maxtime, and audio/x-wav MIME type');

// Test 4: Spec Diagnostics and Validator
const diagClean = validateVxml(t1.nodes, t1.edges, t1.settings);
assert(diagClean.filter((d) => d.severity === 'error').length === 0, 'Valid template produces 0 errors in validator');

// Test 4b: Spec Diagnostics flags broken target
const brokenEdges = [
  ...t1.edges,
  { id: 'broken_1', source: 'main_menu', target: 'non_existent_node_id' }
];
const diagBroken = validateVxml(t1.nodes, brokenEdges, t1.settings);
assert(diagBroken.some((d) => d.id.includes('broken-edge')), 'Validator flags broken edge referencing non-existent dialog');

// Test 4c: Spec Diagnostics flags duplicate dialog IDs
const dupNodes = [
  ...t1.nodes,
  {
    id: 'dup_menu',
    type: 'vxml-menu',
    position: { x: 0, y: 0 },
    data: { dialogId: 'main_menu', label: 'Dup Menu', choices: [] }
  }
];
const diagDup = validateVxml(dupNodes as any, t1.edges, t1.settings);
assert(diagDup.some((d) => d.id.includes('duplicate-id')), 'Validator flags duplicate dialog IDs according to VXML 2.1 §2.1.1');

// Test 5: Auto-Layout Algorithm
const laidOut = autoLayoutNodes(t1.nodes, t1.edges);
assert(laidOut.length === t1.nodes.length, 'Auto layout preserves all nodes');
assert(laidOut[0].position.x !== undefined && laidOut[0].position.y !== undefined, 'Nodes have valid coordinates assigned');

// Test 6: Round-Trip Parser Test
const parsed = parseVxml(vxml1);
assert(!parsed.error, `Parsed VXML successfully without error: ${parsed.error}`);
assert(parsed.nodes.length > 0, `Parsed ${parsed.nodes.length} nodes from generated VXML`);
assert(parsed.nodes.some((n) => n.id === 'main_menu'), 'Parsed main_menu node');
assert(parsed.nodes.some((n) => n.id === 'account_form'), 'Parsed account_form node');
// Test 7: SRGS 1.0 Grammar Generation and Matching
import { srgsToXml, xmlToSrgs, testGrammarMatch, GRAMMAR_TEMPLATES } from '../src/lib/grammar/srgs';

const yesNoTpl = GRAMMAR_TEMPLATES[0];
const srgsXml = srgsToXml(yesNoTpl.grammar);
assert(srgsXml.includes('xmlns="http://www.w3.org/2001/06/grammar"'), 'SRGS XML contains W3C grammar namespace');
assert(srgsXml.includes('<rule id="YES_NO" scope="public">'), 'SRGS XML generates rule definition');
assert(srgsXml.includes('<one-of>'), 'SRGS XML generates one-of alternatives');
assert(srgsXml.includes('<tag>out = true;</tag>'), 'SRGS XML includes semantic interpretation tag');

const parsedSrgs = xmlToSrgs(srgsXml);
assert(parsedSrgs.root === 'YES_NO', 'Parsed SRGS root rule');
assert(parsedSrgs.rules[0].items.length > 0, 'Parsed SRGS grammar rule items');

const matchResult = testGrammarMatch(parsedSrgs, 'yeah');
assert(matchResult.matched === true, 'SRGS matcher matches spoken synonym "yeah"');
assert(matchResult.semanticValue === 'true', 'SRGS matcher extracts semantic value "true"');

const nomatchResult = testGrammarMatch(parsedSrgs, 'maybe');
assert(nomatchResult.matched === false, 'SRGS matcher correctly returns NOMATCH for unrecognized word');

console.log('\n🎉 ALL 26 TESTS PASSED SUCCESSFULLY! VoiceXML 2.1 & SRGS 1.0 verified.');
