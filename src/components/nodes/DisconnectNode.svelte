<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { PhoneOff, Volume2 } from '@lucide/svelte';
  import type { DisconnectNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: DisconnectNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-60 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-red-400 ring-2 ring-red-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-red-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-red-950/70 border-b border-red-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-red-500/20 text-red-300">
        <PhoneOff class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-red-100 truncate">{data.dialogId || id}</div>
        <div class="text-[10px] text-red-400 uppercase tracking-wider font-mono">vxml:disconnect</div>
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
        <Volume2 class="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
        <span class="line-clamp-2 italic leading-relaxed">"{data.prompt.text}"</span>
      </div>
    {/if}

    <div class="text-[11px] text-red-400/80 italic text-center font-mono py-1">
      &lt;disconnect/&gt; Terminates Call
    </div>
  </div>
</div>
