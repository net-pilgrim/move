import MenuNode from './MenuNode.svelte';
import FieldNode from './FieldNode.svelte';
import BlockNode from './BlockNode.svelte';
import DataNode from './DataNode.svelte';
import ConditionNode from './ConditionNode.svelte';
import RecordNode from './RecordNode.svelte';
import TransferNode from './TransferNode.svelte';
import SubdialogNode from './SubdialogNode.svelte';
import DisconnectNode from './DisconnectNode.svelte';
import ExitNode from './ExitNode.svelte';

export const nodeTypes = {
  'vxml-menu': MenuNode,
  'vxml-field': FieldNode,
  'vxml-block': BlockNode,
  'vxml-data': DataNode,
  'vxml-condition': ConditionNode,
  'vxml-record': RecordNode,
  'vxml-transfer': TransferNode,
  'vxml-subdialog': SubdialogNode,
  'vxml-disconnect': DisconnectNode,
  'vxml-exit': ExitNode
};

export {
  MenuNode,
  FieldNode,
  BlockNode,
  DataNode,
  ConditionNode,
  RecordNode,
  TransferNode,
  SubdialogNode,
  DisconnectNode,
  ExitNode
};
