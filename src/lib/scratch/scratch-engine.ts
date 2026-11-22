import type { Node, Edge } from '@xyflow/svelte';
import type { VxmlDocSettings } from '../../types/vxml';
import type {
  ScratchBlock,
  ScratchBlockCategory,
  ScratchBlockShape,
  ScratchBlockType,
  ScratchPaletteItem
} from '../../types/scratch';

export function escapeXml(unsafe: string = ''): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateId(prefix: string = 'block'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

// Complete palette of Scratch blocks for VoiceXML 2.1
export const PALETTE_ITEMS: ScratchPaletteItem[] = [
  // Dialogs & Events (Yellow)
  {
    type: 'dialog_form',
    category: 'dialogs',
    shape: 'c-block',
    label: 'form #',
    description: 'Top-level VoiceXML <form> dialog container',
    defaultParams: { id: 'main_form' },
    defaultChildren: []
  },
  {
    type: 'dialog_menu',
    category: 'dialogs',
    shape: 'c-block',
    label: 'menu #',
    description: 'Touch-tone & speech <menu> dialog container',
    defaultParams: { id: 'main_menu', dtmf: true },
    defaultChildren: []
  },
  {
    type: 'when_start',
    category: 'dialogs',
    shape: 'hat',
    label: 'when call starts -> goto #',
    description: 'Initial entry point jumping to the first dialog',
    defaultParams: { next: 'main_menu' }
  },
  {
    type: 'event_catch',
    category: 'dialogs',
    shape: 'c-block',
    label: 'catch event',
    description: 'Handle events like noinput, nomatch, or error',
    defaultParams: { event: 'noinput' },
    defaultChildren: []
  },

  // Prompts & Speech (Purple)
  {
    type: 'prompt_say',
    category: 'prompts',
    shape: 'stack',
    label: 'say',
    description: 'Speak synthesized text to caller',
    defaultParams: { text: 'Welcome to our automated voice service.' }
  },
  {
    type: 'prompt_audio',
    category: 'prompts',
    shape: 'stack',
    label: 'play audio',
    description: 'Play recorded audio file with fallback text',
    defaultParams: { src: 'welcome.wav', text: 'Welcome' }
  },
  {
    type: 'prompt_config',
    category: 'prompts',
    shape: 'stack',
    label: 'prompt config',
    description: 'Set barge-in and recognition timeout',
    defaultParams: { bargein: true, timeout: '5s' }
  },

  // Inputs & Sensing (Blue)
  {
    type: 'input_field',
    category: 'inputs',
    shape: 'c-block',
    label: 'field',
    description: 'Input collection field (digits, boolean, phone, custom)',
    defaultParams: { name: 'user_input', type: 'digits' },
    defaultChildren: []
  },
  {
    type: 'input_choice',
    category: 'inputs',
    shape: 'stack',
    label: 'choice DTMF',
    description: 'Menu choice with DTMF key and target dialog',
    defaultParams: { dtmf: '1', next: 'support_form', text: 'Customer Support' }
  },
  {
    type: 'input_record',
    category: 'inputs',
    shape: 'stack',
    label: 'record audio into',
    description: 'Record caller voice audio',
    defaultParams: { name: 'caller_recording', maxtime: '30s', beep: true }
  },
  {
    type: 'grammar_builtin',
    category: 'inputs',
    shape: 'stack',
    label: 'builtin grammar',
    description: 'Specify built-in grammar parameters',
    defaultParams: { type: 'digits', params: '?minlength=4;maxlength=6' }
  },

  // Logic & Operators (Green)
  {
    type: 'logic_assign',
    category: 'logic',
    shape: 'stack',
    label: 'assign',
    description: 'Assign variable value using ECMAScript expression',
    defaultParams: { name: 'user_authenticated', expr: 'true' }
  },
  {
    type: 'logic_var',
    category: 'logic',
    shape: 'stack',
    label: 'declare var',
    description: 'Declare dialog variable with optional initial expression',
    defaultParams: { name: 'attempts', expr: '0' }
  },
  {
    type: 'logic_script',
    category: 'logic',
    shape: 'stack',
    label: 'script',
    description: 'Execute inline ECMAScript block',
    defaultParams: { code: 'attempts = attempts + 1;' }
  },

  // Control & Flow (Orange)
  {
    type: 'control_goto',
    category: 'control',
    shape: 'stack',
    label: 'goto #',
    description: 'Transition execution to another dialog',
    defaultParams: { next: 'main_menu' }
  },
  {
    type: 'control_if',
    category: 'control',
    shape: 'c-block-if',
    label: 'if',
    description: 'Conditional branching with then and else branches',
    defaultParams: { condition: 'attempts < 3' },
    defaultChildren: [],
    defaultChildrenElse: []
  } as any,
  {
    type: 'control_subdialog',
    category: 'control',
    shape: 'stack',
    label: 'subdialog',
    description: 'Invoke reusable subflow VoiceXML document',
    defaultParams: { name: 'auth_sub', src: 'auth.vxml', method: 'get' }
  },
  {
    type: 'control_submit',
    category: 'control',
    shape: 'stack',
    label: 'submit to',
    description: 'Submit collected variables to server script',
    defaultParams: { next: 'process.php', namelist: 'user_input' }
  },

  // Telephony & Network (Red)
  {
    type: 'telephony_transfer',
    category: 'telephony',
    shape: 'cap',
    label: 'transfer call to',
    description: 'Transfer call to telephone number or SIP endpoint',
    defaultParams: { dest: 'tel:+18005550199', bridge: true }
  },
  {
    type: 'telephony_disconnect',
    category: 'telephony',
    shape: 'cap',
    label: 'disconnect call',
    description: 'Terminate the telephony session gracefully',
    defaultParams: { message: 'Thank you for calling. Goodbye.' }
  },
  {
    type: 'telephony_exit',
    category: 'telephony',
    shape: 'cap',
    label: 'exit',
    description: 'Exit application returning result expression',
    defaultParams: { expr: "'normal_exit'" }
  },
  {
    type: 'data_fetch',
    category: 'telephony',
    shape: 'stack',
    label: 'data fetch [VXML 2.1]',
    description: 'Fetch backend XML data dynamically without page transitions',
    defaultParams: { name: 'account_data', src: 'https://api.example.com/account', method: 'get' }
  }
];

export function createBlock(
  type: ScratchBlockType,
  customParams?: Record<string, any>,
  children?: ScratchBlock[],
  elseChildren?: ScratchBlock[]
): ScratchBlock {
  const item = PALETTE_ITEMS.find((p) => p.type === type);
  if (!item) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return {
    id: generateId(type),
    type: item.type,
    category: item.category,
    shape: item.shape,
    params: { ...item.defaultParams, ...(customParams || {}) },
    children: children ? [...children] : item.defaultChildren ? JSON.parse(JSON.stringify(item.defaultChildren)) : undefined,
    elseChildren: elseChildren ? [...elseChildren] : item.shape === 'c-block-if' ? [] : undefined
  };
}

/**
 * Convert Scratch blocks tree into compliant VoiceXML 2.1 markup
 */
export function scratchToVxml(
  blocks: ScratchBlock[],
  settings?: VxmlDocSettings
): string {
  const s: VxmlDocSettings = settings || {
    version: '2.1',
    xmlns: 'http://www.w3.org/2001/vxml',
    xmlLang: 'en-US',
    globalVars: [],
    globalProperties: [],
    globalCatch: []
  };

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');

  const rootAttrs = [
    `version="${s.version || '2.1'}"`,
    `xmlns="${s.xmlns || 'http://www.w3.org/2001/vxml'}"`,
    `xml:lang="${escapeXml(s.xmlLang || 'en-US')}"`
  ];
  if (s.application) {
    rootAttrs.push(`application="${escapeXml(s.application)}"`);
  }
  lines.push(`<vxml ${rootAttrs.join(' ')}>`);

  // Document Properties
  if (s.globalProperties && s.globalProperties.length > 0) {
    for (const p of s.globalProperties) {
      if (p.name && p.value) {
        lines.push(`  <property name="${escapeXml(p.name)}" value="${escapeXml(p.value)}"/>`);
      }
    }
  }

  // Document Variables
  if (s.globalVars && s.globalVars.length > 0) {
    for (const v of s.globalVars) {
      if (v.name) {
        if (v.expr) {
          lines.push(`  <var name="${escapeXml(v.name)}" expr="${escapeXml(v.expr)}"/>`);
        } else {
          lines.push(`  <var name="${escapeXml(v.name)}"/>`);
        }
      }
    }
  }

  // Helper to render child blocks inside a dialog or block
  function renderInnerBlocks(children: ScratchBlock[], indent: string): void {
    for (const child of children) {
      switch (child.type) {
        case 'prompt_say':
          if (child.params.text) {
            lines.push(`${indent}<prompt>${escapeXml(child.params.text)}</prompt>`);
          }
          break;

        case 'prompt_audio':
          if (child.params.src) {
            if (child.params.text) {
              lines.push(`${indent}<prompt>`);
              lines.push(`${indent}  <audio src="${escapeXml(child.params.src)}">${escapeXml(child.params.text)}</audio>`);
              lines.push(`${indent}</prompt>`);
            } else {
              lines.push(`${indent}<prompt><audio src="${escapeXml(child.params.src)}"/></prompt>`);
            }
          }
          break;

        case 'prompt_config':
          const barge = child.params.bargein !== undefined ? ` bargein="${child.params.bargein}"` : '';
          const tout = child.params.timeout ? ` timeout="${escapeXml(child.params.timeout)}"` : '';
          lines.push(`${indent}<property name="bargein" value="${child.params.bargein ?? true}"/>`);
          if (child.params.timeout) {
            lines.push(`${indent}<property name="timeout" value="${escapeXml(child.params.timeout)}"/>`);
          }
          break;

        case 'input_field': {
          const fieldName = child.params.name || 'field_1';
          const fieldType = child.params.type || 'digits';
          const typeAttr = fieldType !== 'custom' ? ` type="${escapeXml(fieldType)}"` : '';
          lines.push(`${indent}<field name="${escapeXml(fieldName)}"${typeAttr}>`);
          if (child.children && child.children.length > 0) {
            renderInnerBlocks(child.children, indent + '  ');
          }
          if (child.params.filledNext) {
            lines.push(`${indent}  <filled>`);
            lines.push(`${indent}    <goto next="#${escapeXml(child.params.filledNext)}"/>`);
            lines.push(`${indent}  </filled>`);
          }
          lines.push(`${indent}</field>`);
          break;
        }

        case 'input_choice': {
          const dtmfAttr = child.params.dtmf ? ` dtmf="${escapeXml(child.params.dtmf)}"` : '';
          const nextTarget = child.params.next ? `#${escapeXml(child.params.next.replace(/^#/, ''))}` : '#';
          const choiceText = escapeXml(child.params.text || '');
          lines.push(`${indent}<choice${dtmfAttr} next="${nextTarget}">${choiceText}</choice>`);
          break;
        }

        case 'input_record': {
          const rName = child.params.name || 'recording';
          const beepAttr = child.params.beep !== undefined ? ` beep="${child.params.beep}"` : '';
          const maxAttr = child.params.maxtime ? ` maxtime="${escapeXml(child.params.maxtime)}"` : '';
          lines.push(`${indent}<record name="${escapeXml(rName)}"${beepAttr}${maxAttr} type="audio/x-wav">`);
          if (child.children && child.children.length > 0) {
            renderInnerBlocks(child.children, indent + '  ');
          }
          lines.push(`${indent}</record>`);
          break;
        }

        case 'grammar_builtin': {
          const gType = child.params.type || 'digits';
          const gParams = child.params.params || '';
          lines.push(`${indent}<grammar type="application/x-vxml" src="builtin:${escapeXml(gType)}${escapeXml(gParams)}"/>`);
          break;
        }

        case 'logic_assign':
          if (child.params.name) {
            lines.push(`${indent}<assign name="${escapeXml(child.params.name)}" expr="${escapeXml(child.params.expr || "''")}"/>`);
          }
          break;

        case 'logic_var':
          if (child.params.name) {
            if (child.params.expr) {
              lines.push(`${indent}<var name="${escapeXml(child.params.name)}" expr="${escapeXml(child.params.expr)}"/>`);
            } else {
              lines.push(`${indent}<var name="${escapeXml(child.params.name)}"/>`);
            }
          }
          break;

        case 'logic_script':
          if (child.params.code) {
            lines.push(`${indent}<script><![CDATA[`);
            lines.push(`${indent}  ${child.params.code}`);
            lines.push(`${indent}]]></script>`);
          }
          break;

        case 'control_goto': {
          const target = child.params.next ? `#${escapeXml(child.params.next.replace(/^#/, ''))}` : '#';
          lines.push(`${indent}<goto next="${target}"/>`);
          break;
        }

        case 'control_if': {
          const cond = escapeXml(child.params.condition || 'true');
          lines.push(`${indent}<if cond="${cond}">`);
          if (child.children && child.children.length > 0) {
            renderInnerBlocks(child.children, indent + '  ');
          }
          if (child.elseChildren && child.elseChildren.length > 0) {
            lines.push(`${indent}<else/>`);
            renderInnerBlocks(child.elseChildren, indent + '  ');
          }
          lines.push(`${indent}</if>`);
          break;
        }

        case 'control_subdialog': {
          const subName = child.params.name ? ` name="${escapeXml(child.params.name)}"` : '';
          const subSrc = child.params.src ? ` src="${escapeXml(child.params.src)}"` : '';
          const subMethod = child.params.method ? ` method="${escapeXml(child.params.method)}"` : '';
          lines.push(`${indent}<subdialog${subName}${subSrc}${subMethod}/>`);
          break;
        }

        case 'control_submit': {
          const sNext = child.params.next ? ` next="${escapeXml(child.params.next)}"` : '';
          const sList = child.params.namelist ? ` namelist="${escapeXml(child.params.namelist)}"` : '';
          lines.push(`${indent}<submit${sNext}${sList}/>`);
          break;
        }

        case 'telephony_transfer': {
          const dest = child.params.dest ? ` dest="${escapeXml(child.params.dest)}"` : '';
          const bridge = child.params.bridge !== undefined ? ` bridge="${child.params.bridge}"` : '';
          lines.push(`${indent}<transfer${dest}${bridge}/>`);
          break;
        }

        case 'telephony_disconnect':
          if (child.params.message) {
            lines.push(`${indent}<prompt>${escapeXml(child.params.message)}</prompt>`);
          }
          lines.push(`${indent}<disconnect/>`);
          break;

        case 'telephony_exit': {
          const expr = child.params.expr ? ` expr="${escapeXml(child.params.expr)}"` : '';
          lines.push(`${indent}<exit${expr}/>`);
          break;
        }

        case 'data_fetch': {
          const dName = child.params.name ? ` name="${escapeXml(child.params.name)}"` : '';
          const dSrc = child.params.src ? ` src="${escapeXml(child.params.src)}"` : '';
          const dMethod = child.params.method ? ` method="${escapeXml(child.params.method)}"` : ' method="get"';
          lines.push(`${indent}<data${dName}${dSrc}${dMethod}/>`);
          break;
        }

        case 'event_catch': {
          const ev = child.params.event ? ` event="${escapeXml(child.params.event)}"` : '';
          lines.push(`${indent}<catch${ev}>`);
          if (child.children && child.children.length > 0) {
            renderInnerBlocks(child.children, indent + '  ');
          }
          lines.push(`${indent}</catch>`);
          break;
        }

        default:
          break;
      }
    }
  }

  // Render top-level dialogs and scripts
  for (const block of blocks) {
    if (block.type === 'when_start') {
      // Entry point form that directs to initial dialog
      const target = block.params.next ? `#${escapeXml(block.params.next.replace(/^#/, ''))}` : '#';
      lines.push(`  <!-- Entry Point -->`);
      lines.push(`  <form id="start">`);
      lines.push(`    <block>`);
      lines.push(`      <goto next="${target}"/>`);
      lines.push(`    </block>`);
      lines.push(`  </form>`);
    } else if (block.type === 'dialog_form') {
      const dialogId = escapeXml(block.params.id || 'form_1');
      lines.push(`  <form id="${dialogId}">`);

      const childList = block.children || [];
      const isExecutable = (t: string) =>
        ['prompt_say', 'prompt_audio', 'prompt_config', 'logic_assign', 'logic_script', 'control_goto', 'control_if', 'control_submit', 'telephony_disconnect', 'telephony_exit'].includes(t);

      let currentExecGroup: ScratchBlock[] = [];

      const flushExecGroup = () => {
        if (currentExecGroup.length > 0) {
          lines.push(`    <block>`);
          renderInnerBlocks(currentExecGroup, '      ');
          lines.push(`    </block>`);
          currentExecGroup = [];
        }
      };

      for (const child of childList) {
        if (isExecutable(child.type)) {
          currentExecGroup.push(child);
        } else {
          flushExecGroup();
          renderInnerBlocks([child], '    ');
        }
      }
      flushExecGroup();

      lines.push(`  </form>`);
    } else if (block.type === 'dialog_menu') {
      const menuId = escapeXml(block.params.id || 'menu_1');
      const dtmfAttr = block.params.dtmf !== undefined ? ` dtmf="${block.params.dtmf}"` : '';
      lines.push(`  <menu id="${menuId}"${dtmfAttr}>`);
      if (block.children && block.children.length > 0) {
        renderInnerBlocks(block.children, '    ');
      }
      lines.push(`  </menu>`);
    } else if (block.type === 'event_catch') {
      const ev = block.params.event ? ` event="${escapeXml(block.params.event)}"` : '';
      lines.push(`  <catch${ev}>`);
      if (block.children && block.children.length > 0) {
        renderInnerBlocks(block.children, '    ');
      }
      lines.push(`  </catch>`);
    } else {
      // Standalone top-level block: wrap in form
      lines.push(`  <form id="${escapeXml(block.id)}">`);
      lines.push(`    <block>`);
      renderInnerBlocks([block], '      ');
      lines.push(`    </block>`);
      lines.push(`  </form>`);
    }
  }

  lines.push('</vxml>');
  return lines.join('\n');
}

/**
 * Convert Flow nodes and edges into Scratch Blocks
 */
export function flowToScratch(nodes: Node[], edges: Edge[]): ScratchBlock[] {
  const blocks: ScratchBlock[] = [];

  // Map nodeId -> dialogId
  const idMap = new Map<string, string>();
  for (const n of nodes) {
    const dId = (n.data as any)?.dialogId || n.id;
    idMap.set(n.id, dId);
  }

  const findNextDialog = (nodeId: string, handle?: string): string | undefined => {
    const edge = edges.find((e) => e.source === nodeId && (handle ? e.sourceHandle === handle : true));
    return edge ? idMap.get(edge.target) : undefined;
  };

  let posX = 40;
  let posY = 40;

  for (const node of nodes) {
    const data = (node.data as any) || {};
    const dialogId = data.dialogId || node.id;

    if (node.type === 'vxml-menu') {
      const childBlocks: ScratchBlock[] = [];

      // Prompt
      if (data.prompt?.text) {
        childBlocks.push(createBlock('prompt_say', { text: data.prompt.text }));
      }
      if (data.prompt?.audio) {
        childBlocks.push(createBlock('prompt_audio', { src: data.prompt.audio, text: data.prompt.text || '' }));
      }

      // Choices
      if (Array.isArray(data.choices)) {
        for (const c of data.choices) {
          const target = findNextDialog(node.id, `choice-${c.id}`) || c.next || '';
          childBlocks.push(
            createBlock('input_choice', {
              dtmf: c.dtmf || '1',
              text: c.text || '',
              next: target
            })
          );
        }
      }

      // Noinput / Nomatch catch
      if (data.noinputPrompt) {
        childBlocks.push(
          createBlock('event_catch', { event: 'noinput' }, [
            createBlock('prompt_say', { text: data.noinputPrompt })
          ])
        );
      }
      if (data.nomatchPrompt) {
        childBlocks.push(
          createBlock('event_catch', { event: 'nomatch' }, [
            createBlock('prompt_say', { text: data.nomatchPrompt })
          ])
        );
      }

      const menuBlock = createBlock('dialog_menu', { id: dialogId, dtmf: data.dtmf ?? true }, childBlocks);
      menuBlock.x = posX;
      menuBlock.y = posY;
      blocks.push(menuBlock);
      posY += 280;
    } else if (node.type === 'vxml-field') {
      const formChildren: ScratchBlock[] = [];
      const fieldChildren: ScratchBlock[] = [];

      if (data.prompt?.text) {
        fieldChildren.push(createBlock('prompt_say', { text: data.prompt.text }));
      }
      if (data.customGrammar) {
        fieldChildren.push(createBlock('grammar_builtin', { type: data.type || 'custom', params: data.grammarParams || '' }));
      }

      const filledTarget = findNextDialog(node.id, 'filled') || data.filledNext;
      if (filledTarget) {
        fieldChildren.push(createBlock('control_goto', { next: filledTarget }));
      }

      formChildren.push(
        createBlock('input_field', { name: data.fieldName || 'field_input', type: data.type || 'digits' }, fieldChildren)
      );

      const formBlock = createBlock('dialog_form', { id: dialogId }, formChildren);
      formBlock.x = posX;
      formBlock.y = posY;
      blocks.push(formBlock);
      posY += 260;
    } else if (node.type === 'vxml-block') {
      const childBlocks: ScratchBlock[] = [];

      if (data.prompt?.text) {
        childBlocks.push(createBlock('prompt_say', { text: data.prompt.text }));
      }
      if (Array.isArray(data.assigns)) {
        for (const a of data.assigns) {
          childBlocks.push(createBlock('logic_assign', { name: a.name, expr: a.expr }));
        }
      }
      if (data.script) {
        childBlocks.push(createBlock('logic_script', { code: data.script }));
      }
      const nextTarget = findNextDialog(node.id, 'next') || data.next;
      if (nextTarget) {
        childBlocks.push(createBlock('control_goto', { next: nextTarget }));
      }

      const formBlock = createBlock('dialog_form', { id: dialogId }, childBlocks);
      formBlock.x = posX;
      formBlock.y = posY;
      blocks.push(formBlock);
      posY += 240;
    } else if (node.type === 'vxml-condition') {
      const trueTarget = findNextDialog(node.id, 'true') || data.trueNext;
      const falseTarget = findNextDialog(node.id, 'false') || data.falseNext;

      const thenBlocks: ScratchBlock[] = [];
      if (data.truePrompt) {
        thenBlocks.push(createBlock('prompt_say', { text: data.truePrompt }));
      }
      if (trueTarget) {
        thenBlocks.push(createBlock('control_goto', { next: trueTarget }));
      }

      const elseBlocks: ScratchBlock[] = [];
      if (data.falsePrompt) {
        elseBlocks.push(createBlock('prompt_say', { text: data.falsePrompt }));
      }
      if (falseTarget) {
        elseBlocks.push(createBlock('control_goto', { next: falseTarget }));
      }

      const ifBlock = createBlock(
        'control_if',
        { condition: data.condition || 'true' },
        thenBlocks,
        elseBlocks
      );

      const formBlock = createBlock('dialog_form', { id: dialogId }, [ifBlock]);
      formBlock.x = posX;
      formBlock.y = posY;
      blocks.push(formBlock);
      posY += 240;
    } else if (node.type === 'vxml-transfer') {
      const childBlocks: ScratchBlock[] = [];
      if (data.prompt?.text) {
        childBlocks.push(createBlock('prompt_say', { text: data.prompt.text }));
      }
      childBlocks.push(createBlock('telephony_transfer', { dest: data.dest || 'tel:+18005550199', bridge: data.bridge ?? true }));

      const formBlock = createBlock('dialog_form', { id: dialogId }, childBlocks);
      formBlock.x = posX;
      formBlock.y = posY;
      blocks.push(formBlock);
      posY += 200;
    } else if (node.type === 'vxml-disconnect') {
      const childBlocks: ScratchBlock[] = [];
      childBlocks.push(createBlock('telephony_disconnect', { message: data.prompt?.text || 'Thank you for calling. Goodbye.' }));

      const formBlock = createBlock('dialog_form', { id: dialogId }, childBlocks);
      formBlock.x = posX;
      formBlock.y = posY;
      blocks.push(formBlock);
      posY += 180;
    } else if (node.type === 'vxml-exit') {
      const childBlocks: ScratchBlock[] = [];
      childBlocks.push(createBlock('telephony_exit', { expr: data.expr || "'normal_exit'" }));

      const formBlock = createBlock('dialog_form', { id: dialogId }, childBlocks);
      formBlock.x = posX;
      formBlock.y = posY;
      blocks.push(formBlock);
      posY += 180;
    } else if (node.type === 'vxml-data') {
      const childBlocks: ScratchBlock[] = [];
      childBlocks.push(createBlock('data_fetch', { name: data.dataName || 'fetch_data', src: data.src || '', method: data.method || 'get' }));
      const nextTarget = findNextDialog(node.id, 'next') || data.next;
      if (nextTarget) {
        childBlocks.push(createBlock('control_goto', { next: nextTarget }));
      }

      const formBlock = createBlock('dialog_form', { id: dialogId }, childBlocks);
      formBlock.x = posX;
      formBlock.y = posY;
      blocks.push(formBlock);
      posY += 200;
    }
  }

  return blocks;
}

/**
 * Convert Scratch blocks back to Flow nodes & edges
 */
export function scratchToFlow(blocks: ScratchBlock[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let curX = 100;
  let curY = 100;

  for (const block of blocks) {
    if (block.type === 'when_start') {
      continue;
    }

    if (block.type === 'dialog_menu') {
      const menuId = block.params.id || block.id;
      const choices: Array<{ id: string; dtmf: string; text: string; next?: string }> = [];
      let promptText = '';

      if (block.children) {
        for (const c of block.children) {
          if (c.type === 'prompt_say') {
            promptText = c.params.text || '';
          } else if (c.type === 'input_choice') {
            const cId = `choice_${choices.length + 1}`;
            choices.push({
              id: cId,
              dtmf: c.params.dtmf || '1',
              text: c.params.text || '',
              next: c.params.next
            });
            if (c.params.next) {
              edges.push({
                id: `e_${menuId}_${cId}_${c.params.next}`,
                source: menuId,
                target: c.params.next,
                sourceHandle: `choice-${cId}`,
                type: 'smoothstep',
                animated: true,
                label: `[${c.params.dtmf}] ${c.params.text}`
              });
            }
          }
        }
      }

      nodes.push({
        id: menuId,
        type: 'vxml-menu',
        position: { x: curX, y: curY },
        data: {
          label: `Menu: ${menuId}`,
          dialogId: menuId,
          dtmf: block.params.dtmf ?? true,
          prompt: { text: promptText },
          choices
        }
      });
      curX += 280;
    } else if (block.type === 'dialog_form') {
      const formId = block.params.id || block.id;
      const children = block.children || [];

      // Check what kind of primary element is inside
      const fieldBlock = children.find((c) => c.type === 'input_field');
      const transferBlock = children.find((c) => c.type === 'telephony_transfer');
      const disconnectBlock = children.find((c) => c.type === 'telephony_disconnect');
      const exitBlock = children.find((c) => c.type === 'telephony_exit');
      const dataBlock = children.find((c) => c.type === 'data_fetch');
      const ifBlock = children.find((c) => c.type === 'control_if');

      if (fieldBlock) {
        let pText = '';
        let filledTarget = '';
        if (fieldBlock.children) {
          for (const fc of fieldBlock.children) {
            if (fc.type === 'prompt_say') pText = fc.params.text || '';
            if (fc.type === 'control_goto') filledTarget = fc.params.next || '';
          }
        }
        nodes.push({
          id: formId,
          type: 'vxml-field',
          position: { x: curX, y: curY },
          data: {
            label: `Field: ${fieldBlock.params.name}`,
            dialogId: formId,
            fieldName: fieldBlock.params.name || 'field_1',
            type: fieldBlock.params.type || 'digits',
            prompt: { text: pText },
            filledNext: filledTarget
          }
        });
        if (filledTarget) {
          edges.push({
            id: `e_${formId}_filled_${filledTarget}`,
            source: formId,
            target: filledTarget,
            sourceHandle: 'filled',
            type: 'smoothstep',
            animated: true,
            label: 'filled'
          });
        }
      } else if (transferBlock) {
        let pText = '';
        const pBlock = children.find((c) => c.type === 'prompt_say');
        if (pBlock) pText = pBlock.params.text || '';

        nodes.push({
          id: formId,
          type: 'vxml-transfer',
          position: { x: curX, y: curY },
          data: {
            label: `Transfer: ${transferBlock.params.dest}`,
            dialogId: formId,
            transferName: 'call_transfer',
            dest: transferBlock.params.dest || 'tel:+18005550199',
            bridge: transferBlock.params.bridge ?? true,
            connecttimeout: '30s',
            prompt: { text: pText }
          }
        });
      } else if (disconnectBlock) {
        nodes.push({
          id: formId,
          type: 'vxml-disconnect',
          position: { x: curX, y: curY },
          data: {
            label: `Disconnect: ${formId}`,
            dialogId: formId,
            prompt: { text: disconnectBlock.params.message || 'Goodbye' }
          }
        });
      } else if (exitBlock) {
        nodes.push({
          id: formId,
          type: 'vxml-exit',
          position: { x: curX, y: curY },
          data: {
            label: `Exit: ${formId}`,
            dialogId: formId,
            expr: exitBlock.params.expr || "'normal_exit'"
          }
        });
      } else if (dataBlock) {
        let nextTarget = '';
        const gotoBlock = children.find((c) => c.type === 'control_goto');
        if (gotoBlock) nextTarget = gotoBlock.params.next || '';

        nodes.push({
          id: formId,
          type: 'vxml-data',
          position: { x: curX, y: curY },
          data: {
            label: `Data: ${dataBlock.params.name}`,
            dialogId: formId,
            dataName: dataBlock.params.name || 'data_1',
            src: dataBlock.params.src || '',
            method: dataBlock.params.method || 'get',
            next: nextTarget
          }
        });
        if (nextTarget) {
          edges.push({
            id: `e_${formId}_next_${nextTarget}`,
            source: formId,
            target: nextTarget,
            sourceHandle: 'next',
            type: 'smoothstep',
            animated: true,
            label: 'next'
          });
        }
      } else if (ifBlock) {
        let trueNext = '';
        let falseNext = '';
        if (ifBlock.children) {
          const g = ifBlock.children.find((c) => c.type === 'control_goto');
          if (g) trueNext = g.params.next || '';
        }
        if (ifBlock.elseChildren) {
          const g = ifBlock.elseChildren.find((c) => c.type === 'control_goto');
          if (g) falseNext = g.params.next || '';
        }
        nodes.push({
          id: formId,
          type: 'vxml-condition',
          position: { x: curX, y: curY },
          data: {
            label: `Condition: ${formId}`,
            dialogId: formId,
            condition: ifBlock.params.condition || 'true',
            trueNext,
            falseNext
          }
        });
        if (trueNext) {
          edges.push({
            id: `e_${formId}_true_${trueNext}`,
            source: formId,
            target: trueNext,
            sourceHandle: 'true',
            type: 'smoothstep',
            animated: true,
            label: 'true'
          });
        }
        if (falseNext) {
          edges.push({
            id: `e_${formId}_false_${falseNext}`,
            source: formId,
            target: falseNext,
            sourceHandle: 'false',
            type: 'smoothstep',
            animated: true,
            label: 'false'
          });
        }
      } else {
        // Generic procedural block
        let pText = '';
        const assigns: Array<{ name: string; expr: string }> = [];
        let nextTarget = '';
        for (const c of children) {
          if (c.type === 'prompt_say') pText = c.params.text || '';
          if (c.type === 'logic_assign') assigns.push({ name: c.params.name, expr: c.params.expr });
          if (c.type === 'control_goto') nextTarget = c.params.next || '';
        }
        nodes.push({
          id: formId,
          type: 'vxml-block',
          position: { x: curX, y: curY },
          data: {
            label: `Block: ${formId}`,
            dialogId: formId,
            blockName: formId,
            prompt: { text: pText },
            assigns,
            next: nextTarget
          }
        });
        if (nextTarget) {
          edges.push({
            id: `e_${formId}_next_${nextTarget}`,
            source: formId,
            target: nextTarget,
            sourceHandle: 'next',
            type: 'smoothstep',
            animated: true,
            label: 'next'
          });
        }
      }
      curX += 280;
    }
  }

  return { nodes, edges };
}

// Built-in Scratch Templates
export const SCRATCH_TEMPLATES = [
  {
    id: 'scratch_support_router',
    name: 'Customer Support Router',
    description: 'Interactive menu with touch-tone DTMF routing and transfer to agent',
    blocks: [
      createBlock('dialog_menu', { id: 'main_menu', dtmf: true }, [
        createBlock('prompt_say', { text: 'Thank you for calling Acme Support. For Billing, press 1. For Technical Support, press 2. To speak with an agent, press 0.' }),
        createBlock('input_choice', { dtmf: '1', next: 'billing_form', text: 'Billing' }),
        createBlock('input_choice', { dtmf: '2', next: 'tech_form', text: 'Technical Support' }),
        createBlock('input_choice', { dtmf: '0', next: 'agent_transfer', text: 'Agent' }),
        createBlock('event_catch', { event: 'noinput' }, [
          createBlock('prompt_say', { text: 'Sorry, I did not receive any input. Please press a key.' })
        ])
      ]),
      createBlock('dialog_form', { id: 'billing_form' }, [
        createBlock('prompt_say', { text: 'Please enter your 6-digit billing account number.' }),
        createBlock('input_field', { name: 'account_number', type: 'digits' }, [
          createBlock('control_goto', { next: 'billing_confirm' })
        ])
      ]),
      createBlock('dialog_form', { id: 'billing_confirm' }, [
        createBlock('prompt_say', { text: 'Your billing request has been processed. Goodbye.' }),
        createBlock('telephony_disconnect')
      ]),
      createBlock('dialog_form', { id: 'tech_form' }, [
        createBlock('prompt_say', { text: 'All our technical support guides are available online at acme.com/help.' }),
        createBlock('telephony_disconnect')
      ]),
      createBlock('dialog_form', { id: 'agent_transfer' }, [
        createBlock('prompt_say', { text: 'Please hold while we connect you to the next available representative.' }),
        createBlock('telephony_transfer', { dest: 'tel:+18005550199', bridge: true })
      ])
    ]
  },
  {
    id: 'scratch_data_fetch',
    name: 'VXML 2.1 Backend Data Fetch',
    description: 'PIN collection, dynamic backend XML <data> fetch, and conditional verification',
    blocks: [
      createBlock('dialog_form', { id: 'auth_flow' }, [
        createBlock('prompt_say', { text: 'Welcome to Secure Banking. Please enter your 4-digit PIN.' }),
        createBlock('input_field', { name: 'user_pin', type: 'digits' }, [
          createBlock('control_goto', { next: 'verify_pin' })
        ])
      ]),
      createBlock('dialog_form', { id: 'verify_pin' }, [
        createBlock('data_fetch', { name: 'pin_response', src: 'https://api.bank.com/v1/auth', method: 'post' }),
        createBlock(
          'control_if',
          { condition: "user_pin === '1234'" },
          [
            createBlock('prompt_say', { text: 'PIN verified successfully. Your balance is 5,420 dollars.' }),
            createBlock('telephony_disconnect', { message: 'Thank you for banking with us.' })
          ],
          [
            createBlock('prompt_say', { text: 'Invalid PIN. Access denied.' }),
            createBlock('telephony_disconnect', { message: 'Goodbye.' })
          ]
        )
      ])
    ]
  },
  {
    id: 'scratch_voicemail',
    name: 'Voicemail Recording Flow',
    description: 'Caller voice recording with tone prompt and playback confirmation',
    blocks: [
      createBlock('dialog_form', { id: 'record_greeting' }, [
        createBlock('prompt_say', { text: 'The person you are trying to reach is unavailable. Please record your message after the tone.' }),
        createBlock('input_record', { name: 'caller_voicemail', beep: true, maxtime: '45s' }),
        createBlock('prompt_say', { text: 'Your message has been saved.' }),
        createBlock('telephony_disconnect', { message: 'Goodbye.' })
      ])
    ]
  }
];
