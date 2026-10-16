<script lang="ts">
  import { X, AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldCheck } from '@lucide/svelte';
  import type { DiagnosticItem } from '../types/vxml';

  let {
    isOpen = false,
    diagnostics = [],
    onSelectNode,
    onClose
  }: {
    isOpen: boolean;
    diagnostics: DiagnosticItem[];
    onSelectNode: (nodeId: string) => void;
    onClose: () => void;
  } = $props();

  const errorCount = $derived(diagnostics.filter((d) => d.severity === 'error').length);
  const warnCount = $derived(diagnostics.filter((d) => d.severity === 'warning').length);
</script>

{#if isOpen}
  <div class="fixed bottom-4 right-4 w-96 max-h-[480px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 {errorCount > 0 ? 'text-rose-400' : warnCount > 0 ? 'text-amber-400' : 'text-emerald-400'}" />
        <span class="text-xs font-bold text-white">VXML 2.1 Spec Diagnostics</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 text-[10px] font-mono">
          {#if errorCount > 0}
            <span class="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              {errorCount} errors
            </span>
          {/if}
          {#if warnCount > 0}
            <span class="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              {warnCount} warnings
            </span>
          {/if}
        </div>

        <button
          onclick={onClose}
          class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Diagnostic List -->
    <div class="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
      {#each diagnostics as diag}
        <button
          onclick={() => diag.nodeId && onSelectNode(diag.nodeId)}
          class="w-full text-left p-2.5 rounded-xl border transition-all {diag.severity === 'error'
            ? 'bg-rose-950/30 border-rose-800/50 hover:bg-rose-950/50 text-rose-200'
            : diag.severity === 'warning'
              ? 'bg-amber-950/30 border-amber-800/50 hover:bg-amber-950/50 text-amber-200'
              : 'bg-cyan-950/30 border-cyan-800/50 hover:bg-cyan-950/50 text-cyan-200'}"
        >
          <div class="flex items-start gap-2">
            {#if diag.severity === 'error'}
              <AlertCircle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            {:else if diag.severity === 'warning'}
              <AlertTriangle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            {:else}
              <Info class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            {/if}

            <div class="space-y-1 overflow-hidden">
              <p class="leading-snug">{diag.message}</p>
              <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                {#if diag.specReference}
                  <span class="text-indigo-400 underline">{diag.specReference}</span>
                {/if}
                {#if diag.nodeId}
                  <span>• Target: #{diag.nodeId}</span>
                {/if}
              </div>
            </div>
          </div>
        </button>
      {:else}
        <div class="py-8 text-center space-y-2">
          <CheckCircle2 class="w-8 h-8 text-emerald-400 mx-auto" />
          <div class="text-xs font-semibold text-emerald-300">No Spec Compliance Issues Found</div>
          <p class="text-[11px] text-slate-400 max-w-xs mx-auto">
            Your document strictly complies with all W3C VoiceXML 2.1 structural and dialog constraints.
          </p>
        </div>
      {/each}
    </div>
  </div>
{/if}
