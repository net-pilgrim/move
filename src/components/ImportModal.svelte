<script lang="ts">
  import { X, Upload, FileText, AlertTriangle } from '@lucide/svelte';
  import { parseVxml } from '../lib/vxml/parser';
  import type { ParseResult } from '../lib/vxml/parser';

  let {
    isOpen = false,
    onImport,
    onClose
  }: {
    isOpen: boolean;
    onImport: (result: ParseResult) => void;
    onClose: () => void;
  } = $props();

  let xmlInput = $state('');
  let parseError = $state<string | null>(null);

  function handleImport() {
    if (!xmlInput.trim()) {
      parseError = 'Please paste VoiceXML content to import.';
      return;
    }

    const result = parseVxml(xmlInput.trim());
    if (result.error) {
      parseError = result.error;
      return;
    }

    onImport(result);
    xmlInput = '';
    parseError = null;
    onClose();
  }

  function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      xmlInput = event.target?.result as string;
      parseError = null;
    };
    reader.readAsText(file);
  }

  function loadSample() {
    xmlInput = `<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.1" xmlns="http://www.w3.org/2001/vxml" xml:lang="en-US">
  <property name="timeout" value="5s"/>
  
  <menu id="welcome_menu" dtmf="true">
    <prompt>Welcome to Acme. Press 1 for Sales, 2 for Support.</prompt>
    <choice dtmf="1" next="#sales_block">Sales</choice>
    <choice dtmf="2" next="#support_block">Support</choice>
  </menu>

  <form id="sales_block">
    <block>
      <prompt>Connecting to Sales department.</prompt>
      <goto next="#hangup"/>
    </block>
  </form>

  <form id="support_block">
    <block>
      <prompt>Connecting to Technical Support.</prompt>
      <goto next="#hangup"/>
    </block>
  </form>

  <form id="hangup">
    <block>
      <disconnect/>
    </block>
  </form>
</vxml>`;
    parseError = null;
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Upload class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm">Import VoiceXML Document</h3>
            <p class="text-xs text-slate-400">Paste raw VXML 2.1 or 2.0 XML to reverse-engineer it into flow nodes</p>
          </div>
        </div>

        <button
          onclick={onClose}
          class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-4 flex-1 overflow-y-auto">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-slate-300 flex items-center gap-2" for="vxml_xml_input">
            <FileText class="w-4 h-4 text-indigo-400" />
            <span>VoiceXML Markup:</span>
          </label>

          <div class="flex items-center gap-2">
            <label class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors">
              <span>Upload .vxml file</span>
              <input type="file" accept=".vxml,.xml" onchange={handleFileUpload} class="hidden" />
            </label>
            <button
              onclick={loadSample}
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium transition-colors"
            >
              Load Sample VXML
            </button>
          </div>
        </div>

        {#if parseError}
          <div class="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-200 text-xs flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        {/if}

        <textarea
          id="vxml_xml_input"
          rows="14"
          bind:value={xmlInput}
          placeholder="Paste your <?xml ...?><vxml version='2.1'> ... </vxml> here..."
          class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none selection:bg-indigo-900"
        ></textarea>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
        <button
          onclick={onClose}
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={handleImport}
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-colors flex items-center gap-1.5"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>Parse & Import Flow</span>
        </button>
      </div>
    </div>
  </div>
{/if}
