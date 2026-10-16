<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { ListOrdered, Volume2, Clock, AlertCircle } from '@lucide/svelte';
  import type { MenuNodeData } from '../../types/vxml';

  let { id, data, selected = false }: { id: string; data: MenuNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-72 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-indigo-400 ring-2 ring-indigo-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-indigo-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-indigo-950/70 border-b border-indigo-800/50 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1 rounded bg-indigo-500/20 text-indigo-300">
        <ListOrdered class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-semibold text-indigo-100 truncate">{data.dialogId || id}</div>
        <div class="text-[10px] text-indigo-400 uppercase tracking-wider font-mono">vxml:menu</div>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      {#if data.isSimulatingActive}
        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      {/if}
      {#if data.dtmf}
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 font-mono border border-indigo-700/50">
          DTMF
        </span>
      {/if}
    </div>
  </div>

  <!-- Prompt Preview -->
  <div class="p-3 space-y-2 text-xs">
    {#if data.prompt?.text}
      <div class="flex items-start gap-1.5 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
        <Volume2 class="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
        <span class="line-clamp-2 italic leading-relaxed">"{data.prompt.text}"</span>
      </div>
    {:else}
      <div class="text-[11px] text-amber-400/80 flex items-center gap-1 italic">
        <AlertCircle class="w-3 h-3" /> No prompt defined
      </div>
    {/if}

    <!-- Choices with Individual Handles -->
    <div class="space-y-1.5 pt-1">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span>Choices ({data.choices?.length || 0})</span>
        <span class="text-[9px] text-slate-500">connects to</span>
      </div>

      {#each data.choices || [] as choice}
        <div class="relative flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 rounded-md px-2 py-1.5 border border-slate-700/50 group">
          <div class="flex items-center gap-1.5 truncate max-w-[200px]">
            {#if choice.dtmf}
              <span class="w-4 h-4 rounded bg-indigo-600/40 text-indigo-300 font-mono text-[10px] flex items-center justify-center font-bold border border-indigo-500/30">
                {choice.dtmf}
              </span>
            {/if}
            <span class="text-xs text-slate-200 truncate">{choice.text}</span>
          </div>

          <!-- Output Handle for this specific choice -->
          <Handle
            id={'choice-' + choice.id}
            type="source"
            position={Position.Right}
            class="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-slate-900"
          />
        </div>
      {/each}
    </div>

    <!-- Noinput & Nomatch Handles -->
    <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
      <div class="relative flex items-center gap-1">
        <Clock class="w-3 h-3 text-amber-400" />
        <span>timeout</span>
        <Handle
          id="noinput"
          type="source"
          position={Position.Right}
          class="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-slate-900"
        />
      </div>
      <div class="relative flex items-center gap-1">
        <AlertCircle class="w-3 h-3 text-rose-400" />
        <span>nomatch</span>
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
