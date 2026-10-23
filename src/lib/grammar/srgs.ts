import type { SrgsGrammar, SrgsRule, SrgsItem, GrammarTestResult, GrammarTemplate } from '../../types/grammar';
import { DOMParser as XmldomParser } from '@xmldom/xmldom';

function getDOMParser(): any {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser();
  }
  return new XmldomParser();
}

function escapeXml(unsafe: string = ''): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getDefaultSrgsGrammar(): SrgsGrammar {
  return {
    version: '1.0',
    xmlns: 'http://www.w3.org/2001/06/grammar',
    xmlLang: 'en-US',
    mode: 'voice',
    root: 'ROOT',
    tagFormat: 'semantics/1.0',
    rules: [
      {
        id: 'r_1',
        name: 'ROOT',
        scope: 'public',
        type: 'one-of',
        items: [
          { id: 'i_1', phrase: 'sales', semanticTag: 'out = "sales";' },
          { id: 'i_2', phrase: 'billing', semanticTag: 'out = "billing";' },
          { id: 'i_3', phrase: 'support', semanticTag: 'out = "support";' },
          { id: 'i_4', phrase: 'agent', semanticTag: 'out = "representative";' }
        ]
      }
    ]
  };
}

export function srgsToXml(g: SrgsGrammar): string {
  const lines: string[] = [];
  const rootName = g.root || (g.rules[0] ? g.rules[0].name : 'ROOT');
  lines.push('<grammar version="1.0"');
  lines.push('         xmlns="http://www.w3.org/2001/06/grammar"');
  lines.push(`         xml:lang="${escapeXml(g.xmlLang || 'en-US')}"`);
  lines.push(`         mode="${g.mode || 'voice'}"`);
  lines.push(`         root="${escapeXml(rootName)}"`);
  lines.push(`         tag-format="${g.tagFormat || 'semantics/1.0'}">`);

  for (const rule of g.rules) {
    lines.push(`\n  <rule id="${escapeXml(rule.name)}" scope="${rule.scope || 'public'}">`);

    const renderItem = (item: SrgsItem, indent: string): string => {
      const attrs: string[] = [];
      if (item.repeat) attrs.push(`repeat="${item.repeat}"`);
      if (item.weight && item.weight !== 1.0) attrs.push(`weight="${item.weight}"`);
      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

      const ref = item.ruleRef || (item.phrase.startsWith('#') ? item.phrase.slice(1).trim() : undefined);
      const content = ref
        ? `<ruleref uri="#${escapeXml(ref)}"/>`
        : escapeXml(item.phrase);

      if (item.semanticTag) {
        return `${indent}<item${attrStr}>${content} <tag>${escapeXml(item.semanticTag)}</tag></item>`;
      } else {
        return `${indent}<item${attrStr}>${content}</item>`;
      }
    };

    if (rule.type === 'sequence') {
      for (const item of rule.items) {
        lines.push(renderItem(item, '    '));
      }
    } else {
      lines.push('    <one-of>');
      for (const item of rule.items) {
        lines.push(renderItem(item, '      '));
      }
      lines.push('    </one-of>');
    }

    lines.push('  </rule>');
  }

  lines.push('</grammar>');
  return lines.join('\n');
}

