<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { Mic, Volume2, Clock, CheckCircle2 } from '@lucide/svelte';
  import type { RecordNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: RecordNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-68 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-fuchsia-400 ring-2 ring-fuchsia-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-fuchsia-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-fuchsia-950/70 border-b border-fuchsia-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-fuchsia-500/20 text-fuchsia-300">
        <Mic class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-fuchsia-100 truncate">{data.recordName || data.dialogId || id}</div>
        <div class="text-[10px] text-fuchsia-400 uppercase tracking-wider font-mono">vxml:record</div>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      {#if data.isSimulatingActive}
        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      {/if}
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-900/80 text-fuchsia-300 font-mono border border-fuchsia-700/50">
        {data.maxtime || '30s'}
      </span>
    </div>
  </div>

  <!-- Content -->
  <div class="p-3 space-y-2 text-xs">
    {#if data.prompt?.text}
      <div class="flex items-start gap-1.5 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
        <Volume2 class="w-3.5 h-3.5 text-fuchsia-400 mt-0.5 shrink-0" />
        <span class="line-clamp-2 italic leading-relaxed">"{data.prompt.text}"</span>
      </div>
    {/if}

    <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
      <span>beep: {data.beep ? 'true' : 'false'}</span>
      <span>•</span>
      <span>dtmfterm: {data.dtmfterm ? 'true' : 'false'}</span>
    </div>

    <!-- Output Handles -->
    <div class="space-y-1.5 pt-1 border-t border-slate-800">
      <div class="relative flex items-center justify-between bg-fuchsia-950/40 rounded-md px-2 py-1 border border-fuchsia-800/40">
        <div class="flex items-center gap-1.5 text-fuchsia-300 text-[11px] font-medium">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>&lt;filled&gt; recorded</span>
        </div>
        <Handle
          id="filled"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-fuchsia-400 !border-2 !border-slate-900"
        />
      </div>

      <div class="relative flex items-center justify-between bg-slate-800/50 rounded-md px-2 py-1 border border-slate-700/40">
        <div class="flex items-center gap-1.5 text-amber-300 text-[11px]">
          <Clock class="w-3.5 h-3.5" />
          <span>&lt;noinput&gt; timeout</span>
        </div>
        <Handle
          id="noinput"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-slate-900"
        />
      </div>
    </div>
  </div>
</div>
