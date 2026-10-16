<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { Database, Globe, ArrowRight, Sparkles } from '@lucide/svelte';
  import type { DataNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: DataNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-68 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-purple-400 ring-2 ring-purple-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-purple-950/70 border-b border-purple-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-purple-500/20 text-purple-300">
        <Database class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-purple-100 truncate">{data.dataName || data.dialogId || id}</div>
        <div class="text-[10px] text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1">
          <span>vxml 2.1:data</span>
          <Sparkles class="w-2.5 h-2.5 text-amber-400" />
        </div>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      {#if data.isSimulatingActive}
        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      {/if}
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-300 font-mono font-bold uppercase border border-purple-700/50">
        {data.method || 'GET'}
      </span>
    </div>
  </div>

  <!-- Content -->
  <div class="p-3 space-y-2 text-xs">
    <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
      <div class="flex items-center gap-1 text-[11px] text-purple-300 truncate">
        <Globe class="w-3.5 h-3.5 shrink-0" />
        <span class="truncate font-mono">{data.src || '/api/endpoint'}</span>
      </div>
      {#if data.namelist}
        <div class="text-[10px] text-slate-400 font-mono truncate">
          namelist="{data.namelist}"
        </div>
      {/if}
    </div>

    <!-- Output Handle -->
    <div class="relative flex items-center justify-between bg-purple-950/40 rounded-md px-2 py-1.5 border border-purple-800/40 mt-1">
      <span class="text-purple-300 text-[11px] font-medium flex items-center gap-1">
        <span>&lt;goto&gt; next</span>
        <ArrowRight class="w-3 h-3 text-purple-400" />
      </span>
      <Handle
        id="next"
        type="source"
        position={Position.Right}
        class="!w-2.5 !h-2.5 !bg-purple-400 !border-2 !border-slate-900"
      />
    </div>
  </div>
</div>
