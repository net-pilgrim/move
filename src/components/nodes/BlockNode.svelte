<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { SquarePlay, Volume2, ArrowRight, Code } from '@lucide/svelte';
  import type { BlockNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: BlockNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-64 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-sky-400 ring-2 ring-sky-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-sky-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-sky-950/70 border-b border-sky-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-sky-500/20 text-sky-300">
        <SquarePlay class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-sky-100 truncate">{data.blockName || data.dialogId || id}</div>
        <div class="text-[10px] text-sky-400 uppercase tracking-wider font-mono">vxml:block</div>
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
  <div class="p-3 space-y-2 text-xs">
    {#if data.prompt?.text}
      <div class="flex items-start gap-1.5 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
        <Volume2 class="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
        <span class="line-clamp-2 italic leading-relaxed">"{data.prompt.text}"</span>
      </div>
    {/if}

    {#if data.assigns && data.assigns.length > 0}
      <div class="text-[11px] text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-800 font-mono space-y-0.5">
        {#each data.assigns.slice(0, 2) as a}
          <div class="truncate text-sky-300/90">&lt;assign {a.name} = {a.expr}&gt;</div>
        {/each}
        {#if data.assigns.length > 2}
          <div class="text-[10px] text-slate-500">+{data.assigns.length - 2} more...</div>
        {/if}
      </div>
    {/if}

    {#if data.script}
      <div class="flex items-center gap-1 text-[11px] text-slate-400">
        <Code class="w-3 h-3 text-sky-400" />
        <span>Inline script</span>
      </div>
    {/if}

    <!-- Output Handle -->
    <div class="relative flex items-center justify-between bg-sky-950/40 rounded-md px-2 py-1.5 border border-sky-800/40 mt-1">
      <span class="text-sky-300 text-[11px] font-medium flex items-center gap-1">
        <span>&lt;goto&gt; transition</span>
        <ArrowRight class="w-3 h-3 text-sky-400" />
      </span>
      <Handle
        id="next"
        type="source"
        position={Position.Right}
        class="!w-2.5 !h-2.5 !bg-sky-400 !border-2 !border-slate-900"
      />
    </div>
  </div>
</div>
