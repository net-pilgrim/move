import type { Node, Edge } from '@xyflow/svelte';
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
  PromptConfig
} from '../../types/vxml';

function escapeXml(unsafe: string = ''): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderPrompt(prompt?: PromptConfig, indent: string = '    '): string {
  if (!prompt || (!prompt.text && !prompt.audio)) return '';
  const attrs: string[] = [];
  if (prompt.bargein !== undefined) attrs.push(`bargein="${prompt.bargein}"`);
  if (prompt.timeout) attrs.push(`timeout="${escapeXml(prompt.timeout)}"`);
  if (prompt.count) attrs.push(`count="${prompt.count}"`);

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  if (prompt.audio) {
    if (prompt.text) {
      return `${indent}<prompt${attrStr}>\n${indent}  <audio src="${escapeXml(prompt.audio)}">${escapeXml(prompt.text)}</audio>\n${indent}</prompt>`;
    }
    return `${indent}<prompt${attrStr}><audio src="${escapeXml(prompt.audio)}"/></prompt>`;
  }

  return `${indent}<prompt${attrStr}>${escapeXml(prompt.text)}</prompt>`;
}

export function generateVxml(
  nodes: Node[],
  edges: Edge[],
  settings: VxmlDocSettings
): string {
  // Build a map of nodeId -> dialogId
  const nodeDialogMap = new Map<string, string>();
  for (const node of nodes) {
    const data = node.data as Record<string, any>;
    const dialogId = data?.dialogId || node.id;
    nodeDialogMap.set(node.id, dialogId);
  }

  // Helper to find target dialog id for a specific edge sourceHandle
  const findTargetDialog = (sourceNodeId: string, handleId?: string): string | undefined => {
    const edge = edges.find(
      (e) => e.source === sourceNodeId && (handleId ? e.sourceHandle === handleId : true)
    );
    if (!edge) return undefined;
    return nodeDialogMap.get(edge.target);
  };

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');

  // Root <vxml> tag
  const rootAttrs = [
    `version="${settings.version || '2.1'}"`,
    `xmlns="${settings.xmlns || 'http://www.w3.org/2001/vxml'}"`,
    `xml:lang="${escapeXml(settings.xmlLang || 'en-US')}"`
  ];
  if (settings.application) {
    rootAttrs.push(`application="${escapeXml(settings.application)}"`);
  }
  lines.push(`<vxml ${rootAttrs.join(' ')}>`);

  // Document-level Properties
  if (settings.globalProperties && settings.globalProperties.length > 0) {
    for (const prop of settings.globalProperties) {
      if (prop.name && prop.value) {
        lines.push(`  <property name="${escapeXml(prop.name)}" value="${escapeXml(prop.value)}"/>`);
      }
    }
  }

  // Document-level Variables
  if (settings.globalVars && settings.globalVars.length > 0) {
    for (const v of settings.globalVars) {
      if (v.name) {
        if (v.expr) {
          lines.push(`  <var name="${escapeXml(v.name)}" expr="${escapeXml(v.expr)}"/>`);
        } else {
          lines.push(`  <var name="${escapeXml(v.name)}"/>`);
        }
      }
    }
  }

  // Document-level Scripts
  if (settings.globalScript && settings.globalScript.trim()) {
    lines.push('  <script><![CDATA[');
    lines.push(`    ${settings.globalScript.trim()}`);
    lines.push('  ]]></script>');
  }

  // Document-level Event Catches
  if (settings.globalCatch && settings.globalCatch.length > 0) {
    for (const c of settings.globalCatch) {
      if (c.event) {
        lines.push(`  <catch event="${escapeXml(c.event)}">`);
        if (c.prompt) {
          lines.push(`    <prompt>${escapeXml(c.prompt)}</prompt>`);
        }
        if (c.next) {
          const nextTarget = c.next.startsWith('#') ? c.next : `#${c.next}`;
          lines.push(`    <goto next="${escapeXml(nextTarget)}"/>`);
        }
        lines.push('  </catch>');
      }
    }
  }

  // Render each Dialog Node
  for (const node of nodes) {
    const d = node.data as Record<string, any>;
    const dialogId = d.dialogId || node.id;

    switch (node.type) {
      case 'vxml-menu': {
        const menu = d as MenuNodeData;
        const dtmfAttr = menu.dtmf ? ' dtmf="true"' : '';
        const scopeAttr = menu.scope ? ` scope="${menu.scope}"` : '';
        lines.push(`\n  <!-- Menu: ${dialogId} -->`);
        lines.push(`  <menu id="${escapeXml(dialogId)}"${dtmfAttr}${scopeAttr}>`);

        const p = renderPrompt(menu.prompt, '    ');
        if (p) lines.push(p);

        // Choices
        if (menu.choices && menu.choices.length > 0) {
          for (const choice of menu.choices) {
            // Check if there is an edge connected to choice-${choice.id}
            const connectedTarget = findTargetDialog(node.id, `choice-${choice.id}`);
            const nextTarget = connectedTarget
              ? `#${connectedTarget}`
              : choice.next
                ? choice.next.startsWith('#')
                  ? choice.next
                  : `#${choice.next}`
                : undefined;

            const cAttrs: string[] = [];
            if (choice.dtmf) cAttrs.push(`dtmf="${escapeXml(choice.dtmf)}"`);
            if (nextTarget) cAttrs.push(`next="${escapeXml(nextTarget)}"`);
            if (choice.event) cAttrs.push(`event="${escapeXml(choice.event)}"`);
            if (choice.message) cAttrs.push(`message="${escapeXml(choice.message)}"`);

            const attrStr = cAttrs.length > 0 ? ' ' + cAttrs.join(' ') : '';
            lines.push(`    <choice${attrStr}>${escapeXml(choice.text)}</choice>`);
          }
        }

        // Noinput & Nomatch
        const noinputTarget = findTargetDialog(node.id, 'noinput');
        if (menu.noinputPrompt || noinputTarget) {
          lines.push('    <noinput>');
          if (menu.noinputPrompt) lines.push(`      <prompt>${escapeXml(menu.noinputPrompt)}</prompt>`);
          if (noinputTarget) lines.push(`      <goto next="#${escapeXml(noinputTarget)}"/>`);
          lines.push('    </noinput>');
        }

        const nomatchTarget = findTargetDialog(node.id, 'nomatch');
        if (menu.nomatchPrompt || nomatchTarget) {
          lines.push('    <nomatch>');
          if (menu.nomatchPrompt) lines.push(`      <prompt>${escapeXml(menu.nomatchPrompt)}</prompt>`);
          if (nomatchTarget) lines.push(`      <goto next="#${escapeXml(nomatchTarget)}"/>`);
          lines.push('    </nomatch>');
        }

        lines.push('  </menu>');
        break;
      }

      case 'vxml-field': {
        const field = d as FieldNodeData;
        const fieldName = field.fieldName || 'field_' + node.id;
        lines.push(`\n  <!-- Form Field: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);

        const fieldAttrs: string[] = [`name="${escapeXml(fieldName)}"`];
        if (field.type && field.type !== 'custom') {
          fieldAttrs.push(`type="${field.type}${field.grammarParams || ''}"`);
        }
        lines.push(`    <field ${fieldAttrs.join(' ')}>`);

        const p = renderPrompt(field.prompt, '      ');
        if (p) lines.push(p);

        if (field.type === 'custom' && field.customGrammar) {
          lines.push(`      <grammar type="application/srgs+xml" root="ROOT" version="1.0">`);
          lines.push(`        ${field.customGrammar.trim()}`);
          lines.push(`      </grammar>`);
        }

        // Filled handler
        const filledTarget = findTargetDialog(node.id, 'filled') || (field.filledNext ? field.filledNext.replace(/^#/, '') : undefined);
        lines.push('      <filled>');
        if (field.filledVar && field.filledExpr) {
          lines.push(`        <assign name="${escapeXml(field.filledVar)}" expr="${escapeXml(field.filledExpr)}"/>`);
        }
        if (filledTarget) {
          lines.push(`        <goto next="#${escapeXml(filledTarget)}"/>`);
        }
        lines.push('      </filled>');

        // Noinput handler
        const noinputTarget = findTargetDialog(node.id, 'noinput') || (field.noinputNext ? field.noinputNext.replace(/^#/, '') : undefined);
        if (field.noinputPrompt || noinputTarget) {
          lines.push('      <noinput>');
          if (field.noinputPrompt) lines.push(`        <prompt>${escapeXml(field.noinputPrompt)}</prompt>`);
          if (noinputTarget) lines.push(`        <goto next="#${escapeXml(noinputTarget)}"/>`);
          lines.push('      </noinput>');
        }

        // Nomatch handler
        const nomatchTarget = findTargetDialog(node.id, 'nomatch') || (field.nomatchNext ? field.nomatchNext.replace(/^#/, '') : undefined);
        if (field.nomatchPrompt || nomatchTarget) {
          lines.push('      <nomatch>');
          if (field.nomatchPrompt) lines.push(`        <prompt>${escapeXml(field.nomatchPrompt)}</prompt>`);
          if (nomatchTarget) lines.push(`        <goto next="#${escapeXml(nomatchTarget)}"/>`);
          lines.push('      </nomatch>');
        }

        lines.push('    </field>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-block': {
        const block = d as BlockNodeData;
        const blockName = block.blockName || 'init';
        lines.push(`\n  <!-- Block: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);
        lines.push(`    <block name="${escapeXml(blockName)}">`);

        const p = renderPrompt(block.prompt, '      ');
        if (p) lines.push(p);

        if (block.assigns && block.assigns.length > 0) {
          for (const a of block.assigns) {
            if (a.name) {
              lines.push(`      <assign name="${escapeXml(a.name)}" expr="${escapeXml(a.expr || "''")}"/>`);
            }
          }
        }

        if (block.script && block.script.trim()) {
          lines.push('      <script><![CDATA[');
          lines.push(`        ${block.script.trim()}`);
          lines.push('      ]]></script>');
        }

        const nextTarget = findTargetDialog(node.id, 'next') || (block.next ? block.next.replace(/^#/, '') : undefined);
        if (nextTarget) {
          lines.push(`      <goto next="#${escapeXml(nextTarget)}"/>`);
        }

        lines.push('    </block>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-data': {
        // VXML 2.1 <data> element
        const dataNode = d as DataNodeData;
        const dataName = dataNode.dataName || 'res';
        lines.push(`\n  <!-- VXML 2.1 Data Fetch: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);
        lines.push('    <block>');

        const p = renderPrompt(dataNode.prompt, '      ');
        if (p) lines.push(p);

        const dataAttrs: string[] = [
          `name="${escapeXml(dataName)}"`,
          `src="${escapeXml(dataNode.src || '/api/data')}"`,
          `method="${dataNode.method || 'get'}"`
        ];
        if (dataNode.namelist) {
          dataAttrs.push(`namelist="${escapeXml(dataNode.namelist)}"`);
        }
        lines.push(`      <data ${dataAttrs.join(' ')}/>`);

        const nextTarget = findTargetDialog(node.id, 'next') || (dataNode.next ? dataNode.next.replace(/^#/, '') : undefined);
        if (nextTarget) {
          lines.push(`      <goto next="#${escapeXml(nextTarget)}"/>`);
        }

        lines.push('    </block>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-condition': {
        const cond = d as ConditionNodeData;
        const expr = cond.condition || 'true';
        const trueTarget = findTargetDialog(node.id, 'true') || (cond.trueNext ? cond.trueNext.replace(/^#/, '') : undefined);
        const falseTarget = findTargetDialog(node.id, 'false') || (cond.falseNext ? cond.falseNext.replace(/^#/, '') : undefined);

        lines.push(`\n  <!-- Branch: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);
        lines.push('    <block>');
        lines.push(`      <if cond="${escapeXml(expr)}">`);
        if (cond.truePrompt) {
          lines.push(`        <prompt>${escapeXml(cond.truePrompt)}</prompt>`);
        }
        if (trueTarget) {
          lines.push(`        <goto next="#${escapeXml(trueTarget)}"/>`);
        }
        lines.push('      <else/>');
        if (cond.falsePrompt) {
          lines.push(`        <prompt>${escapeXml(cond.falsePrompt)}</prompt>`);
        }
        if (falseTarget) {
          lines.push(`        <goto next="#${escapeXml(falseTarget)}"/>`);
        }
        lines.push('      </if>');
        lines.push('    </block>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-record': {
        const rec = d as RecordNodeData;
        const recordName = rec.recordName || 'msg';
        lines.push(`\n  <!-- Audio Record: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);

        const recAttrs: string[] = [
          `name="${escapeXml(recordName)}"`,
          `beep="${rec.beep ? 'true' : 'false'}"`,
          `maxtime="${escapeXml(rec.maxtime || '30s')}"`,
          `dtmfterm="${rec.dtmfterm ? 'true' : 'false'}"`,
          `type="${escapeXml(rec.type || 'audio/x-wav')}"`
        ];
        lines.push(`    <record ${recAttrs.join(' ')}>`);

        const p = renderPrompt(rec.prompt, '      ');
        if (p) lines.push(p);

        const filledTarget = findTargetDialog(node.id, 'filled') || (rec.filledNext ? rec.filledNext.replace(/^#/, '') : undefined);
        if (filledTarget) {
          lines.push('      <filled>');
          lines.push(`        <goto next="#${escapeXml(filledTarget)}"/>`);
          lines.push('      </filled>');
        }

        const noinputTarget = findTargetDialog(node.id, 'noinput') || (rec.noinputNext ? rec.noinputNext.replace(/^#/, '') : undefined);
        if (noinputTarget) {
          lines.push('      <noinput>');
          lines.push(`        <goto next="#${escapeXml(noinputTarget)}"/>`);
          lines.push('      </noinput>');
        }

        lines.push('    </record>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-transfer': {
        const tr = d as TransferNodeData;
        const transferName = tr.transferName || 'xfer';
        lines.push(`\n  <!-- Transfer: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);

        const trAttrs: string[] = [
          `name="${escapeXml(transferName)}"`,
          `dest="${escapeXml(tr.dest || 'tel:+18005550199')}"`,
          `bridge="${tr.bridge ? 'true' : 'false'}"`,
          `connecttimeout="${escapeXml(tr.connecttimeout || '30s')}"`
        ];
        lines.push(`    <transfer ${trAttrs.join(' ')}>`);

        const p = renderPrompt(tr.prompt, '      ');
        if (p) lines.push(p);

        const filledTarget = findTargetDialog(node.id, 'next') || (tr.next ? tr.next.replace(/^#/, '') : undefined);
        if (filledTarget) {
          lines.push('      <filled>');
          lines.push(`        <goto next="#${escapeXml(filledTarget)}"/>`);
          lines.push('      </filled>');
        }

        const errorTarget = findTargetDialog(node.id, 'error') || (tr.errorNext ? tr.errorNext.replace(/^#/, '') : undefined);
        if (errorTarget) {
          lines.push('      <catch event="error.telephony">');
          lines.push(`        <goto next="#${escapeXml(errorTarget)}"/>`);
          lines.push('      </catch>');
        }

        lines.push('    </transfer>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-subdialog': {
        const sub = d as SubdialogNodeData;
        const subName = sub.subdialogName || 'sub';
        lines.push(`\n  <!-- Subdialog: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);

        const subAttrs: string[] = [
          `name="${escapeXml(subName)}"`,
          `src="${escapeXml(sub.src || 'subdialog.vxml')}"`,
          `method="${sub.method || 'get'}"`
        ];
        if (sub.namelist) {
          subAttrs.push(`namelist="${escapeXml(sub.namelist)}"`);
        }
        lines.push(`    <subdialog ${subAttrs.join(' ')}>`);

        if (sub.params && sub.params.length > 0) {
          for (const param of sub.params) {
            if (param.name) {
              lines.push(`      <param name="${escapeXml(param.name)}" expr="${escapeXml(param.expr || "''")}"/>`);
            }
          }
        }

        const nextTarget = findTargetDialog(node.id, 'next') || (sub.next ? sub.next.replace(/^#/, '') : undefined);
        if (nextTarget) {
          lines.push('      <filled>');
          lines.push(`        <goto next="#${escapeXml(nextTarget)}"/>`);
          lines.push('      </filled>');
        }

        lines.push('    </subdialog>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-disconnect': {
        const disc = d as DisconnectNodeData;
        lines.push(`\n  <!-- Disconnect: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);
        lines.push('    <block>');
        const p = renderPrompt(disc.prompt, '      ');
        if (p) lines.push(p);
        lines.push('      <disconnect/>');
        lines.push('    </block>');
        lines.push('  </form>');
        break;
      }

      case 'vxml-exit': {
        const ext = d as ExitNodeData;
        lines.push(`\n  <!-- Exit: ${dialogId} -->`);
        lines.push(`  <form id="${escapeXml(dialogId)}">`);
        lines.push('    <block>');
        const exitAttrs: string[] = [];
        if (ext.expr) exitAttrs.push(`expr="${escapeXml(ext.expr)}"`);
        if (ext.namelist) exitAttrs.push(`namelist="${escapeXml(ext.namelist)}"`);
        const attrStr = exitAttrs.length > 0 ? ' ' + exitAttrs.join(' ') : '';
        lines.push(`      <exit${attrStr}/>`);
        lines.push('    </block>');
        lines.push('  </form>');
        break;
      }
    }
  }

  lines.push('\n</vxml>');
  return lines.join('\n');
}
