import type { Node, Edge } from '@xyflow/svelte';
import type { DiagnosticItem, VxmlDocSettings } from '../../types/vxml';

export function validateVxml(
  nodes: Node[],
  edges: Edge[],
  settings: VxmlDocSettings
): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];

  // Check 1: Root document checks
  if (settings.version !== '2.1') {
    diagnostics.push({
      id: 'doc-version',
      severity: 'warning',
      message: `Document version is set to "${settings.version}". W3C VoiceXML 2.1 recommendation specifies version="2.1".`,
      specReference: 'VXML 2.1 §1.4'
    });
  }

  if (nodes.length === 0) {
    diagnostics.push({
      id: 'doc-empty',
      severity: 'error',
      message: 'A VoiceXML document must contain at least one dialog element (<form> or <menu>).',
      specReference: 'VXML 2.1 §2.1'
    });
    return diagnostics;
  }

  // Check 2: Unique Dialog IDs
  const idCounts = new Map<string, number>();
  const allDialogIds = new Set<string>();

  for (const node of nodes) {
    const data = node.data as Record<string, any>;
    const dialogId = data?.dialogId || node.id;

    if (!dialogId || dialogId.trim() === '') {
      diagnostics.push({
        id: `node-empty-id-${node.id}`,
        severity: 'error',
        nodeId: node.id,
        message: 'Dialog element is missing a required "id" attribute.',
        specReference: 'VXML 2.1 §2.1'
      });
    } else {
      if (/\s/.test(dialogId)) {
        diagnostics.push({
          id: `node-invalid-id-${node.id}`,
          severity: 'error',
          nodeId: node.id,
          message: `Dialog id "${dialogId}" is invalid: must be an XML NMTOKEN (cannot contain spaces).`,
          specReference: 'XML 1.0 NMTOKEN'
        });
      }
      idCounts.set(dialogId, (idCounts.get(dialogId) || 0) + 1);
      allDialogIds.add(dialogId);
    }
  }

  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      diagnostics.push({
        id: `duplicate-id-${id}`,
        severity: 'error',
        message: `Duplicate dialog id "${id}" found ${count} times. Dialog IDs must be globally unique within the document.`,
        specReference: 'VXML 2.1 §2.1.1'
      });
    }
  }

  // Check 3: Individual Node Rules
  for (const node of nodes) {
    const d = node.data as Record<string, any>;
    const dialogId = d.dialogId || node.id;

    switch (node.type) {
      case 'vxml-menu': {
        if (!d.prompt?.text && !d.prompt?.audio) {
          diagnostics.push({
            id: `menu-no-prompt-${node.id}`,
            severity: 'warning',
            nodeId: node.id,
            message: `Menu "${dialogId}" has no prompt defined. Callers will hear silence upon entering.`,
            specReference: 'VXML 2.1 §2.2'
          });
        }
        if (!d.choices || d.choices.length === 0) {
          diagnostics.push({
            id: `menu-no-choices-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Menu "${dialogId}" must contain at least one <choice> element.`,
            specReference: 'VXML 2.1 §2.2'
          });
        } else {
          // Check for duplicate DTMF keys
          const dtmfSet = new Set<string>();
          for (const choice of d.choices) {
            if (choice.dtmf) {
              if (dtmfSet.has(choice.dtmf)) {
                diagnostics.push({
                  id: `menu-dup-dtmf-${node.id}-${choice.dtmf}`,
                  severity: 'error',
                  nodeId: node.id,
                  message: `Menu "${dialogId}" has multiple choices bound to DTMF key "${choice.dtmf}".`,
                  specReference: 'VXML 2.1 §2.2'
                });
              }
              dtmfSet.add(choice.dtmf);
            }
          }
        }
        break;
      }

      case 'vxml-field': {
        if (!d.fieldName || d.fieldName.trim() === '') {
          diagnostics.push({
            id: `field-no-name-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Form field in "${dialogId}" is missing a required "name" attribute.`,
            specReference: 'VXML 2.1 §2.3.1'
          });
        }
        if (!d.prompt?.text && !d.prompt?.audio) {
          diagnostics.push({
            id: `field-no-prompt-${node.id}`,
            severity: 'warning',
            nodeId: node.id,
            message: `Field in "${dialogId}" has no prompt. Callers won't know what input to provide.`,
            specReference: 'VXML 2.1 §2.3.1'
          });
        }
        if (d.type === 'custom' && (!d.customGrammar || d.customGrammar.trim() === '')) {
          diagnostics.push({
            id: `field-custom-grammar-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Field in "${dialogId}" is set to custom grammar but has no SRGS grammar specification.`,
            specReference: 'VXML 2.1 §2.3.1'
          });
        }
        break;
      }

      case 'vxml-data': {
        if (!d.src || d.src.trim() === '') {
          diagnostics.push({
            id: `data-no-src-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `VXML 2.1 <data> element in "${dialogId}" requires a valid "src" URI attribute.`,
            specReference: 'VXML 2.1 §6.2'
          });
        }
        if (!d.dataName || d.dataName.trim() === '') {
          diagnostics.push({
            id: `data-no-name-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `VXML 2.1 <data> element in "${dialogId}" requires a "name" attribute to store response DOM.`,
            specReference: 'VXML 2.1 §6.2'
          });
        }
        break;
      }

      case 'vxml-transfer': {
        if (!d.dest || d.dest.trim() === '') {
          diagnostics.push({
            id: `transfer-no-dest-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Transfer in "${dialogId}" is missing a destination URI ("dest" attribute).`,
            specReference: 'VXML 2.1 §2.3.7'
          });
        } else if (!d.dest.startsWith('tel:') && !d.dest.startsWith('sip:')) {
          diagnostics.push({
            id: `transfer-dest-format-${node.id}`,
            severity: 'info',
            nodeId: node.id,
            message: `Transfer destination "${d.dest}" typically should start with "tel:" or "sip:".`,
            specReference: 'VXML 2.1 §2.3.7'
          });
        }
        break;
      }

      case 'vxml-record': {
        if (!d.recordName || d.recordName.trim() === '') {
          diagnostics.push({
            id: `record-no-name-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Audio record in "${dialogId}" requires a "name" attribute.`,
            specReference: 'VXML 2.1 §2.3.6'
          });
        }
        break;
      }

      case 'vxml-condition': {
        if (!d.condition || d.condition.trim() === '') {
          diagnostics.push({
            id: `cond-empty-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Condition block in "${dialogId}" is missing an expression ("cond" attribute).`,
            specReference: 'VXML 2.1 §5.3.3'
          });
        }
        break;
      }

      case 'vxml-subdialog': {
        if (!d.src || d.src.trim() === '') {
          diagnostics.push({
            id: `subdialog-no-src-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Subdialog in "${dialogId}" is missing a "src" attribute.`,
            specReference: 'VXML 2.1 §2.3.4'
          });
        }
        break;
      }
    }
  }

  // Check 4: Edges target existence
  for (const edge of edges) {
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!targetNode) {
      diagnostics.push({
        id: `broken-edge-${edge.id}`,
        severity: 'error',
        message: `Edge "${edge.id}" points to a nonexistent target node "${edge.target}".`,
        specReference: 'VXML 2.1 §5.3.1'
      });
    }
  }

  return diagnostics;
}
