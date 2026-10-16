<script lang="ts">
  import { X, Copy, Download, Check, FileCode, Sparkles } from '@lucide/svelte';

  let {
    isOpen = false,
    vxmlCode = '',
    onClose
  }: {
    isOpen: boolean;
    vxmlCode: string;
    onClose: () => void;
  } = $props();

  let copied = $state(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(vxmlCode);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function downloadVxml() {
    const blob = new Blob([vxmlCode], { type: 'application/voicexml+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'callflow.vxml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <FileCode class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-slate-100 text-sm">Generated VoiceXML 2.1 Document</h3>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles class="w-3 h-3 text-emerald-400" /> W3C VXML 2.1 Compliant
              </span>
            </div>
            <p class="text-xs text-slate-400">Fully compliant VoiceXML ready for deployment on any VXML 2.1 IVR platform</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick={copyToClipboard}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {#if copied}
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span class="text-emerald-400">Copied!</span>
            {:else}
              <Copy class="w-3.5 h-3.5" />
              <span>Copy Code</span>
            {/if}
          </button>

          <button
            onclick={downloadVxml}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Download .vxml</span>
          </button>

          <button
            onclick={onClose}
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Code Content -->
      <div class="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 selection:bg-indigo-900 selection:text-white">
        <pre class="whitespace-pre overflow-x-auto"><code>{vxmlCode}</code></pre>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-4">
          <span>Encoding: <strong>UTF-8</strong></span>
          <span>MIME: <strong>application/voicexml+xml</strong></span>
          <span>Lines: <strong>{vxmlCode.split('\n').length}</strong></span>
        </div>
        <button
          onclick={onClose}
          class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
