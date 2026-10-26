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

// Test 8: Dynamically adding rules to grammar & multi-rule XML serialization
const dynamicGrammar = JSON.parse(JSON.stringify(yesNoTpl.grammar));
dynamicGrammar.rules.push({
  id: 'r_custom_rule',
  name: 'ADDITIONAL_RULE',
  scope: 'public',
  type: 'one-of',
  items: [
    { id: 'i_add_1', phrase: 'operator', semanticTag: 'out = "agent";' },
    { id: 'i_add_2', phrase: 'help desk', semanticTag: 'out = "agent";' }
  ]
});
assert(dynamicGrammar.rules.length === 2, 'Added new rule to grammar rules array');
const multiRuleXml = srgsToXml(dynamicGrammar);
assert(multiRuleXml.includes('<rule id="ADDITIONAL_RULE" scope="public">'), 'Serialized XML includes newly added rule');
const reParsedMultiRule = xmlToSrgs(multiRuleXml);
assert(reParsedMultiRule.rules.length === 2, 'Parsed back 2 rules from serialized XML');
assert(reParsedMultiRule.rules.some((r) => r.name === 'ADDITIONAL_RULE'), 'Parsed rule ADDITIONAL_RULE exists');

// Test 9: Multi-Rule Grammar Matching with Rule References (<ruleref>)
const flightTpl = GRAMMAR_TEMPLATES.find((t) => t.id === 'flight-booking')!;
assert(flightTpl !== undefined, 'Found flight-booking multi-rule template');
const flightMatchCity = testGrammarMatch(flightTpl.grammar, 'san francisco');
assert(flightMatchCity.matched === true, 'Matches city utterance via rule reference');
assert(flightMatchCity.semanticValue === 'SFO', 'Extracts normalized airport code SFO');
const flightMatchClass = testGrammarMatch(flightTpl.grammar, 'business class');
assert(flightMatchClass.matched === true, 'Matches class utterance via rule reference');
assert(flightMatchClass.semanticValue === 'BUSINESS', 'Extracts cabin class BUSINESS');

// Test 10: Speech Airline Assistant Flow (TEMPLATES[3])
const tFlight = TEMPLATES[3];
assert(tFlight.id === 'speech-flight-bot', 'Template 3 is speech-flight-bot flow');
const vxmlFlight = generateVxml(tFlight.nodes, tFlight.edges, tFlight.settings);
assert(!vxmlFlight.includes('<grammar type="application/srgs+xml" root="ROOT" version="1.0">\n      <grammar'), 'Does not produce duplicate nested grammar tags');
assert(vxmlFlight.includes('root="CITY_SELECTION"'), 'Contains CITY_SELECTION root rule in destination field');
const diagFlight = validateVxml(tFlight.nodes, tFlight.edges, tFlight.settings);
assert(diagFlight.filter((d) => d.severity === 'error').length === 0, 'Speech flight flow produces 0 errors in validator');

const parsedFlight = parseVxml(vxmlFlight);
assert(!parsedFlight.error, 'Parsed speech flight flow VXML without errors');
const parsedDestNode = parsedFlight.nodes.find((n) => n.id === 'dest_field');
assert(parsedDestNode !== undefined, 'Found parsed dest_field node');
assert((parsedDestNode!.data as any).type === 'custom', 'Parsed dest_field node has type="custom"');
assert(Boolean((parsedDestNode!.data as any).customGrammar), 'Parsed dest_field node preserves customGrammar');

// Test 11: Speech Department Router Flow (TEMPLATES[4])
const tDept = TEMPLATES[4];
assert(tDept.id === 'speech-dept-router', 'Template 4 is speech-dept-router flow');
const vxmlDept = generateVxml(tDept.nodes, tDept.edges, tDept.settings);
assert(vxmlDept.includes('root="DEPARTMENTS"'), 'Contains DEPARTMENTS root rule in speech field');
const diagDept = validateVxml(tDept.nodes, tDept.edges, tDept.settings);
assert(diagDept.filter((d) => d.severity === 'error').length === 0, 'Speech department flow produces 0 errors in validator');

// Test 12: Simulator Execution with Custom SRGS Grammar
import { IvrSimulator } from '../src/lib/simulator/ivr-engine';

let simEventLogged = false;
const sim = new IvrSimulator((state) => {
  if (state.logs && state.logs.some((l) => l.text.includes('SRGS Grammar Match'))) {
    simEventLogged = true;
  }
});

