<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { ExternalLink, ArrowRight } from '@lucide/svelte';
  import type { SubdialogNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: SubdialogNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-64 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-cyan-400 ring-2 ring-cyan-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-cyan-950/70 border-b border-cyan-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-cyan-500/20 text-cyan-300">
        <ExternalLink class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-cyan-100 truncate">{data.subdialogName || data.dialogId || id}</div>
        <div class="text-[10px] text-cyan-400 uppercase tracking-wider font-mono">vxml:subdialog</div>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      {#if data.isSimulatingActive}
        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      {/if}
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-300 font-mono uppercase border border-cyan-700/50">
        {data.method || 'get'}
      </span>
    </div>
  </div>

  <!-- Content -->
  <div class="p-3 space-y-2 text-xs">
    <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
      <div class="text-[10px] text-slate-500 font-mono">src:</div>
      <div class="text-xs font-mono text-cyan-300 truncate">
        {data.src || 'subdialog.vxml'}
      </div>
    </div>

    <!-- Output Handle -->
    <div class="relative flex items-center justify-between bg-cyan-950/40 rounded-md px-2 py-1.5 border border-cyan-800/40 mt-1">
      <span class="text-cyan-300 text-[11px] font-medium flex items-center gap-1">
        <span>&lt;filled&gt; return</span>
        <ArrowRight class="w-3 h-3 text-cyan-400" />
      </span>
      <Handle
        id="next"
        type="source"
        position={Position.Right}
        class="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-900"
      />
    </div>
  </div>
</div>
