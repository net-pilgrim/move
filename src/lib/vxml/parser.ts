import type { Node, Edge } from '@xyflow/svelte';
import { DOMParser as XmldomParser, XMLSerializer as XmldomSerializer } from '@xmldom/xmldom';
import type {
  VxmlDocSettings,
  MenuNodeData,
  FieldNodeData,
  BlockNodeData,
  DataNodeData,
  ConditionNodeData,
  RecordNodeData,
  TransferNodeData,
  SubdialogNodeData,
  DisconnectNodeData,
  ExitNodeData,
  PromptConfig,
  MenuChoice
} from '../../types/vxml';

export interface ParseResult {
  nodes: Node[];
  edges: Edge[];
  settings: VxmlDocSettings;
  error?: string;
}

function getDOMParser(): any {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser();
  }
  return new XmldomParser();
}

function serializeXmlNode(node: any): string {
  if (typeof XMLSerializer !== 'undefined') {
    return new XMLSerializer().serializeToString(node);
  }
  return new XmldomSerializer().serializeToString(node);
}

function getDirectChildren(parent: Element, tagNames?: string[]): Element[] {
  const children: Element[] = [];
  const nodes = parent.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeType === 1) {
      const el = node as Element;
      if (!tagNames || tagNames.includes(el.tagName.toLowerCase())) {
        children.push(el);
      }
    }
  }
  return children;
}

function findFirst(parent: Element, tagName: string): Element | null {
  const elements = parent.getElementsByTagName(tagName);
  return elements.length > 0 ? elements[0] : null;
}

function findAll(parent: Element, tagName: string): Element[] {
  const elements = parent.getElementsByTagName(tagName);
  const arr: Element[] = [];
  for (let i = 0; i < elements.length; i++) {
    arr.push(elements[i]);
  }
  return arr;
}

function extractPrompt(parent: Element): PromptConfig {
  const promptEl = findFirst(parent, 'prompt');
  if (!promptEl) return { text: '' };

  const audioEl = findFirst(promptEl, 'audio');
  const audioSrc = audioEl?.getAttribute('src') || undefined;

  let text = '';
  if (audioEl && audioEl.textContent) {
    text = audioEl.textContent.trim();
  } else if (promptEl.textContent) {
    text = promptEl.textContent.trim();
  }

  const bargeinAttr = promptEl.getAttribute('bargein');
  const timeoutAttr = promptEl.getAttribute('timeout');

  return {
    text,
    audio: audioSrc,
    bargein: bargeinAttr !== null ? bargeinAttr === 'true' : undefined,
    timeout: timeoutAttr || undefined
  };
}

