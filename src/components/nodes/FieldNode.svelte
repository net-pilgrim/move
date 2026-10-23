<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { Hash, Volume2, CheckCircle2, Clock, AlertTriangle, Sparkles } from '@lucide/svelte';
  import type { FieldNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: FieldNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-72 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-emerald-400 ring-2 ring-emerald-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-emerald-950/70 border-b border-emerald-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-emerald-500/20 text-emerald-300">
        <Hash class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-emerald-100 truncate">{data.fieldName || data.dialogId || id}</div>
        <div class="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">vxml:field</div>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      {#if data.isSimulatingActive}
        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      {/if}
      {#if data.type === 'custom'}
        <span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-200 font-mono border border-purple-700/60 flex items-center gap-1">
          <Sparkles class="w-2.5 h-2.5 text-amber-300" /> SRGS
        </span>
      {:else}
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-mono border border-emerald-700/50">
          {data.type || 'digits'}
        </span>
      {/if}
    </div>
  </div>

  <!-- Prompt & Content -->
  <div class="p-3 space-y-2.5 text-xs">
    {#if data.prompt?.text}
      <div class="flex items-start gap-1.5 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
        <Volume2 class="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
        <span class="line-clamp-2 italic leading-relaxed">"{data.prompt.text}"</span>
      </div>
    {:else}
      <div class="text-[11px] text-amber-400/80 flex items-center gap-1 italic">
        <AlertTriangle class="w-3 h-3" /> No prompt defined
      </div>
    {/if}

    {#if data.type === 'custom' && data.customGrammar}
      <div class="flex items-center gap-1.5 text-[10px] text-purple-300 bg-purple-950/40 px-2 py-1 rounded border border-purple-800/40 font-mono">
        <Sparkles class="w-3 h-3 text-amber-400 shrink-0" />
        <span class="truncate">Custom SRGS 1.0 Grammar Active</span>
      </div>
    {/if}

    <!-- Output Handles -->
    <div class="space-y-2 pt-1 border-t border-slate-800">
      <!-- Filled handle -->
      <div class="relative flex items-center justify-between bg-emerald-950/40 rounded-md px-2 py-1 border border-emerald-800/40">
        <div class="flex items-center gap-1.5 text-emerald-300 text-[11px] font-medium">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>&lt;filled&gt; success</span>
        </div>
        <Handle
          id="filled"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-900"
        />
      </div>

      <!-- Noinput handle -->
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

      <!-- Nomatch handle -->
      <div class="relative flex items-center justify-between bg-slate-800/50 rounded-md px-2 py-1 border border-slate-700/40">
        <div class="flex items-center gap-1.5 text-rose-300 text-[11px]">
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>&lt;nomatch&gt; error</span>
        </div>
        <Handle
          id="nomatch"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-rose-400 !border-2 !border-slate-900"
        />
      </div>
    </div>
  </div>
</div>
