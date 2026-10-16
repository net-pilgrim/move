import type { Node, Edge } from '@xyflow/svelte';
import type { VxmlDocSettings } from '../../types/vxml';
import { getDefaultSettings } from '../vxml/parser';

export interface VxmlTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  settings: VxmlDocSettings;
}

export const TEMPLATES: VxmlTemplate[] = [
  {
    id: 'support-router',
    name: 'Customer Support Router',
    description: 'Classic IVR menu with DTMF routing, account number field, and live agent transfer.',
    settings: getDefaultSettings(),
    nodes: [
      {
        id: 'main_menu',
        type: 'vxml-menu',
        position: { x: 50, y: 150 },
        data: {
          label: 'Main Menu',
          dialogId: 'main_menu',
          dtmf: true,
          prompt: {
            text: 'Thank you for calling Acme Telecom. For Account Services, press 1. For Technical Support, press 2. To speak with a representative, press 0.',
            bargein: true,
            timeout: '7s'
          },
          choices: [
            { id: 'c1', dtmf: '1', text: 'Account Services', next: 'account_form' },
            { id: 'c2', dtmf: '2', text: 'Tech Support', next: 'tech_support' },
            { id: 'c0', dtmf: '0', text: 'Representative', next: 'transfer_agent' }
          ],
          noinputPrompt: 'Please make a selection using your telephone keypad.',
          nomatchPrompt: 'Sorry, that is not a valid selection.'
        }
      },
      {
        id: 'account_form',
        type: 'vxml-field',
        position: { x: 450, y: 50 },
        data: {
          label: 'Account Number',
          dialogId: 'account_form',
          fieldName: 'acc_num',
          type: 'digits',
          grammarParams: '?minlength=6;maxlength=8',
          prompt: {
            text: 'Please enter your six to eight digit account number followed by pound.',
            bargein: true
          },
          filledNext: 'account_block',
          noinputPrompt: 'We did not receive your account number. Please try again.'
        }
      },
      {
        id: 'account_block',
        type: 'vxml-block',
        position: { x: 820, y: 50 },
        data: {
          label: 'Lookup Account',
          dialogId: 'account_block',
          blockName: 'do_lookup',
          prompt: {
            text: 'Thank you. Your account has been verified. Your balance is 42 dollars.'
          },
          assigns: [
            { name: 'balance', expr: '42.00' }
          ],
          next: 'goodbye'
        }
      },
      {
        id: 'tech_support',
        type: 'vxml-block',
        position: { x: 450, y: 260 },
        data: {
          label: 'Tech Support Notice',
          dialogId: 'tech_support',
          blockName: 'tech_info',
          prompt: {
            text: 'All our support technicians are currently assisting other callers. Please visit help dot acme dot com.'
          },
          next: 'goodbye'
        }
      },
      {
        id: 'transfer_agent',
        type: 'vxml-transfer',
        position: { x: 450, y: 460 },
        data: {
          label: 'Transfer to Agent',
          dialogId: 'transfer_agent',
          transferName: 'agent_xfer',
          dest: 'tel:+18005550199',
          bridge: true,
          connecttimeout: '30s',
          prompt: {
            text: 'Please hold while we transfer you to the next available agent.'
          },
          next: 'goodbye'
        }
      },
      {
        id: 'goodbye',
        type: 'vxml-disconnect',
        position: { x: 820, y: 300 },
        data: {
          label: 'Disconnect',
          dialogId: 'goodbye',
          prompt: {
            text: 'Thank you for calling Acme Telecom. Goodbye.'
          }
        }
      }
    ],
    edges: [
      {
        id: 'e_menu_c1',
        source: 'main_menu',
        sourceHandle: 'choice-c1',
        target: 'account_form',
        label: '[1] Account'
      },
      {
        id: 'e_menu_c2',
        source: 'main_menu',
        sourceHandle: 'choice-c2',
        target: 'tech_support',
        label: '[2] Tech'
      },
      {
        id: 'e_menu_c0',
        source: 'main_menu',
        sourceHandle: 'choice-c0',
        target: 'transfer_agent',
        label: '[0] Agent'
      },
      {
        id: 'e_acc_filled',
        source: 'account_form',
        sourceHandle: 'filled',
        target: 'account_block',
        label: 'filled'
      },
      {
        id: 'e_acc_done',
        source: 'account_block',
        sourceHandle: 'next',
        target: 'goodbye',
        label: 'next'
      },
      {
        id: 'e_tech_done',
        source: 'tech_support',
        sourceHandle: 'next',
        target: 'goodbye',
        label: 'next'
      }
    ]
  },
  {
    id: 'vxml21-data-fetch',
    name: 'VXML 2.1 Data Fetch (<data>)',
    description: 'Demonstrates the VoiceXML 2.1 <data> tag for dynamic backend XML fetch and condition branching.',
    settings: {
      ...getDefaultSettings(),
      globalVars: [
        { name: 'auth_pin', expr: "''" },
        { name: 'user_data', expr: 'null' }
      ]
    },
    nodes: [
      {
        id: 'ask_pin',
        type: 'vxml-field',
        position: { x: 50, y: 150 },
        data: {
          label: 'Enter PIN',
          dialogId: 'ask_pin',
          fieldName: 'auth_pin',
          type: 'digits',
          grammarParams: '?length=4',
          prompt: {
            text: 'Welcome to Secure Banking. Please enter your 4 digit security PIN.',
            bargein: true
          },
          filledNext: 'fetch_data'
        }
      },
      {
        id: 'fetch_data',
        type: 'vxml-data',
        position: { x: 420, y: 150 },
        data: {
          label: 'VXML 2.1 Data Service',
          dialogId: 'fetch_data',
          dataName: 'user_data',
          src: '/api/v1/customer/lookup',
          method: 'post',
          namelist: 'auth_pin',
          prompt: {
            text: 'Verifying your credentials, please wait.'
          },
          next: 'check_status'
        }
      },
      {
        id: 'check_status',
        type: 'vxml-condition',
        position: { x: 790, y: 150 },
        data: {
          label: 'Validate PIN',
          dialogId: 'check_status',
          condition: "auth_pin === '1234'",
          truePrompt: 'Authentication successful. Your current balance is 1250 dollars.',
          falsePrompt: 'Invalid PIN entered. Access denied.',
          trueNext: 'success_exit',
          falseNext: 'ask_pin'
        }
      },
      {
        id: 'success_exit',
        type: 'vxml-disconnect',
        position: { x: 1150, y: 80 },
        data: {
          label: 'End Session',
          dialogId: 'success_exit',
          prompt: {
            text: 'Thank you for banking with us. Have a great day.'
          }
        }
      }
    ],
    edges: [
      {
        id: 'e_pin_data',
        source: 'ask_pin',
        sourceHandle: 'filled',
        target: 'fetch_data',
        label: 'submit'
      },
      {
        id: 'e_data_cond',
        source: 'fetch_data',
        sourceHandle: 'next',
        target: 'check_status',
        label: 'response'
      },
      {
        id: 'e_cond_true',
        source: 'check_status',
        sourceHandle: 'true',
        target: 'success_exit',
        label: 'true'
      },
      {
        id: 'e_cond_false',
        source: 'check_status',
        sourceHandle: 'false',
        target: 'ask_pin',
        label: 'retry (false)'
      }
    ]
  },
  {
    id: 'voicemail-system',
    name: 'Voicemail Audio Recording',
    description: 'Collects caller audio with <record beep="true">, reviews recording, and terminates.',
    settings: getDefaultSettings(),
    nodes: [
      {
        id: 'greeting',
        type: 'vxml-block',
        position: { x: 50, y: 150 },
        data: {
          label: 'Greeting',
          dialogId: 'greeting',
          blockName: 'intro',
          prompt: {
            text: 'The party you are trying to reach is unavailable.'
          },
          next: 'record_msg'
        }
      },
      {
        id: 'record_msg',
        type: 'vxml-record',
        position: { x: 420, y: 150 },
        data: {
          label: 'Record Voicemail',
          dialogId: 'record_msg',
          recordName: 'caller_voicemail',
          beep: true,
          maxtime: '45s',
          dtmfterm: true,
          type: 'audio/x-wav',
          prompt: {
            text: 'Please record your message after the tone. When finished, press pound or hang up.'
          },
          filledNext: 'confirm_menu'
        }
      },
      {
        id: 'confirm_menu',
        type: 'vxml-menu',
        position: { x: 790, y: 150 },
        data: {
          label: 'Review Menu',
          dialogId: 'confirm_menu',
          dtmf: true,
          prompt: {
            text: 'To send your message, press 1. To re-record, press 2. To cancel, press 3.'
          },
          choices: [
            { id: 'send', dtmf: '1', text: 'Send', next: 'msg_sent' },
            { id: 'rerecord', dtmf: '2', text: 'Re-record', next: 'record_msg' },
            { id: 'cancel', dtmf: '3', text: 'Cancel', next: 'goodbye' }
          ]
        }
      },
      {
        id: 'msg_sent',
        type: 'vxml-block',
        position: { x: 1150, y: 80 },
        data: {
          label: 'Message Sent',
          dialogId: 'msg_sent',
          blockName: 'sent',
          prompt: {
            text: 'Your message has been delivered.'
          },
          next: 'goodbye'
        }
      },
      {
        id: 'goodbye',
        type: 'vxml-disconnect',
        position: { x: 1150, y: 280 },
        data: {
          label: 'Hangup',
          dialogId: 'goodbye',
          prompt: {
            text: 'Goodbye.'
          }
        }
      }
    ],
    edges: [
      {
        id: 'e_greet_rec',
        source: 'greeting',
        sourceHandle: 'next',
        target: 'record_msg',
        label: 'record'
      },
      {
        id: 'e_rec_confirm',
        source: 'record_msg',
        sourceHandle: 'filled',
        target: 'confirm_menu',
        label: 'recorded'
      },
      {
        id: 'e_menu_send',
        source: 'confirm_menu',
        sourceHandle: 'choice-send',
        target: 'msg_sent',
        label: '[1] Send'
      },
      {
        id: 'e_menu_rerecord',
        source: 'confirm_menu',
        sourceHandle: 'choice-rerecord',
        target: 'record_msg',
        label: '[2] Re-record'
      },
      {
        id: 'e_menu_cancel',
        source: 'confirm_menu',
        sourceHandle: 'choice-cancel',
        target: 'goodbye',
        label: '[3] Cancel'
      },
      {
        id: 'e_sent_goodbye',
        source: 'msg_sent',
        sourceHandle: 'next',
        target: 'goodbye',
        label: 'next'
      }
    ]
  }
];