sim.updateGraph(tDept.nodes, tDept.edges);
sim.startCall('ask_department');
assert(sim.state.currentNodeId === 'ask_department', 'Simulator active on speech field ask_department');
// Submit spoken utterance matching grammar
sim.submitInput('I want to pay my bill please');
assert(simEventLogged === true, 'Simulator logged SRGS grammar match event');
assert(sim.state.variables['department_choice'] === 'billing', 'Variable assigned normalized semantic value "billing"');

// Test 13: Bare rule parsing in xmlToSrgs
const bareRuleXml = `<rule id="CONFIRM" scope="public"><one-of><item>yes <tag>out = "yes";</tag></item><item>no <tag>out = "no";</tag></item></one-of></rule>`;
const parsedBare = xmlToSrgs(bareRuleXml);
assert(parsedBare.rules.length === 1, 'Parsed bare rule into 1 rule');
assert(parsedBare.rules[0].name === 'CONFIRM', 'Parsed bare rule preserved rule id CONFIRM');
assert(parsedBare.rules[0].items.length === 2, 'Parsed bare rule has 2 items');

// Test 14: Sequence rule type matching
const seqGrammar: SrgsGrammar = {
  version: '1.0',
  xmlns: 'http://www.w3.org/2001/06/grammar',
  xmlLang: 'en-US',
  mode: 'voice',
  root: 'ORDER',
  tagFormat: 'semantics/1.0',
  rules: [
    {
      id: 'r_seq',
      name: 'ORDER',
      scope: 'public',
      type: 'sequence',
      items: [
        { id: 'i1', phrase: 'large', semanticTag: 'out = "large";' },
        { id: 'i2', phrase: 'pizza', semanticTag: 'out = "pizza";' }
      ]
    }
  ]
};
const seqMatch = testGrammarMatch(seqGrammar, 'I would like a large pizza please');
assert(seqMatch.matched === true, 'Sequence rule matches when all sequential items are present');
const seqFail = testGrammarMatch(seqGrammar, 'I would like a small pizza please');
assert(seqFail.matched === false, 'Sequence rule fails when required item is missing');

// Test 15: Speech Banking & Account Verification Flow (TEMPLATES[5])
const tBank = TEMPLATES[5];
assert(tBank && tBank.id === 'speech-banking-auth', 'Template 5 is speech-banking-auth flow');
const vxmlBank = generateVxml(tBank.nodes, tBank.edges, tBank.settings);
assert(vxmlBank.includes('root="BANKING_INTENTS"'), 'Contains BANKING_INTENTS root rule in banking intent field');
assert(vxmlBank.includes('root="ACCOUNT_TYPES"'), 'Contains ACCOUNT_TYPES root rule in account selection field');
const diagBank = validateVxml(tBank.nodes, tBank.edges, tBank.settings);
assert(diagBank.filter((d) => d.severity === 'error').length === 0, 'Speech banking flow produces 0 errors in validator');
const parsedBank = parseVxml(vxmlBank);
assert(!parsedBank.error, 'Parsed speech banking flow VXML without errors');
assert(parsedBank.nodes.length >= 10, 'Parsed banking flow contains all dialog nodes');

// Test 16: Artisanal Pizza Ordering Flow (TEMPLATES[6])
const tPizza = TEMPLATES[6];
assert(tPizza && tPizza.id === 'speech-pizza-order', 'Template 6 is speech-pizza-order flow');
const vxmlPizza = generateVxml(tPizza.nodes, tPizza.edges, tPizza.settings);
assert(vxmlPizza.includes('root="PIZZA_SPEC"'), 'Contains PIZZA_SPEC root rule in pizza crust field');
assert(vxmlPizza.includes('root="TOPPINGS"'), 'Contains TOPPINGS root rule in pizza toppings field');
assert(vxmlPizza.includes('root="FULFILLMENT"'), 'Contains FULFILLMENT root rule in pizza fulfillment field');
const diagPizza = validateVxml(tPizza.nodes, tPizza.edges, tPizza.settings);
assert(diagPizza.filter((d) => d.severity === 'error').length === 0, 'Artisanal pizza flow produces 0 errors in validator');
const parsedPizza = parseVxml(vxmlPizza);
assert(!parsedPizza.error, 'Parsed artisanal pizza flow VXML without errors');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! VoiceXML 2.1 & SRGS 1.0 verified.');
