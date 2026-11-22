// VoiceXML Scratch Visual Programming Types

export type ScratchBlockCategory =
  | 'dialogs'
  | 'prompts'
  | 'inputs'
  | 'logic'
  | 'control'
  | 'telephony';

export type ScratchBlockShape =
  | 'hat'
  | 'stack'
  | 'c-block'
  | 'c-block-if'
  | 'cap';

export type ScratchBlockType =
  // Dialogs & Events (Yellow)
  | 'dialog_form'
  | 'dialog_menu'
  | 'event_catch'
  | 'when_start'
  // Prompts & Speech (Purple)
  | 'prompt_say'
  | 'prompt_audio'
  | 'prompt_config'
  // Inputs & Sensing (Blue)
  | 'input_field'
  | 'input_choice'
  | 'input_record'
  | 'grammar_builtin'
  // Logic & Operators (Green)
  | 'logic_assign'
  | 'logic_var'
  | 'logic_script'
  // Control & Flow (Orange)
  | 'control_goto'
  | 'control_if'
  | 'control_subdialog'
  | 'control_submit'
  // Telephony & Network (Red)
  | 'telephony_transfer'
  | 'telephony_disconnect'
  | 'telephony_exit'
  | 'data_fetch';

export interface ScratchBlock {
  id: string;
  type: ScratchBlockType;
  category: ScratchBlockCategory;
  shape: ScratchBlockShape;
  x?: number;
  y?: number;
  collapsed?: boolean;
  params: Record<string, any>;
  children?: ScratchBlock[];
  elseChildren?: ScratchBlock[];
}

export interface ScratchPaletteItem {
  type: ScratchBlockType;
  category: ScratchBlockCategory;
  shape: ScratchBlockShape;
  label: string;
  description: string;
  defaultParams: Record<string, any>;
  defaultChildren?: ScratchBlock[];
}

export interface ScratchProject {
  version: '2.1';
  name: string;
  description?: string;
  settings?: Record<string, any>;
  scripts: ScratchBlock[];
}
