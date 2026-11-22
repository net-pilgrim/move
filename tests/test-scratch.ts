import {
  createBlock,
  scratchToVxml,
  flowToScratch,
  scratchToFlow,
  SCRATCH_TEMPLATES,
  PALETTE_ITEMS
} from '../src/lib/scratch/scratch-engine';
import { TEMPLATES } from '../src/lib/templates/templates';
import { parseVxml } from '../src/lib/vxml/parser';
import { validateVxml } from '../src/lib/vxml/validator';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log('🧪 Starting VoiceXML 2.1 Scratch UI & Block Engine Test Suite...\n');

// Test 1: Palette items coverage
assert(PALETTE_ITEMS.length >= 15, `Palette contains ${PALETTE_ITEMS.length} Scratch block types`);
const categories = new Set(PALETTE_ITEMS.map((p) => p.category));
assert(categories.has('dialogs'), 'Palette includes dialogs category');
assert(categories.has('prompts'), 'Palette includes prompts category');
assert(categories.has('inputs'), 'Palette includes inputs category');
assert(categories.has('logic'), 'Palette includes logic category');
assert(categories.has('control'), 'Palette includes control category');
assert(categories.has('telephony'), 'Palette includes telephony category');

// Test 2: createBlock creates blocks with proper shapes & attributes
const formBlock = createBlock('dialog_form', { id: 'test_form' });
assert(formBlock.type === 'dialog_form', 'Form block type correct');
assert(formBlock.shape === 'c-block', 'Form block is a C-block');
assert(formBlock.category === 'dialogs', 'Form block in dialogs category');
assert(formBlock.params.id === 'test_form', 'Form block custom params preserved');

const ifBlock = createBlock('control_if', { condition: "counter > 5" });
assert(ifBlock.shape === 'c-block-if', 'If block is c-block-if');
assert(Array.isArray(ifBlock.elseChildren), 'If block has elseChildren array');

// Test 3: Scratch blocks to VXML compilation
const script = [
  createBlock('dialog_menu', { id: 'ivr_menu', dtmf: true }, [
    createBlock('prompt_say', { text: 'Welcome to our voice portal.' }),
    createBlock('input_choice', { dtmf: '1', next: 'sales_form', text: 'Sales' }),
    createBlock('input_choice', { dtmf: '2', next: 'support_form', text: 'Support' })
  ]),
  createBlock('dialog_form', { id: 'sales_form' }, [
    createBlock('prompt_say', { text: 'Transferring to sales.' }),
    createBlock('telephony_transfer', { dest: 'tel:+18005550100', bridge: true })
  ]),
  createBlock('dialog_form', { id: 'support_form' }, [
    createBlock('prompt_say', { text: 'Please enter your account number.' }),
    createBlock('input_field', { name: 'account_id', type: 'digits' }, [
      createBlock('control_goto', { next: 'auth_check' })
    ])
  ]),
  createBlock('dialog_form', { id: 'auth_check' }, [
    createBlock('data_fetch', { name: 'auth_result', src: 'https://api.example.com/auth', method: 'post' }),
    createBlock(
      'control_if',
      { condition: "account_id === '9999'" },
      [
        createBlock('prompt_say', { text: 'Account validated.' }),
        createBlock('telephony_disconnect')
      ],
      [
        createBlock('prompt_say', { text: 'Invalid account.' }),
        createBlock('telephony_exit')
      ]
    )
  ])
];

const generatedXml = scratchToVxml(script);

assert(generatedXml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Generated VXML has XML declaration');
assert(generatedXml.includes('<vxml version="2.1"'), 'Root element has VXML 2.1 version');
assert(generatedXml.includes('<menu id="ivr_menu" dtmf="true">'), 'Menu block serialized correctly');
assert(generatedXml.includes('<choice dtmf="1" next="#sales_form">Sales</choice>'), 'Choice block serialized with DTMF');
assert(generatedXml.includes('<transfer dest="tel:+18005550100" bridge="true"/>'), 'Transfer serialized correctly');
assert(generatedXml.includes('<field name="account_id" type="digits">'), 'Field block serialized correctly');
assert(generatedXml.includes('<data name="auth_result" src="https://api.example.com/auth" method="post"/>'), 'Data fetch element serialized');
assert(generatedXml.includes('<if cond="account_id === &apos;9999&apos;">'), 'Condition if-block serialized with escaping');
assert(generatedXml.includes('<else/>'), 'Condition else-branch serialized');
assert(generatedXml.includes('<disconnect/>'), 'Disconnect serialized');
assert(generatedXml.includes('<exit'), 'Exit serialized');

// Test 4: Parse generated VXML back to verify XML syntax and validity
const parseResult = parseVxml(generatedXml);
assert(!parseResult.error, `Parsed generated Scratch VXML without error: ${parseResult.error}`);
assert(parseResult.nodes.length >= 3, `Parsed ${parseResult.nodes.length} nodes from Scratch VXML`);

// Test 5: flowToScratch conversion
const initialTemplate = TEMPLATES[0]; // Customer Support Router
const convertedScratch = flowToScratch(initialTemplate.nodes, initialTemplate.edges);
assert(convertedScratch.length > 0, `Converted ${convertedScratch.length} top-level Scratch blocks from flow`);
const hasMenu = convertedScratch.some((b) => b.type === 'dialog_menu');
assert(hasMenu, 'Found dialog_menu in converted Scratch blocks');
const menuBlockFound = convertedScratch.find((b) => b.type === 'dialog_menu');
assert(menuBlockFound?.children && menuBlockFound.children.length > 0, 'Menu block contains child choices/prompts');

// Test 6: scratchToFlow round trip
const roundTripFlow = scratchToFlow(convertedScratch);
assert(roundTripFlow.nodes.length > 0, `Round trip produced ${roundTripFlow.nodes.length} flow nodes`);
assert(roundTripFlow.edges.length > 0, `Round trip produced ${roundTripFlow.edges.length} flow edges`);

// Test 7: Built-in Scratch Templates verification
for (const tmpl of SCRATCH_TEMPLATES) {
  const xml = scratchToVxml(tmpl.blocks);
  assert(xml.includes('<vxml version="2.1"'), `Template "${tmpl.name}" produces valid VXML 2.1 root`);
  const parsed = parseVxml(xml);
  assert(!parsed.error, `Template "${tmpl.name}" parses cleanly`);
  const validation = validateVxml(parsed.nodes, parsed.edges, parsed.settings);
  const errors = validation.filter((v) => v.severity === 'error');
  assert(errors.length === 0, `Template "${tmpl.name}" produces 0 validation errors`);
}

console.log('\n🎉 ALL SCRATCH UI & VOICE-XML TESTS PASSED SUCCESSFULLY!\n');
