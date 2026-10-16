<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { LogOut } from '@lucide/svelte';
  import type { ExitNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: ExitNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-56 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-zinc-400 ring-2 ring-zinc-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-zinc-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-zinc-900 border-b border-zinc-800 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-zinc-700 text-zinc-300">
        <LogOut class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-zinc-100 truncate">{data.dialogId || id}</div>
        <div class="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">vxml:exit</div>
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
  <div class="p-3 text-xs space-y-1">
    {#if data.expr}
      <div class="text-[11px] text-zinc-400 font-mono truncate">
        expr="{data.expr}"
      </div>
    {/if}
    {#if data.namelist}
      <div class="text-[11px] text-zinc-400 font-mono truncate">
        namelist="{data.namelist}"
      </div>
    {/if}
    <div class="text-[11px] text-zinc-500 italic text-center font-mono py-1">
      &lt;exit/&gt; Exits Interpreter
    </div>
  </div>
</div>