export function xmlToSrgs(xmlText: string): SrgsGrammar {
  const parser = getDOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const gEls = xmlDoc.getElementsByTagName('grammar');
  if (gEls.length === 0) {
    return getDefaultSrgsGrammar();
  }

  // Handle nested grammar element if present
  const gEl = gEls.length > 1 ? gEls[gEls.length - 1] : gEls[0];

  const grammar: SrgsGrammar = {
    version: '1.0',
    xmlns: gEl.getAttribute('xmlns') || 'http://www.w3.org/2001/06/grammar',
    xmlLang: gEl.getAttribute('xml:lang') || 'en-US',
    mode: (gEl.getAttribute('mode') as 'voice' | 'dtmf') || 'voice',
    root: gEl.getAttribute('root') || 'ROOT',
    tagFormat: (gEl.getAttribute('tag-format') as any) || 'semantics/1.0',
    rules: []
  };

  const ruleEls = gEl.getElementsByTagName('rule');
  for (let i = 0; i < ruleEls.length; i++) {
    const rEl = ruleEls[i];
    const rName = rEl.getAttribute('id') || `rule_${i + 1}`;
    const rScope = (rEl.getAttribute('scope') as 'public' | 'private') || 'public';

    const oneOfEls = rEl.getElementsByTagName('one-of');
    const isOneOf = oneOfEls.length > 0;

    const items: SrgsItem[] = [];
    const itemEls = rEl.getElementsByTagName('item');

    for (let j = 0; j < itemEls.length; j++) {
      const itEl = itemEls[j];
      const tagEls = itEl.getElementsByTagName('tag');
      const tag = tagEls.length > 0 ? tagEls[0].textContent?.trim() : undefined;

      const rulerefEls = itEl.getElementsByTagName('ruleref');
      let ruleRef: string | undefined = undefined;
      if (rulerefEls.length > 0) {
        const uri = rulerefEls[0].getAttribute('uri') || '';
        ruleRef = uri.replace(/^#/, '');
      }

      // Extract phrase text without tag text
      let phrase = '';
      for (let k = 0; k < itEl.childNodes.length; k++) {
        const cn = itEl.childNodes[k];
        if (cn.nodeType === 3) { // TEXT_NODE
          phrase += cn.nodeValue || '';
        }
      }
      phrase = phrase.trim();
      if (!phrase && ruleRef) {
        phrase = `#${ruleRef}`;
      }
      if (!phrase) {
        phrase = itEl.textContent?.trim() || '';
        if (tag && phrase.includes(tag)) {
          phrase = phrase.replace(tag, '').trim();
        }
      }

      const repeatAttr = itEl.getAttribute('repeat') as any;
      const weightAttr = itEl.getAttribute('weight');

      items.push({
        id: `item_${i}_${j}`,
        phrase,
        ruleRef,
        semanticTag: tag,
        repeat: repeatAttr || undefined,
        weight: weightAttr ? parseFloat(weightAttr) : undefined
      });
    }

    // Also check for direct ruleref elements not inside an item
    const directRulerefs = rEl.getElementsByTagName('ruleref');
    for (let k = 0; k < directRulerefs.length; k++) {
      const rrEl = directRulerefs[k];
      if (rrEl.parentNode?.nodeName?.toLowerCase() !== 'item') {
        const uri = rrEl.getAttribute('uri') || '';
        const refName = uri.replace(/^#/, '');
        items.push({
          id: `item_rr_${i}_${k}`,
          phrase: `#${refName}`,
          ruleRef: refName
        });
      }
    }

    grammar.rules.push({
      id: `rule_${i}`,
      name: rName,
      scope: rScope,
      type: isOneOf ? 'one-of' : 'sequence',
      items
    });
  }

  if (grammar.rules.length === 0) {
    return getDefaultSrgsGrammar();
  }

  return grammar;
}

function matchRule(
  grammar: SrgsGrammar,
  rule: SrgsRule,
  cleanInput: string,
  visitedRules: Set<string> = new Set()
): GrammarTestResult | null {
  if (visitedRules.has(rule.name)) {
    return null; // Avoid circular reference loop
  }
  visitedRules.add(rule.name);

  for (const item of rule.items) {
    // 1. If item references another rule
    const refName = item.ruleRef || (item.phrase.startsWith('#') ? item.phrase.slice(1).trim() : undefined);
    if (refName) {
      const targetRule = grammar.rules.find((r) => r.name === refName || r.id === refName);
      if (targetRule) {
        const subMatch = matchRule(grammar, targetRule, cleanInput, visitedRules);
        if (subMatch && subMatch.matched) {
          let semanticVal = subMatch.semanticValue;
          if (item.semanticTag) {
            const m = item.semanticTag.match(/out\s*=\s*['"]?([^'";]+)['"]?/);
            if (m) {
              semanticVal = m[1];
            }
          }
          return {
            matched: true,
            matchedPhrase: subMatch.matchedPhrase,
            matchedRule: `${rule.name} -> ${subMatch.matchedRule}`,
            semanticValue: semanticVal
          };
        }
      }
    }

    // 2. Direct phrase match
    const cleanPhrase = item.phrase.trim().toLowerCase();
    if (!cleanPhrase || cleanPhrase.startsWith('#')) continue;

    const escaped = escapeRegex(cleanPhrase);
    const wordBoundary = new RegExp(`(?:^|\\s|,|\\.)${escaped}(?:$|\\s|,|\\.)`).test(cleanInput);
    const isMatch = cleanInput === cleanPhrase || wordBoundary || cleanInput.includes(cleanPhrase);

    if (isMatch) {
      let semanticVal: string = item.phrase;
      if (item.semanticTag) {
        const m = item.semanticTag.match(/out\s*=\s*['"]?([^'";]+)['"]?/);
        if (m) {
          semanticVal = m[1];
        } else {
          semanticVal = item.semanticTag;
        }
      }

      return {
        matched: true,
        matchedPhrase: item.phrase,
        matchedRule: rule.name,
        semanticValue: semanticVal
      };
    }
  }

  return null;
}

export function testGrammarMatch(
  grammar: SrgsGrammar,
  input: string,
  targetRuleName?: string
): GrammarTestResult {
  const cleanInput = input.trim().toLowerCase();
  if (!cleanInput) {
    return { matched: false };
  }

  const startRuleName = targetRuleName || grammar.root || (grammar.rules[0]?.name);
  const startRule = grammar.rules.find((r) => r.name === startRuleName) || grammar.rules[0];
  if (!startRule) return { matched: false };

  const directMatch = matchRule(grammar, startRule, cleanInput, new Set());
  if (directMatch) {
    return directMatch;
  }

  // Fallback: If testing Root rule and no direct match, evaluate other public rules
  if (!targetRuleName || targetRuleName === grammar.root) {
    for (const rule of grammar.rules) {
      if (rule.name === startRule.name) continue;
      const subRes = matchRule(grammar, rule, cleanInput, new Set());
      if (subRes && subRes.matched) {
        return subRes;
      }
    }
  }

  return { matched: false };
}

export const GRAMMAR_TEMPLATES: GrammarTemplate[] = [
  {
    id: 'yes-no',
    name: 'Yes / No Confirmation',
    description: 'Universal positive/negative recognition with semantic normalization.',
    grammar: {
      version: '1.0',
      xmlns: 'http://www.w3.org/2001/06/grammar',
      xmlLang: 'en-US',
      mode: 'voice',
      root: 'YES_NO',
      tagFormat: 'semantics/1.0',
      rules: [
        {
          id: 'r_yesno',
          name: 'YES_NO',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'yn1', phrase: 'yes', semanticTag: 'out = true;' },
            { id: 'yn2', phrase: 'yeah', semanticTag: 'out = true;' },
            { id: 'yn3', phrase: 'yep', semanticTag: 'out = true;' },
            { id: 'yn4', phrase: 'correct', semanticTag: 'out = true;' },
            { id: 'yn5', phrase: 'sure', semanticTag: 'out = true;' },
            { id: 'yn6', phrase: 'no', semanticTag: 'out = false;' },
            { id: 'yn7', phrase: 'nope', semanticTag: 'out = false;' },
            { id: 'yn8', phrase: 'negative', semanticTag: 'out = false;' }
          ]
        }
      ]
    }
  },
  {
    id: 'payment-cards',
    name: 'Credit Card Types',
    description: 'Recognizes major payment networks (Visa, MasterCard, Amex).',
    grammar: {
      version: '1.0',
      xmlns: 'http://www.w3.org/2001/06/grammar',
      xmlLang: 'en-US',
      mode: 'voice',
      root: 'CARD_TYPE',
      tagFormat: 'semantics/1.0',
      rules: [
        {
          id: 'r_cards',
          name: 'CARD_TYPE',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'c1', phrase: 'visa', semanticTag: 'out = "visa";' },
            { id: 'c2', phrase: 'mastercard', semanticTag: 'out = "mastercard";' },
            { id: 'c3', phrase: 'american express', semanticTag: 'out = "amex";' },
            { id: 'c4', phrase: 'amex', semanticTag: 'out = "amex";' },
            { id: 'c5', phrase: 'discover', semanticTag: 'out = "discover";' }
          ]
        }
      ]
    }
  },
  {
    id: 'dtmf-menu',
    name: 'DTMF Keypad Choices (0-9)',
    description: 'Telephony keypad DTMF grammars with digits mode.',
    grammar: {
      version: '1.0',
      xmlns: 'http://www.w3.org/2001/06/grammar',
      xmlLang: 'en-US',
      mode: 'dtmf',
      root: 'DIGIT_CHOICE',
      tagFormat: 'semantics/1.0',
      rules: [
        {
          id: 'r_dtmf',
          name: 'DIGIT_CHOICE',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'd1', phrase: '1', semanticTag: 'out = 1;' },
            { id: 'd2', phrase: '2', semanticTag: 'out = 2;' },
            { id: 'd3', phrase: '3', semanticTag: 'out = 3;' },
            { id: 'd0', phrase: '0', semanticTag: 'out = 0;' }
          ]
        }
      ]
    }
  },
  {
    id: 'dept-routing',
    name: 'Company Department Router',
    description: 'Speech recognition grammar for customer care and operator transfer.',
    grammar: {
      version: '1.0',
      xmlns: 'http://www.w3.org/2001/06/grammar',
      xmlLang: 'en-US',
      mode: 'voice',
      root: 'DEPARTMENTS',
      tagFormat: 'semantics/1.0',
      rules: [
        {
          id: 'r_dept',
          name: 'DEPARTMENTS',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'dp1', phrase: 'customer service', semanticTag: 'out = "support";' },
            { id: 'dp2', phrase: 'technical support', semanticTag: 'out = "support";' },
            { id: 'dp3', phrase: 'billing and payments', semanticTag: 'out = "billing";' },
            { id: 'dp4', phrase: 'sales inquiries', semanticTag: 'out = "sales";' },
            { id: 'dp5', phrase: 'speak to an agent', semanticTag: 'out = "operator";' }
          ]
        }
      ]
    }
  },
  {
    id: 'flight-booking',
    name: 'Flight Booking (Multi-Rule: Cities & Classes)',
    description: 'Multi-rule grammar linking destination city rules and cabin class rules.',
    grammar: {
      version: '1.0',
      xmlns: 'http://www.w3.org/2001/06/grammar',
      xmlLang: 'en-US',
      mode: 'voice',
      root: 'FLIGHT_INQUIRY',
      tagFormat: 'semantics/1.0',
      rules: [
        {
          id: 'r_flight_root',
          name: 'FLIGHT_INQUIRY',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'fi_1', phrase: '#DEST_CITY', ruleRef: 'DEST_CITY' },
            { id: 'fi_2', phrase: '#TRAVEL_CLASS', ruleRef: 'TRAVEL_CLASS' }
          ]
        },
        {
          id: 'r_dest_city',
          name: 'DEST_CITY',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'dc_1', phrase: 'new york', semanticTag: 'out = "NYC";' },
            { id: 'dc_2', phrase: 'los angeles', semanticTag: 'out = "LAX";' },
            { id: 'dc_3', phrase: 'chicago', semanticTag: 'out = "ORD";' },
            { id: 'dc_4', phrase: 'san francisco', semanticTag: 'out = "SFO";' },
            { id: 'dc_5', phrase: 'london', semanticTag: 'out = "LHR";' }
          ]
        },
        {
          id: 'r_travel_class',
          name: 'TRAVEL_CLASS',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'tc_1', phrase: 'first class', semanticTag: 'out = "FIRST";' },
            { id: 'tc_2', phrase: 'business class', semanticTag: 'out = "BUSINESS";' },
            { id: 'tc_3', phrase: 'economy class', semanticTag: 'out = "ECONOMY";' }
          ]
        }
      ]
    }
  },
  {
    id: 'pizza-order',
    name: 'Pizza Ordering (Multi-Rule: Sizes & Crust)',
    description: 'Multi-rule food order grammar demonstrating item rule references.',
    grammar: {
      version: '1.0',
      xmlns: 'http://www.w3.org/2001/06/grammar',
      xmlLang: 'en-US',
      mode: 'voice',
      root: 'PIZZA_ORDER',
      tagFormat: 'semantics/1.0',
      rules: [
        {
          id: 'r_pizza_root',
          name: 'PIZZA_ORDER',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'pz_1', phrase: '#PIZZA_SIZE', ruleRef: 'PIZZA_SIZE' },
            { id: 'pz_2', phrase: '#CRUST_TYPE', ruleRef: 'CRUST_TYPE' }
          ]
        },
        {
          id: 'r_pizza_size',
          name: 'PIZZA_SIZE',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'ps_1', phrase: 'small', semanticTag: 'out = "small";' },
            { id: 'ps_2', phrase: 'medium', semanticTag: 'out = "medium";' },
            { id: 'ps_3', phrase: 'large', semanticTag: 'out = "large";' },
            { id: 'ps_4', phrase: 'extra large', semanticTag: 'out = "xlarge";' }
          ]
        },
        {
          id: 'r_crust_type',
          name: 'CRUST_TYPE',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'ct_1', phrase: 'thin crust', semanticTag: 'out = "thin";' },
            { id: 'ct_2', phrase: 'deep dish', semanticTag: 'out = "deep_dish";' },
            { id: 'ct_3', phrase: 'stuffed crust', semanticTag: 'out = "stuffed";' },
            { id: 'ct_4', phrase: 'gluten free', semanticTag: 'out = "gluten_free";' }
          ]
        }
      ]
    }
  },
  {
    id: 'clinic-scheduler',
    name: 'Clinic Appointment Selection',
    description: 'Healthcare service and specialist scheduling recognition grammar.',
    grammar: {
      version: '1.0',
      xmlns: 'http://www.w3.org/2001/06/grammar',
      xmlLang: 'en-US',
      mode: 'voice',
      root: 'CLINIC_APPT',
      tagFormat: 'semantics/1.0',
      rules: [
        {
          id: 'r_clinic',
          name: 'CLINIC_APPT',
          scope: 'public',
          type: 'one-of',
          items: [
            { id: 'ca_1', phrase: 'doctor consultation', semanticTag: 'out = "doctor";' },
            { id: 'ca_2', phrase: 'dental appointment', semanticTag: 'out = "dental";' },
            { id: 'ca_3', phrase: 'blood test lab', semanticTag: 'out = "lab";' },
            { id: 'ca_4', phrase: 'prescription refill', semanticTag: 'out = "pharmacy";' },
            { id: 'ca_5', phrase: 'general inquiry', semanticTag: 'out = "reception";' }
          ]
        }
      ]
    }
  }
];