export function parseVxml(xmlText: string): ParseResult {
  const parser = getDOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for XML parsing errors
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    return {
      nodes: [],
      edges: [],
      settings: getDefaultSettings(),
      error: parseErrors[0].textContent || 'Failed to parse XML'
    };
  }

  const vxmlEls = xmlDoc.getElementsByTagName('vxml');
  const vxmlEl = vxmlEls.length > 0 ? vxmlEls[0] : null;
  if (!vxmlEl) {
    return {
      nodes: [],
      edges: [],
      settings: getDefaultSettings(),
      error: 'No root <vxml> element found in document'
    };
  }

  const settings: VxmlDocSettings = {
    version: '2.1',
    xmlns: vxmlEl.getAttribute('xmlns') || 'http://www.w3.org/2001/vxml',
    xmlLang: vxmlEl.getAttribute('xml:lang') || 'en-US',
    application: vxmlEl.getAttribute('application') || undefined,
    globalVars: [],
    globalProperties: [],
    globalCatch: [],
    globalScript: undefined
  };

  // Top-level properties
  getDirectChildren(vxmlEl, ['property']).forEach((prop) => {
    const name = prop.getAttribute('name');
    const value = prop.getAttribute('value');
    if (name && value) {
      settings.globalProperties.push({ name, value });
    }
  });

  // Top-level vars
  getDirectChildren(vxmlEl, ['var']).forEach((v) => {
    const name = v.getAttribute('name');
    const expr = v.getAttribute('expr') || undefined;
    if (name) {
      settings.globalVars.push({ name, expr });
    }
  });

  // Top-level script
  const scriptEls = getDirectChildren(vxmlEl, ['script']);
  if (scriptEls.length > 0 && scriptEls[0].textContent) {
    settings.globalScript = scriptEls[0].textContent.trim();
  }

  // Top-level catch
  getDirectChildren(vxmlEl, ['catch', 'noinput', 'nomatch', 'error', 'help']).forEach((c) => {
    let eventName = c.getAttribute('event');
    if (!eventName) {
      eventName = c.tagName.toLowerCase();
    }
    const p = findFirst(c, 'prompt')?.textContent?.trim();
    const gotoEl = findFirst(c, 'goto');
    const nextTarget = gotoEl?.getAttribute('next')?.replace(/^#/, '');

    settings.globalCatch.push({
      id: 'catch_' + Math.random().toString(36).substring(2, 7),
      event: eventName,
      prompt: p,
      next: nextTarget
    });
  });

  const nodes: Node[] = [];
  const rawEdges: Array<{
    sourceDialogId: string;
    sourceHandle?: string;
    targetDialogId: string;
    label?: string;
  }> = [];

  // Find all top-level dialogs: <menu> and <form>
  const dialogEls = getDirectChildren(vxmlEl, ['menu', 'form']);
  let colIndex = 0;
  let rowIndex = 0;
  const COL_WIDTH = 340;
  const ROW_HEIGHT = 260;
  const MAX_COLS = 3;

  dialogEls.forEach((el, index) => {
    const id = el.getAttribute('id') || `dialog_${index + 1}`;
    const x = 50 + colIndex * COL_WIDTH;
    const y = 50 + rowIndex * ROW_HEIGHT;

    colIndex++;
    if (colIndex >= MAX_COLS) {
      colIndex = 0;
      rowIndex++;
    }

    if (el.tagName.toLowerCase() === 'menu') {
      // Menu node
      const prompt = extractPrompt(el);
      const choices: MenuChoice[] = [];

      findAll(el, 'choice').forEach((choiceEl, cIdx) => {
        const choiceId = `c_${cIdx + 1}`;
        const dtmf = choiceEl.getAttribute('dtmf') || undefined;
        const next = choiceEl.getAttribute('next')?.replace(/^#/, '');
        const event = choiceEl.getAttribute('event') || undefined;
        const text = choiceEl.textContent?.trim() || `Option ${cIdx + 1}`;

        choices.push({
          id: choiceId,
          dtmf,
          text,
          next,
          event
        });

        if (next) {
          rawEdges.push({
            sourceDialogId: id,
            sourceHandle: `choice-${choiceId}`,
            targetDialogId: next,
            label: dtmf ? `[${dtmf}] ${text}` : text
          });
        }
      });

      const noinputEl = findFirst(el, 'noinput');
      const noinputPrompt = noinputEl ? findFirst(noinputEl, 'prompt')?.textContent?.trim() : undefined;
      const noinputGoto = noinputEl ? findFirst(noinputEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (noinputGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'noinput',
          targetDialogId: noinputGoto,
          label: 'timeout'
        });
      }

      const nomatchEl = findFirst(el, 'nomatch');
      const nomatchPrompt = nomatchEl ? findFirst(nomatchEl, 'prompt')?.textContent?.trim() : undefined;
      const nomatchGoto = nomatchEl ? findFirst(nomatchEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (nomatchGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'nomatch',
          targetDialogId: nomatchGoto,
          label: 'nomatch'
        });
      }

      const menuData: MenuNodeData = {
        label: `Menu: ${id}`,
        dialogId: id,
        scope: (el.getAttribute('scope') as 'dialog' | 'document') || 'dialog',
        dtmf: el.getAttribute('dtmf') === 'true',
        prompt,
        choices,
        noinputPrompt,
        nomatchPrompt
      };

      nodes.push({
        id,
        type: 'vxml-menu',
        position: { x, y },
        data: menuData
      });
      return;
    }

    // Inside <form>
    // Check if it's a field
    const fieldEl = findFirst(el, 'field');
    if (fieldEl) {
      const fieldName = fieldEl.getAttribute('name') || 'field';
      const typeAttr = fieldEl.getAttribute('type') || '';
      const prompt = extractPrompt(fieldEl);

      const grammarEl = findFirst(fieldEl, 'grammar');
      let customGrammar: string | undefined = undefined;
      let fieldType: string = 'digits';

      if (grammarEl) {
        fieldType = 'custom';
        customGrammar = serializeXmlNode(grammarEl);
      } else if (typeAttr) {
        fieldType = typeAttr.startsWith('boolean')
          ? 'boolean'
          : typeAttr.startsWith('number')
            ? 'number'
            : typeAttr.startsWith('currency')
              ? 'currency'
              : typeAttr.startsWith('phone')
                ? 'phone'
                : typeAttr.startsWith('time')
                  ? 'time'
                  : typeAttr.startsWith('date')
                    ? 'date'
                    : 'digits';
      }

      const filledEl = findFirst(fieldEl, 'filled');
      const filledGoto = filledEl ? findFirst(filledEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (filledGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'filled',
          targetDialogId: filledGoto,
          label: 'filled'
        });
      }

      const noinputEl = findFirst(fieldEl, 'noinput');
      const noinputPrompt = noinputEl ? findFirst(noinputEl, 'prompt')?.textContent?.trim() : undefined;
      const noinputGoto = noinputEl ? findFirst(noinputEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (noinputGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'noinput',
          targetDialogId: noinputGoto,
          label: 'timeout'
        });
      }

      const nomatchEl = findFirst(fieldEl, 'nomatch');
      const nomatchPrompt = nomatchEl ? findFirst(nomatchEl, 'prompt')?.textContent?.trim() : undefined;
      const nomatchGoto = nomatchEl ? findFirst(nomatchEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (nomatchGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'nomatch',
          targetDialogId: nomatchGoto,
          label: 'nomatch'
        });
      }

      const grammarParams = (!customGrammar && typeAttr.includes('?')) ? '?' + typeAttr.split('?')[1] : undefined;

      const fieldData: FieldNodeData = {
        label: `Field: ${fieldName}`,
        dialogId: id,
        fieldName,
        type: fieldType as any,
        customGrammar,
        grammarParams,
        prompt,
        filledNext: filledGoto,
        noinputPrompt,
        nomatchPrompt
      };

      nodes.push({
        id,
        type: 'vxml-field',
        position: { x, y },
        data: fieldData
      });
      return;
    }

    // Check if it's a transfer
    const transferEl = findFirst(el, 'transfer');
    if (transferEl) {
      const transferName = transferEl.getAttribute('name') || 'xfer';
      const dest = transferEl.getAttribute('dest') || 'tel:+18005550199';
      const bridge = transferEl.getAttribute('bridge') !== 'false';
      const connecttimeout = transferEl.getAttribute('connecttimeout') || '30s';
      const prompt = extractPrompt(transferEl);

      const filledEl = findFirst(transferEl, 'filled');
      const filledGoto = filledEl ? findFirst(filledEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (filledGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'next',
          targetDialogId: filledGoto,
          label: 'connected'
        });
      }

      const catchEl = findFirst(transferEl, 'catch');
      const errorGoto = catchEl ? findFirst(catchEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (errorGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'error',
          targetDialogId: errorGoto,
          label: 'busy/error'
        });
      }

      const transferData: TransferNodeData = {
        label: `Transfer: ${transferName}`,
        dialogId: id,
        transferName,
        dest,
        bridge,
        connecttimeout,
        prompt,
        next: filledGoto,
        errorNext: errorGoto
      };

      nodes.push({
        id,
        type: 'vxml-transfer',
        position: { x, y },
        data: transferData
      });
      return;
    }

    // Check if it's a record
    const recordEl = findFirst(el, 'record');
    if (recordEl) {
      const recordName = recordEl.getAttribute('name') || 'msg';
      const beep = recordEl.getAttribute('beep') !== 'false';
      const maxtime = recordEl.getAttribute('maxtime') || '30s';
      const dtmfterm = recordEl.getAttribute('dtmfterm') === 'true';
      const prompt = extractPrompt(recordEl);

      const filledEl = findFirst(recordEl, 'filled');
      const filledGoto = filledEl ? findFirst(filledEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (filledGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'filled',
          targetDialogId: filledGoto,
          label: 'recorded'
        });
      }

      const recData: RecordNodeData = {
        label: `Record: ${recordName}`,
        dialogId: id,
        recordName,
        beep,
        maxtime,
        dtmfterm,
        type: recordEl.getAttribute('type') || 'audio/x-wav',
        prompt,
        filledNext: filledGoto
      };

      nodes.push({
        id,
        type: 'vxml-record',
        position: { x, y },
        data: recData
      });
      return;
    }

    // Check if it's a subdialog
    const subEl = findFirst(el, 'subdialog');
    if (subEl) {
      const subName = subEl.getAttribute('name') || 'sub';
      const src = subEl.getAttribute('src') || '';
      const method = (subEl.getAttribute('method') as 'get' | 'post') || 'get';
      const namelist = subEl.getAttribute('namelist') || undefined;

      const filledEl = findFirst(subEl, 'filled');
      const filledGoto = filledEl ? findFirst(filledEl, 'goto')?.getAttribute('next')?.replace(/^#/, '') : undefined;
      if (filledGoto) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'next',
          targetDialogId: filledGoto,
          label: 'return'
        });
      }

      const subData: SubdialogNodeData = {
        label: `Subdialog: ${subName}`,
        dialogId: id,
        subdialogName: subName,
        src,
        method,
        namelist,
        next: filledGoto
      };

      nodes.push({
        id,
        type: 'vxml-subdialog',
        position: { x, y },
        data: subData
      });
      return;
    }

    // Check if it has a <block>
    const blockEl = findFirst(el, 'block');
    if (blockEl) {
      // Check for <disconnect/>
      if (findFirst(blockEl, 'disconnect')) {
        const discData: DisconnectNodeData = {
          label: `Disconnect: ${id}`,
          dialogId: id,
          prompt: extractPrompt(blockEl)
        };
        nodes.push({
          id,
          type: 'vxml-disconnect',
          position: { x, y },
          data: discData
        });
        return;
      }

      // Check for <exit/>
      const exitEl = findFirst(blockEl, 'exit');
      if (exitEl) {
        const exitData: ExitNodeData = {
          label: `Exit: ${id}`,
          dialogId: id,
          expr: exitEl.getAttribute('expr') || undefined,
          namelist: exitEl.getAttribute('namelist') || undefined
        };
        nodes.push({
          id,
          type: 'vxml-exit',
          position: { x, y },
          data: exitData
        });
        return;
      }

      // Check for VXML 2.1 <data>
      const dataEl = findFirst(blockEl, 'data');
      if (dataEl) {
        const dataName = dataEl.getAttribute('name') || 'data';
        const src = dataEl.getAttribute('src') || '';
        const method = (dataEl.getAttribute('method') as 'get' | 'post') || 'get';
        const namelist = dataEl.getAttribute('namelist') || undefined;
        const prompt = extractPrompt(blockEl);

        const gotoEl = findFirst(blockEl, 'goto');
        const nextTarget = gotoEl?.getAttribute('next')?.replace(/^#/, '');
        if (nextTarget) {
          rawEdges.push({
            sourceDialogId: id,
            sourceHandle: 'next',
            targetDialogId: nextTarget,
            label: 'done'
          });
        }

        const dataNodeData: DataNodeData = {
          label: `Data: ${dataName}`,
          dialogId: id,
          dataName,
          src,
          method,
          namelist,
          prompt,
          next: nextTarget
        };

        nodes.push({
          id,
          type: 'vxml-data',
          position: { x, y },
          data: dataNodeData
        });
        return;
      }

      // Check for <if> condition
      const ifEl = findFirst(blockEl, 'if');
      if (ifEl) {
        const condExpr = ifEl.getAttribute('cond') || 'true';
        const gotos = findAll(ifEl, 'goto');
        const trueGoto = gotos[0]?.getAttribute('next')?.replace(/^#/, '');
        const falseGoto = gotos[1]?.getAttribute('next')?.replace(/^#/, '');

        if (trueGoto) {
          rawEdges.push({
            sourceDialogId: id,
            sourceHandle: 'true',
            targetDialogId: trueGoto,
            label: 'true'
          });
        }
        if (falseGoto) {
          rawEdges.push({
            sourceDialogId: id,
            sourceHandle: 'false',
            targetDialogId: falseGoto,
            label: 'false'
          });
        }

        const condData: ConditionNodeData = {
          label: `Condition: ${id}`,
          dialogId: id,
          condition: condExpr,
          trueNext: trueGoto,
          falseNext: falseGoto
        };

        nodes.push({
          id,
          type: 'vxml-condition',
          position: { x, y },
          data: condData
        });
        return;
      }

      // Standard <block>
      const blockName = blockEl.getAttribute('name') || 'block';
      const prompt = extractPrompt(blockEl);

      const assigns: Array<{ name: string; expr: string }> = [];
      findAll(blockEl, 'assign').forEach((a) => {
        const name = a.getAttribute('name');
        const expr = a.getAttribute('expr') || "''";
        if (name) assigns.push({ name, expr });
      });

      const script = findFirst(blockEl, 'script')?.textContent?.trim();
      const gotoEl = findFirst(blockEl, 'goto');
      const nextTarget = gotoEl?.getAttribute('next')?.replace(/^#/, '');
      if (nextTarget) {
        rawEdges.push({
          sourceDialogId: id,
          sourceHandle: 'next',
          targetDialogId: nextTarget,
          label: 'next'
        });
      }

      const blockData: BlockNodeData = {
        label: `Block: ${blockName}`,
        dialogId: id,
        blockName,
        prompt,
        assigns,
        script,
        next: nextTarget
      };

      nodes.push({
        id,
        type: 'vxml-block',
        position: { x, y },
        data: blockData
      });
      return;
    }
  });

  // Map dialogId to actual node.id
  const dialogToNodeId = new Map<string, string>();
  for (const n of nodes) {
    const data = n.data as Record<string, any>;
    dialogToNodeId.set(data.dialogId || n.id, n.id);
  }

  // Build edges
  const edges: Edge[] = [];
  rawEdges.forEach((re, idx) => {
    const sourceNodeId = dialogToNodeId.get(re.sourceDialogId);
    const targetNodeId = dialogToNodeId.get(re.targetDialogId);
    if (sourceNodeId && targetNodeId) {
      edges.push({
        id: `e_${idx}_${sourceNodeId}_${targetNodeId}`,
        source: sourceNodeId,
        sourceHandle: re.sourceHandle,
        target: targetNodeId,
        label: re.label,
        type: 'smoothstep',
        animated: true
      });
    }
  });

  return { nodes, edges, settings };
}

export function getDefaultSettings(): VxmlDocSettings {
  return {
    version: '2.1',
    xmlns: 'http://www.w3.org/2001/vxml',
    xmlLang: 'en-US',
    globalVars: [
      { name: 'call_id', expr: "'CALL_' + Math.floor(Math.random()*10000)" }
    ],
    globalProperties: [
      { name: 'bargein', value: 'true' },
      { name: 'timeout', value: '5s' },
      { name: 'inputmodes', value: 'dtmf voice' }
    ],
    globalCatch: [
      {
        id: 'catch_1',
        event: 'noinput',
        prompt: 'Sorry, I did not hear anything. Please try again.'
      },
      {
        id: 'catch_2',
        event: 'nomatch',
        prompt: 'Sorry, I did not understand that. Please try again.'
      }
    ]
  };
}
