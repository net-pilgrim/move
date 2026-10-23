// W3C Speech Recognition Grammar Specification (SRGS 1.0) & VoiceXML 2.1 Grammar Types

export interface SrgsItem {
  id: string;
  phrase: string;       // Utterance or DTMF string (e.g. "sales", "representative", "1"), or rule reference
  ruleRef?: string;     // Referenced rule ID (e.g. "YES_NO", "DEPARTMENTS")
  semanticTag?: string; // Semantic interpretation tag, e.g. 'out = "agent";' or 'out.choice = "yes";'
  weight?: number;      // e.g. 1.0
  repeat?: '0-1' | '1+' | '0+'; // Repetition pattern
}

export interface SrgsRule {
  id: string;
  name: string;
  scope: 'public' | 'private';
  type: 'one-of' | 'sequence';
  items: SrgsItem[];
}

export interface SrgsGrammar {
  version: '1.0';
  xmlns: string;
  xmlLang: string;
  mode: 'voice' | 'dtmf';
  root: string;
  tagFormat: 'semantics/1.0' | 'semantics/1.0-literals';
  rules: SrgsRule[];
}

export interface GrammarTestResult {
  matched: boolean;
  matchedPhrase?: string;
  matchedRule?: string;
  semanticValue?: string;
}

export interface GrammarTemplate {
  id: string;
  name: string;
  description: string;
  grammar: SrgsGrammar;
}
