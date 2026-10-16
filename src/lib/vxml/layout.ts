import type { Node, Edge } from '@xyflow/svelte';

export function autoLayoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  // Build adjacency list and in-degree map
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of edges) {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  }

  // BFS layering
  const queue: Array<{ id: string; layer: number }> = [];
  const layers = new Map<string, number>();

  // Find root nodes (in-degree == 0)
  for (const n of nodes) {
    if (inDegree.get(n.id) === 0) {
      queue.push({ id: n.id, layer: 0 });
      layers.set(n.id, 0);
    }
  }

  // If cycle or no in-degree 0, pick the first node
  if (queue.length === 0 && nodes.length > 0) {
    queue.push({ id: nodes[0].id, layer: 0 });
    layers.set(nodes[0].id, 0);
  }

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!;
    const neighbors = adj.get(id) || [];
    for (const neighbor of neighbors) {
      const currentLayer = layers.get(neighbor);
      if (currentLayer === undefined || currentLayer < layer + 1) {
        layers.set(neighbor, layer + 1);
        queue.push({ id: neighbor, layer: layer + 1 });
      }
    }
  }

  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  for (const n of nodes) {
    const layer = layers.get(n.id) ?? 0;
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(n.id);
  }

  // Calculate coordinates
  const X_SPACING = 380;
  const Y_SPACING = 270;
  const X_OFFSET = 60;
  const Y_OFFSET = 80;

  const nodeMap = new Map<string, Node>();
  for (const n of nodes) {
    nodeMap.set(n.id, { ...n });
  }

  const sortedLayers = Array.from(layerGroups.keys()).sort((a, b) => a - b);
  for (const l of sortedLayers) {
    const group = layerGroups.get(l)!;
    group.forEach((nodeId, rowIdx) => {
      const targetNode = nodeMap.get(nodeId);
      if (targetNode) {
        targetNode.position = {
          x: X_OFFSET + l * X_SPACING,
          y: Y_OFFSET + rowIdx * Y_SPACING
        };
      }
    });
  }

  return Array.from(nodeMap.values());
}
