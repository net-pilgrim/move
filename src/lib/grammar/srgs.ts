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
  lines.push('<grammar version="1.0"');
  lines.push('         xmlns="http://www.w3.org/2001/06/grammar"');
  lines.push(`         xml:lang="${escapeXml(g.xmlLang || 'en-US')}"`);
  lines.push(`         mode="${g.mode || 'voice'}"`);
  lines.push(`         root="${escapeXml(g.root || 'ROOT')}"`);
  lines.push(`         tag-format="${g.tagFormat || 'semantics/1.0'}">`);

  for (const rule of g.rules) {
    lines.push(`\n  <rule id="${escapeXml(rule.name)}" scope="${rule.scope || 'public'}">`);

    if (rule.type === 'one-of') {
      lines.push('    <one-of>');
      for (const item of rule.items) {
        const attrs: string[] = [];
        if (item.repeat) attrs.push(`repeat="${item.repeat}"`);
        if (item.weight && item.weight !== 1.0) attrs.push(`weight="${item.weight}"`);
        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

        if (item.semanticTag) {
          lines.push(`      <item${attrStr}>${escapeXml(item.phrase)} <tag>${escapeXml(item.semanticTag)}</tag></item>`);
        } else {
          lines.push(`      <item${attrStr}>${escapeXml(item.phrase)}</item>`);
        }
      }
      lines.push('    </one-of>');
    } else {
      // Sequence
      for (const item of rule.items) {
        const attrs: string[] = [];
        if (item.repeat) attrs.push(`repeat="${item.repeat}"`);
        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
        if (item.semanticTag) {
          lines.push(`    <item${attrStr}>${escapeXml(item.phrase)} <tag>${escapeXml(item.semanticTag)}</tag></item>`);
        } else {
          lines.push(`    <item${attrStr}>${escapeXml(item.phrase)}</item>`);
        }
      }
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
  const gEl = gEls.length > 0 ? gEls[0] : null;

  if (!gEl) {
    return getDefaultSrgsGrammar();
  }

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

      // Extract phrase text without tag text
      let phrase = '';
      for (let k = 0; k < itEl.childNodes.length; k++) {
        const cn = itEl.childNodes[k];
        if (cn.nodeType === 3) { // TEXT_NODE
          phrase += cn.nodeValue || '';
        }
      }
      phrase = phrase.trim() || itEl.textContent?.trim() || '';
      if (tag && phrase.includes(tag)) {
        phrase = phrase.replace(tag, '').trim();
      }

      const repeatAttr = itEl.getAttribute('repeat') as any;
      const weightAttr = itEl.getAttribute('weight');

      items.push({
        id: `item_${i}_${j}`,
        phrase,
        semanticTag: tag,
        repeat: repeatAttr || undefined,
        weight: weightAttr ? parseFloat(weightAttr) : undefined
      });
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

export function testGrammarMatch(grammar: SrgsGrammar, input: string): GrammarTestResult {
  const cleanInput = input.trim().toLowerCase();
  if (!cleanInput) {
    return { matched: false };
  }

  // Find root rule
  const rootRule = grammar.rules.find((r) => r.name === grammar.root) || grammar.rules[0];
  if (!rootRule) return { matched: false };

  for (const item of rootRule.items) {
    const cleanPhrase = item.phrase.trim().toLowerCase();

    // Check exact or partial match
    if (
      cleanInput === cleanPhrase ||
      cleanInput.includes(cleanPhrase) ||
      cleanPhrase.includes(cleanInput)
    ) {
      let semanticVal = item.phrase;
      if (item.semanticTag) {
        // e.g. out = "sales"; -> "sales"
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
        matchedRule: rootRule.name,
        semanticValue: semanticVal
      };
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
  }
];
