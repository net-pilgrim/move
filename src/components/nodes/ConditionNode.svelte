<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { GitBranch, Check, X } from '@lucide/svelte';
  import type { ConditionNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: ConditionNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-68 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-amber-400 ring-2 ring-amber-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-amber-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-amber-950/70 border-b border-amber-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-amber-500/20 text-amber-300">
        <GitBranch class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-amber-100 truncate">{data.dialogId || id}</div>
        <div class="text-[10px] text-amber-400 uppercase tracking-wider font-mono">vxml:if branch</div>
      </div>
    </div>
    {#if data.isSimulatingActive}
      <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        ACTIVE
      </span>
    {/if}
  </div>

  <!-- Content -->
  <div class="p-3 space-y-2.5 text-xs">
    <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
      <div class="text-[10px] text-slate-500 font-mono">cond:</div>
      <div class="text-xs font-mono text-amber-300 truncate font-semibold">
        {data.condition || 'true'}
      </div>
    </div>

    <!-- Output Handles -->
    <div class="space-y-1.5 pt-1 border-t border-slate-800">
      <!-- True handle -->
      <div class="relative flex items-center justify-between bg-emerald-950/40 rounded-md px-2 py-1.5 border border-emerald-800/40">
        <div class="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold">
          <Check class="w-3.5 h-3.5" />
          <span>True branch</span>
        </div>
        <Handle
          id="true"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-900"
        />
      </div>

      <!-- False handle -->
      <div class="relative flex items-center justify-between bg-rose-950/40 rounded-md px-2 py-1.5 border border-rose-800/40">
        <div class="flex items-center gap-1.5 text-rose-300 text-[11px] font-semibold">
          <X class="w-3.5 h-3.5" />
          <span>&lt;else/&gt; False</span>
        </div>
        <Handle
          id="false"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-rose-400 !border-2 !border-slate-900"
        />
      </div>
    </div>
  </div>
</div>
