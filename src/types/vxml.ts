// VoiceXML 2.1 Types and Data Models

export type VxmlNodeType =
  | 'vxml-menu'
  | 'vxml-field'
  | 'vxml-block'
  | 'vxml-data'
  | 'vxml-condition'
  | 'vxml-record'
  | 'vxml-transfer'
  | 'vxml-subdialog'
  | 'vxml-disconnect'
  | 'vxml-exit';

export interface PromptConfig {
  text: string;
  audio?: string;
  bargein?: boolean;
  timeout?: string; // e.g. "5s"
  count?: number;
}

export interface MenuChoice {
  id: string;
  dtmf?: string;
  text: string;
  next?: string; // Target form/menu ID
  event?: string;
  message?: string;
}

export interface VarDeclaration {
  name: string;
  expr?: string;
}

export interface PropertyDeclaration {
  name: string;
  value: string;
}

export interface CatchHandler {
  id: string;
  event: string;
  prompt?: string;
  next?: string;
}

export interface VxmlDocSettings {
  version: '2.1';
  xmlns: string;
  xmlLang: string;
  application?: string;
  globalVars: VarDeclaration[];
  globalProperties: PropertyDeclaration[];
  globalCatch: CatchHandler[];
  globalScript?: string;
}

export interface BaseVxmlNodeData {
  label: string;
  dialogId: string;
  isSimulatingActive?: boolean;
  [key: string]: unknown;
}

// Data models for each node type
export interface MenuNodeData extends BaseVxmlNodeData {
  scope?: 'dialog' | 'document';
  dtmf?: boolean;
  prompt: PromptConfig;
  choices: MenuChoice[];
  noinputPrompt?: string;
  nomatchPrompt?: string;
  helpPrompt?: string;
}

export interface FieldNodeData extends BaseVxmlNodeData {
  fieldName: string;
  type: 'digits' | 'boolean' | 'currency' | 'number' | 'phone' | 'time' | 'date' | 'custom';
  customGrammar?: string;
  grammarParams?: string; // e.g. "?minlength=4;maxlength=6"
  prompt: PromptConfig;
  filledNext?: string;
  filledVar?: string;
  filledExpr?: string;
  noinputPrompt?: string;
  noinputNext?: string;
  nomatchPrompt?: string;
  nomatchNext?: string;
  helpPrompt?: string;
}

export interface BlockNodeData extends BaseVxmlNodeData {
  blockName: string;
  prompt: PromptConfig;
  assigns: Array<{ name: string; expr: string }>;
  script?: string;
  next?: string;
}

// VoiceXML 2.1 <data> element
export interface DataNodeData extends BaseVxmlNodeData {
  dataName: string;
  src: string;
  method: 'get' | 'post';
  namelist?: string;
  prompt?: PromptConfig;
  next?: string;
}

export interface ConditionNodeData extends BaseVxmlNodeData {
  condition: string; // e.g. "userPin === '1234'"
  trueNext?: string;
  falseNext?: string;
  truePrompt?: string;
  falsePrompt?: string;
}

export interface RecordNodeData extends BaseVxmlNodeData {
  recordName: string;
  beep: boolean;
  maxtime: string; // e.g. "30s"
  dtmfterm: boolean;
  type: string; // e.g. "audio/x-wav"
  prompt: PromptConfig;
  filledNext?: string;
  noinputNext?: string;
}

export interface TransferNodeData extends BaseVxmlNodeData {
  transferName: string;
  dest: string; // e.g. "tel:+18005550199" or "sip:agent@callcenter.com"
  bridge: boolean;
  connecttimeout: string; // e.g. "30s"
  prompt: PromptConfig;
  next?: string;
  errorNext?: string;
}

export interface SubdialogNodeData extends BaseVxmlNodeData {
  subdialogName: string;
  src: string;
  method: 'get' | 'post';
  namelist?: string;
  params?: Array<{ name: string; expr: string }>;
  next?: string;
}

export interface DisconnectNodeData extends BaseVxmlNodeData {
  prompt?: PromptConfig;
}

export interface ExitNodeData extends BaseVxmlNodeData {
  expr?: string;
  namelist?: string;
}

export type AnyVxmlNodeData =
  | MenuNodeData
  | FieldNodeData
  | BlockNodeData
  | DataNodeData
  | ConditionNodeData
  | RecordNodeData
  | TransferNodeData
  | SubdialogNodeData
  | DisconnectNodeData
  | ExitNodeData;

export interface DiagnosticItem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  nodeId?: string;
  message: string;
  specReference?: string;
}
