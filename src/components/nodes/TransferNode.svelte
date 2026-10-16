<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { PhoneForwarded, Volume2, ArrowRight, AlertTriangle } from '@lucide/svelte';
  import type { TransferNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: TransferNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-68 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-rose-400 ring-2 ring-rose-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-rose-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-rose-950/70 border-b border-rose-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-rose-500/20 text-rose-300">
        <PhoneForwarded class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-rose-100 truncate">{data.transferName || data.dialogId || id}</div>
        <div class="text-[10px] text-rose-400 uppercase tracking-wider font-mono">vxml:transfer</div>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      {#if data.isSimulatingActive}
        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      {/if}
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-300 font-mono border border-rose-700/50">
        {data.bridge ? 'bridge' : 'blind'}
      </span>
    </div>
  </div>

  <!-- Content -->
  <div class="p-3 space-y-2 text-xs">
    <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800 space-y-1">
      <div class="text-[10px] text-slate-500 font-mono">dest:</div>
      <div class="text-xs font-mono text-rose-300 truncate font-semibold">
        {data.dest || 'tel:+18005550199'}
      </div>
    </div>

    {#if data.prompt?.text}
      <div class="flex items-start gap-1.5 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
        <Volume2 class="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
        <span class="line-clamp-2 italic leading-relaxed">"{data.prompt.text}"</span>
      </div>
    {/if}

    <!-- Output Handles -->
    <div class="space-y-1.5 pt-1 border-t border-slate-800">
      <div class="relative flex items-center justify-between bg-rose-950/40 rounded-md px-2 py-1.5 border border-rose-800/40">
        <span class="text-rose-300 text-[11px] font-medium flex items-center gap-1">
          <span>&lt;filled&gt; done</span>
          <ArrowRight class="w-3 h-3 text-rose-400" />
        </span>
        <Handle
          id="next"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-rose-400 !border-2 !border-slate-900"
        />
      </div>

      <div class="relative flex items-center justify-between bg-slate-800/50 rounded-md px-2 py-1 border border-slate-700/40">
        <div class="flex items-center gap-1.5 text-amber-300 text-[11px]">
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>error.telephony</span>
        </div>
        <Handle
          id="error"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-slate-900"
        />
      </div>
    </div>
  </div>
</div>
