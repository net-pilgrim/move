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
  },
  {
    id: 'speech-flight-bot',
    name: 'Speech Airline Assistant (SRGS Grammars)',
    description: 'Voice-driven flight assistant utilizing custom SRGS 1.0 XML speech recognition grammars, semantic normalization, and conditional confirmation.',
    settings: {
      ...getDefaultSettings(),
      globalVars: [
        { name: 'destination', expr: "''" },
        { name: 'cabin_class', expr: "''" },
        { name: 'booking_confirmed', expr: 'false' }
      ]
    },
    nodes: [
      {
        id: 'welcome_block',
        type: 'vxml-block',
        position: { x: 50, y: 150 },
        data: {
          label: 'Welcome Greeting',
          dialogId: 'welcome_block',
          blockName: 'welcome_msg',
          prompt: {
            text: 'Welcome to SkyWay Airlines speech reservation service. We can help you book flights across North America and Europe.'
          },
          next: 'dest_field'
        }
      },
      {
        id: 'dest_field',
        type: 'vxml-field',
        position: { x: 420, y: 150 },
        data: {
          label: 'Destination City',
          dialogId: 'dest_field',
          fieldName: 'destination',
          type: 'custom',
          prompt: {
            text: 'Which destination city would you like to fly to? We serve New York, Los Angeles, Chicago, San Francisco, and London.',
            bargein: true
          },
          customGrammar: `<grammar version="1.0"
         xmlns="http://www.w3.org/2001/06/grammar"
         xml:lang="en-US"
         mode="voice"
         root="CITY_SELECTION"
         tag-format="semantics/1.0">

  <rule id="CITY_SELECTION" scope="public">
    <one-of>
      <item>new york <tag>out = "NYC";</tag></item>
      <item>jfk <tag>out = "NYC";</tag></item>
      <item>nyc <tag>out = "NYC";</tag></item>
      <item>los angeles <tag>out = "LAX";</tag></item>
      <item>lax <tag>out = "LAX";</tag></item>
      <item>chicago <tag>out = "ORD";</tag></item>
      <item>o'hare <tag>out = "ORD";</tag></item>
      <item>san francisco <tag>out = "SFO";</tag></item>
      <item>sfo <tag>out = "SFO";</tag></item>
      <item>london <tag>out = "LHR";</tag></item>
      <item>heathrow <tag>out = "LHR";</tag></item>
    </one-of>
  </rule>
</grammar>`,
          filledNext: 'cabin_field',
          nomatchPrompt: 'Sorry, we fly to New York, Los Angeles, Chicago, San Francisco, and London. Please state your destination city.',
          noinputPrompt: 'Please speak the city you wish to visit.'
        }
      },
      {
        id: 'cabin_field',
        type: 'vxml-field',
        position: { x: 800, y: 150 },
        data: {
          label: 'Cabin Class',
          dialogId: 'cabin_field',
          fieldName: 'cabin_class',
          type: 'custom',
          prompt: {
            text: 'What cabin class would you prefer? First class, Business, or Economy?',
            bargein: true
          },
          customGrammar: `<grammar version="1.0"
         xmlns="http://www.w3.org/2001/06/grammar"
         xml:lang="en-US"
         mode="voice"
         root="CABIN_CLASS"
         tag-format="semantics/1.0">

  <rule id="CABIN_CLASS" scope="public">
    <one-of>
      <item>first class <tag>out = "FIRST";</tag></item>
      <item>first <tag>out = "FIRST";</tag></item>
      <item>business class <tag>out = "BUSINESS";</tag></item>
      <item>business <tag>out = "BUSINESS";</tag></item>
      <item>executive <tag>out = "BUSINESS";</tag></item>
      <item>economy class <tag>out = "ECONOMY";</tag></item>
      <item>economy <tag>out = "ECONOMY";</tag></item>
      <item>coach <tag>out = "ECONOMY";</tag></item>
    </one-of>
  </rule>
</grammar>`,
          filledNext: 'confirm_field',
          nomatchPrompt: 'Please choose First class, Business class, or Economy.',
          noinputPrompt: 'Please specify your preferred cabin class.'
        }
      },
      {
        id: 'confirm_field',
        type: 'vxml-field',
        position: { x: 1180, y: 150 },
        data: {
          label: 'Confirm Flight',
          dialogId: 'confirm_field',
          fieldName: 'booking_confirmed',
          type: 'custom',
          prompt: {
            text: 'Would you like to confirm this flight reservation?',
            bargein: true
          },
          customGrammar: `<grammar version="1.0"
         xmlns="http://www.w3.org/2001/06/grammar"
         xml:lang="en-US"
         mode="voice"
         root="YES_NO"
         tag-format="semantics/1.0">

  <rule id="YES_NO" scope="public">
    <one-of>
      <item>yes <tag>out = true;</tag></item>
      <item>yeah <tag>out = true;</tag></item>
      <item>yep <tag>out = true;</tag></item>
      <item>correct <tag>out = true;</tag></item>
      <item>confirm <tag>out = true;</tag></item>
      <item>sure <tag>out = true;</tag></item>
      <item>no <tag>out = false;</tag></item>
      <item>nope <tag>out = false;</tag></item>
      <item>cancel <tag>out = false;</tag></item>
      <item>negative <tag>out = false;</tag></item>
    </one-of>
  </rule>
</grammar>`,
          filledNext: 'eval_confirm',
          nomatchPrompt: 'Please say Yes to confirm or No to cancel.',
          noinputPrompt: 'Please say Yes or No.'
        }
      },
      {
        id: 'eval_confirm',
        type: 'vxml-condition',
        position: { x: 1560, y: 150 },
        data: {
          label: 'Check Confirmation',
          dialogId: 'eval_confirm',
          condition: "booking_confirmed === true || booking_confirmed === 'true'",
          truePrompt: 'Your flight reservation has been successfully confirmed! Details have been sent to your account.',
          falsePrompt: 'Your booking has been cancelled as requested.',
          trueNext: 'thankyou_block',
          falseNext: 'cancel_block'
        }
      },
      {
        id: 'thankyou_block',
        type: 'vxml-block',
        position: { x: 1950, y: 70 },
        data: {
          label: 'Confirmed Summary',
          dialogId: 'thankyou_block',
          blockName: 'booked',
          prompt: {
            text: 'Thank you for choosing SkyWay Airlines. We look forward to welcoming you aboard.'
          },
          next: 'flight_hangup'
        }
      },
      {
        id: 'cancel_block',
        type: 'vxml-block',
        position: { x: 1950, y: 260 },
        data: {
          label: 'Cancelled Notice',
          dialogId: 'cancel_block',
          blockName: 'cancelled',
          prompt: {
            text: 'Thank you for calling SkyWay Airlines. Please contact us again whenever you are ready to travel.'
          },
          next: 'flight_hangup'
        }
      },
      {
        id: 'flight_hangup',
        type: 'vxml-disconnect',
        position: { x: 2320, y: 160 },
        data: {
          label: 'Call Disconnect',
          dialogId: 'flight_hangup',
          prompt: {
            text: 'Goodbye and have a wonderful day.'
          }
        }
      }
    ],
    edges: [
      {
        id: 'e_fl_welcome_dest',
        source: 'welcome_block',
        sourceHandle: 'next',
        target: 'dest_field',
        label: 'begin'
      },
      {
        id: 'e_fl_dest_cabin',
        source: 'dest_field',
        sourceHandle: 'filled',
        target: 'cabin_field',
        label: 'city selected'
      },
      {
        id: 'e_fl_cabin_confirm',
        source: 'cabin_field',
        sourceHandle: 'filled',
        target: 'confirm_field',
        label: 'class selected'
      },
      {
        id: 'e_fl_confirm_eval',
        source: 'confirm_field',
        sourceHandle: 'filled',
        target: 'eval_confirm',
        label: 'answered'
      },
      {
        id: 'e_fl_eval_true',
        source: 'eval_confirm',
        sourceHandle: 'true',
        target: 'thankyou_block',
        label: 'confirmed (true)'
      },
      {
        id: 'e_fl_eval_false',
        source: 'eval_confirm',
        sourceHandle: 'false',
        target: 'cancel_block',
        label: 'cancelled (false)'
      },
      {
        id: 'e_fl_ty_hangup',
        source: 'thankyou_block',
        sourceHandle: 'next',
        target: 'flight_hangup',
        label: 'complete'
      },
      {
        id: 'e_fl_cancel_hangup',
        source: 'cancel_block',
        sourceHandle: 'next',
        target: 'flight_hangup',
        label: 'exit'
      }
    ]
  },
  {
    id: 'speech-dept-router',
    name: 'Speech-Driven Department Router (SRGS)',
    description: 'Natural language speech IVR using multi-intent SRGS 1.0 grammar to route callers to Billing, Technical Support, Sales, or Live Operator.',
    settings: {
      ...getDefaultSettings(),
      globalVars: [
        { name: 'department_choice', expr: "''" }
      ]
    },
    nodes: [
      {
        id: 'welcome_intro',
        type: 'vxml-block',
        position: { x: 50, y: 150 },
        data: {
          label: 'Enterprise Greeting',
          dialogId: 'welcome_intro',
          blockName: 'greeting',
          prompt: {
            text: 'Thank you for calling Apex Cloud Enterprise Services.'
          },
          next: 'ask_department'
        }
      },
      {
        id: 'ask_department',
        type: 'vxml-field',
        position: { x: 420, y: 150 },
        data: {
          label: 'Speech Department Query',
          dialogId: 'ask_department',
          fieldName: 'department_choice',
          type: 'custom',
          prompt: {
            text: 'Please tell us how we can assist you today. You can say Billing and Payments, Technical Support, Sales Inquiries, or Speak to an Agent.',
            bargein: true
          },
          customGrammar: `<grammar version="1.0"
         xmlns="http://www.w3.org/2001/06/grammar"
         xml:lang="en-US"
         mode="voice"
         root="DEPARTMENTS"
         tag-format="semantics/1.0">

  <rule id="DEPARTMENTS" scope="public">
    <one-of>
      <item>billing <tag>out = "billing";</tag></item>
      <item>bill <tag>out = "billing";</tag></item>
      <item>invoice <tag>out = "billing";</tag></item>
      <item>payments <tag>out = "billing";</tag></item>
      <item>pay my bill <tag>out = "billing";</tag></item>
      <item>technical support <tag>out = "support";</tag></item>
      <item>tech support <tag>out = "support";</tag></item>
      <item>system issue <tag>out = "support";</tag></item>
      <item>help desk <tag>out = "support";</tag></item>
      <item>troubleshooting <tag>out = "support";</tag></item>
      <item>sales <tag>out = "sales";</tag></item>
      <item>purchase <tag>out = "sales";</tag></item>
      <item>pricing <tag>out = "sales";</tag></item>
      <item>new subscription <tag>out = "sales";</tag></item>
      <item>upgrade <tag>out = "sales";</tag></item>
      <item>speak to an agent <tag>out = "operator";</tag></item>
      <item>agent <tag>out = "operator";</tag></item>
      <item>operator <tag>out = "operator";</tag></item>
      <item>human <tag>out = "operator";</tag></item>
      <item>representative <tag>out = "operator";</tag></item>
    </one-of>
  </rule>
</grammar>`,
          filledNext: 'route_dept_billing',
          nomatchPrompt: 'Sorry, I did not catch that. Please say Billing, Technical Support, Sales, or Speak to an Agent.',
          noinputPrompt: 'Please speak the department you would like to reach.'
        }
      },
      {
        id: 'route_dept_billing',
        type: 'vxml-condition',
        position: { x: 800, y: 150 },
        data: {
          label: 'Is Billing?',
          dialogId: 'route_dept_billing',
          condition: "department_choice === 'billing'",
          truePrompt: 'Connecting you to our Automated Billing and Payment Portal.',
          falsePrompt: '',
          trueNext: 'billing_block',
          falseNext: 'route_dept_support'
        }
      },
      {
        id: 'route_dept_support',
        type: 'vxml-condition',
        position: { x: 1180, y: 240 },
        data: {
          label: 'Is Tech Support?',
          dialogId: 'route_dept_support',
          condition: "department_choice === 'support'",
          truePrompt: 'Connecting you to Enterprise Cloud Technical Support.',
          falsePrompt: '',
          trueNext: 'support_block',
          falseNext: 'route_dept_sales'
        }
      },
      {
        id: 'route_dept_sales',
        type: 'vxml-condition',
        position: { x: 1560, y: 320 },
        data: {
          label: 'Is Sales?',
          dialogId: 'route_dept_sales',
          condition: "department_choice === 'sales'",
          truePrompt: 'Directing your call to Enterprise Sales and Solutions.',
          falsePrompt: 'Connecting you to our next available customer care operator.',
          trueNext: 'sales_block',
          falseNext: 'transfer_operator'
        }
      },
      {
        id: 'billing_block',
        type: 'vxml-block',
        position: { x: 1180, y: 50 },
        data: {
          label: 'Billing Portal',
          dialogId: 'billing_block',
          blockName: 'billing_info',
          prompt: {
            text: 'Your current account balance is zero dollars. No outstanding payment is due at this time.'
          },
          next: 'call_disconnect'
        }
      },
      {
        id: 'support_block',
        type: 'vxml-block',
        position: { x: 1560, y: 150 },
        data: {
          label: 'Support Portal',
          dialogId: 'support_block',
          blockName: 'support_info',
          prompt: {
            text: 'All cloud systems are operating normally. Our team is ready to assist with your incident ticket.'
          },
          next: 'call_disconnect'
        }
      },
      {
        id: 'sales_block',
        type: 'vxml-block',
        position: { x: 1950, y: 250 },
        data: {
          label: 'Sales Desk',
          dialogId: 'sales_block',
          blockName: 'sales_info',
          prompt: {
            text: 'Thank you for your interest in Apex Cloud Enterprise Solutions. A sales executive has been assigned to your account.'
          },
          next: 'call_disconnect'
        }
      },
      {
        id: 'transfer_operator',
        type: 'vxml-transfer',
        position: { x: 1950, y: 440 },
        data: {
          label: 'Operator Transfer',
          dialogId: 'transfer_operator',
          transferName: 'agent_transfer',
          dest: 'tel:+18005550199',
          bridge: true,
          connecttimeout: '30s',
          prompt: {
            text: 'Please hold while we transfer you to an operator.'
          },
          next: 'call_disconnect'
        }
      },
      {
        id: 'call_disconnect',
        type: 'vxml-disconnect',
        position: { x: 2320, y: 220 },
        data: {
          label: 'End Session',
          dialogId: 'call_disconnect',
          prompt: {
            text: 'Thank you for contacting Apex Cloud Solutions. Goodbye.'
          }
        }
      }
    ],
    edges: [
      {
        id: 'e_dept_welcome_ask',
        source: 'welcome_intro',
        sourceHandle: 'next',
        target: 'ask_department',
        label: 'ask'
      },
      {
        id: 'e_dept_ask_billing',
        source: 'ask_department',
        sourceHandle: 'filled',
        target: 'route_dept_billing',
        label: 'spoken request'
      },
      {
        id: 'e_dept_billing_true',
        source: 'route_dept_billing',
        sourceHandle: 'true',
        target: 'billing_block',
        label: 'billing'
      },
      {
        id: 'e_dept_billing_false',
        source: 'route_dept_billing',
        sourceHandle: 'false',
        target: 'route_dept_support',
        label: 'not billing'
      },
      {
        id: 'e_dept_support_true',
        source: 'route_dept_support',
        sourceHandle: 'true',
        target: 'support_block',
        label: 'support'
      },
      {
        id: 'e_dept_support_false',
        source: 'route_dept_support',
        sourceHandle: 'false',
        target: 'route_dept_sales',
        label: 'not support'
      },
      {
        id: 'e_dept_sales_true',
        source: 'route_dept_sales',
        sourceHandle: 'true',
        target: 'sales_block',
        label: 'sales'
      },
      {
        id: 'e_dept_sales_false',
        source: 'route_dept_sales',
        sourceHandle: 'false',
        target: 'transfer_operator',
        label: 'operator'
      },
      {
        id: 'e_dept_bill_done',
        source: 'billing_block',
        sourceHandle: 'next',
        target: 'call_disconnect',
        label: 'complete'
      },
      {
        id: 'e_dept_supp_done',
        source: 'support_block',
        sourceHandle: 'next',
        target: 'call_disconnect',
        label: 'complete'
      },
      {
        id: 'e_dept_sales_done',
        source: 'sales_block',
        sourceHandle: 'next',
        target: 'call_disconnect',
        label: 'complete'
      },
      {
        id: 'e_dept_xfer_done',
        source: 'transfer_operator',
        sourceHandle: 'next',
        target: 'call_disconnect',
        label: 'hangup'
      }
    ]
  }
];
