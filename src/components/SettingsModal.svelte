<script lang="ts">
  import { X, Sliders, Plus, Trash2, Globe, Shield, Code, Save } from '@lucide/svelte';
  import type { VxmlDocSettings } from '../types/vxml';

  let {
    isOpen = false,
    settings,
    onSave,
    onClose
  }: {
    isOpen: boolean;
    settings: VxmlDocSettings;
    onSave: (settings: VxmlDocSettings) => void;
    onClose: () => void;
  } = $props();

  let local = $state<VxmlDocSettings>({
    version: '2.1',
    xmlns: 'http://www.w3.org/2001/vxml',
    xmlLang: 'en-US',
    globalVars: [],
    globalProperties: [],
    globalCatch: []
  });

  $effect(() => {
    if (isOpen) {
      local = JSON.parse(JSON.stringify(settings));
    }
  });

  function addProperty() {
    local.globalProperties.push({ name: 'property_name', value: 'value' });
  }

  function removeProperty(idx: number) {
    local.globalProperties.splice(idx, 1);
  }

  function addVar() {
    local.globalVars.push({ name: 'var_name', expr: "'initial_value'" });
  }

  function removeVar(idx: number) {
    local.globalVars.splice(idx, 1);
  }

  function addCatch() {
    local.globalCatch.push({
      id: 'catch_' + Math.random().toString(36).substring(2, 6),
      event: 'error',
      prompt: 'An unexpected system error occurred.'
    });
  }

  function removeCatch(idx: number) {
    local.globalCatch.splice(idx, 1);
  }

  function handleSave() {
    onSave($state.snapshot(local));
    onClose();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Sliders class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm">VoiceXML 2.1 Document Settings</h3>
            <p class="text-xs text-slate-400">Configure global XML attributes, properties, variables, and default event handlers</p>
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
      <div class="p-5 space-y-6 flex-1 overflow-y-auto text-xs">
        <!-- Root XML Attributes -->
        <section class="space-y-3">
          <div class="flex items-center gap-1.5 font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            <Globe class="w-4 h-4 text-indigo-400" />
            <span>Root &lt;vxml&gt; Tag Attributes</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-400 mb-1" for="vxml_version">VoiceXML Version</label>
              <input
                id="vxml_version"
                type="text"
                readonly
                value="2.1"
                class="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-400 font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1" for="vxml_lang">Default Language (xml:lang)</label>
              <input
                id="vxml_lang"
                type="text"
                bind:value={local.xmlLang}
                placeholder="en-US"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1" for="vxml_app">Root Application URI (Optional)</label>
              <input
                id="vxml_app"
                type="text"
                bind:value={local.application}
                placeholder="root.vxml"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        <!-- Global Properties -->
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Global Properties (&lt;property name="..." value="..."/&gt;)
            </span>
            <button
              onclick={addProperty}
              class="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus class="w-3.5 h-3.5" /> Add Property
            </button>
          </div>

          <div class="space-y-2">
            {#each local.globalProperties as prop, idx}
              <div class="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <input
                  type="text"
                  bind:value={prop.name}
                  placeholder="name (e.g. timeout)"
                  class="w-44 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
                <span class="text-slate-500">=</span>
                <input
                  type="text"
                  bind:value={prop.value}
                  placeholder="value (e.g. 5s)"
                  class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
                <button
                  onclick={() => removeProperty(idx)}
                  class="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            {/each}
          </div>
        </section>

        <!-- Global Variables -->
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Global Variables (&lt;var name="..." expr="..."/&gt;)
            </span>
            <button
              onclick={addVar}
              class="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus class="w-3.5 h-3.5" /> Add Variable
            </button>
          </div>

          <div class="space-y-2">
            {#each local.globalVars as v, idx}
              <div class="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <input
                  type="text"
                  bind:value={v.name}
                  placeholder="name"
                  class="w-44 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-300 font-mono text-xs"
                />
                <span class="text-slate-500">=</span>
                <input
                  type="text"
                  bind:value={v.expr}
                  placeholder="expr (e.g. 'initial')"
                  class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
                <button
                  onclick={() => removeVar(idx)}
                  class="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            {/each}
          </div>
        </section>

        <!-- Global Catch Handlers -->
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Shield class="w-4 h-4 text-amber-400" />
              <span>Document-Level Event Handlers (&lt;catch&gt;)</span>
            </span>
            <button
              onclick={addCatch}
              class="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus class="w-3.5 h-3.5" /> Add Catch Handler
            </button>
          </div>

          <div class="space-y-2">
            {#each local.globalCatch as c, idx}
              <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 text-[11px]">Event:</span>
                    <input
                      type="text"
                      bind:value={c.event}
                      placeholder="e.g. noinput, nomatch, error"
                      class="w-48 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono text-xs"
                    />
                  </div>
                  <button
                    onclick={() => removeCatch(idx)}
                    class="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    bind:value={c.prompt}
                    placeholder="Spoken error / retry prompt..."
                    class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- Global Script -->
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center gap-1.5 font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            <Code class="w-4 h-4 text-cyan-400" />
            <span>Document-Level ECMAScript (&lt;script&gt;)</span>
          </div>
          <textarea
            rows="3"
            bind:value={local.globalScript}
            placeholder="// Declare global JavaScript helper functions here..."
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
          ></textarea>
        </section>
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
          onclick={handleSave}
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-colors flex items-center gap-1.5"
        >
          <Save class="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  </div>
{/if}
