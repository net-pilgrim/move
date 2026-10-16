<script lang="ts">
  import {
    X,
    Code,
    Sparkles,
    Sliders,
    Play,
    Plus,
    Trash2,
    Copy,
    Download,
    Upload,
    Check,
    Volume2,
    Hash,
    HelpCircle,
    FileCode,
    Layers,
    Search,
    CheckCircle2,
    AlertCircle
  } from '@lucide/svelte';
  import type { SrgsGrammar, SrgsRule, SrgsItem, GrammarTestResult } from '../types/grammar';
  import {
    getDefaultSrgsGrammar,
    srgsToXml,
    xmlToSrgs,
    testGrammarMatch,
    GRAMMAR_TEMPLATES
  } from '../lib/grammar/srgs';

  let {
    isOpen = false,
    initialXml = '',
    onSave,
    onClose
  }: {
    isOpen: boolean;
    initialXml?: string;
    onSave: (srgsXml: string) => void;
    onClose: () => void;
  } = $props();

  let activeTab = $state<'visual' | 'code' | 'test'>('visual');
  let grammar = $state<SrgsGrammar>(getDefaultSrgsGrammar());
  let xmlText = $state('');
  let copied = $state(false);

  // Test phrase state
  let testInput = $state('');
  let testResult = $state<GrammarTestResult | null>(null);

  $effect(() => {
    if (isOpen) {
      if (initialXml && initialXml.trim()) {
        try {
          grammar = xmlToSrgs(initialXml.trim());
          xmlText = initialXml.trim();
        } catch {
          grammar = getDefaultSrgsGrammar();
          xmlText = srgsToXml(grammar);
        }
      } else {
        grammar = getDefaultSrgsGrammar();
        xmlText = srgsToXml(grammar);
      }
      testInput = '';
      testResult = null;
    }
  });

  // Sync visual changes to XML
  function syncToXml() {
    xmlText = srgsToXml(grammar);
  }

  // Sync XML changes to visual
  function syncFromXml() {
    try {
      grammar = xmlToSrgs(xmlText);
    } catch {
      // Ignore parse issues while typing
    }
  }

  function handleTabChange(tab: 'visual' | 'code' | 'test') {
    if (activeTab === 'code' && tab !== 'code') {
      syncFromXml();
    } else if (activeTab !== 'code' && tab === 'code') {
      syncToXml();
    }
    activeTab = tab;
  }

  function addRule() {
    const idx = grammar.rules.length + 1;
    grammar.rules.push({
      id: 'r_' + Math.random().toString(36).substring(2, 6),
      name: `RULE_${idx}`,
      scope: 'public',
      type: 'one-of',
      items: [
        { id: 'i_' + Math.random().toString(36).substring(2, 6), phrase: 'example' }
      ]
    });
    syncToXml();
  }

  function removeRule(ruleIdx: number) {
    if (grammar.rules.length <= 1) return;
    grammar.rules.splice(ruleIdx, 1);
    if (!grammar.rules.some((r) => r.name === grammar.root)) {
      grammar.root = grammar.rules[0].name;
    }
    syncToXml();
  }

  function addItem(rule: SrgsRule) {
    rule.items.push({
      id: 'i_' + Math.random().toString(36).substring(2, 6),
      phrase: 'new phrase',
      semanticTag: 'out = "value";'
    });
    syncToXml();
  }

  function removeItem(rule: SrgsRule, itemIdx: number) {
    rule.items.splice(itemIdx, 1);
    syncToXml();
  }

  function loadTemplate(tplId: string) {
    const tpl = GRAMMAR_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    grammar = JSON.parse(JSON.stringify(tpl.grammar));
    syncToXml();
  }

  function runTest() {
    testResult = testGrammarMatch(grammar, testInput);
  }

  function copyXml() {
    syncToXml();
    navigator.clipboard.writeText(xmlText);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function downloadGrxml() {
    syncToXml();
    const blob = new Blob([xmlText], { type: 'application/srgs+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${grammar.root.toLowerCase() || 'grammar'}.grxml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      xmlText = event.target?.result as string;
      syncFromXml();
    };
    reader.readAsText(file);
    input.value = '';
  }

  function handleSaveGrammar() {
    syncToXml();
    onSave(xmlText);
    onClose();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-purple-500/20 text-purple-300">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-slate-100 text-sm">W3C SRGS 1.0 Grammar Studio</h3>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50 font-mono">
                application/srgs+xml
              </span>
            </div>
            <p class="text-xs text-slate-400">Design speech & DTMF grammars with semantic interpretation (&lt;tag&gt;) for VoiceXML 2.1</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Template selector -->
          <select
            onchange={(e) => loadTemplate(e.currentTarget.value)}
            class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="" disabled selected>Grammar Templates...</option>
            {#each GRAMMAR_TEMPLATES as tpl}
              <option value={tpl.id}>{tpl.name}</option>
            {/each}
          </select>

          <button
            onclick={onClose}
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Settings Sub-Bar -->
      <div class="px-5 py-2.5 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <!-- Mode & Attributes -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-400 text-[11px]">Mode:</span>
            <div class="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onclick={() => {
                  grammar.mode = 'voice';
                  syncToXml();
                }}
                class="px-2.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1 {grammar.mode === 'voice'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'}"
              >
                <Volume2 class="w-3 h-3" /> Voice
              </button>
              <button
                onclick={() => {
                  grammar.mode = 'dtmf';
                  syncToXml();
                }}
                class="px-2.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1 {grammar.mode === 'dtmf'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'}"
              >
                <Hash class="w-3 h-3" /> DTMF
              </button>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-slate-400 text-[11px]">Root Rule:</span>
            <input
              type="text"
              bind:value={grammar.root}
              oninput={syncToXml}
              class="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-xs text-purple-300"
            />
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-slate-400 text-[11px]">Lang:</span>
            <input
              type="text"
              bind:value={grammar.xmlLang}
              oninput={syncToXml}
              class="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-xs text-slate-200"
            />
          </div>
        </div>

        <!-- Tab Pills -->
        <div class="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
          <button
            onclick={() => handleTabChange('visual')}
            class="px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 {activeTab === 'visual'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            <Layers class="w-3.5 h-3.5" /> Visual Builder
          </button>
          <button
            onclick={() => handleTabChange('code')}
            class="px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 {activeTab === 'code'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            <Code class="w-3.5 h-3.5" /> SRGS XML
          </button>
          <button
            onclick={() => handleTabChange('test')}
            class="px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 {activeTab === 'test'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            <Play class="w-3.5 h-3.5" /> Test Recognition
          </button>
        </div>
      </div>

      <!-- Body Content -->
      <div class="flex-1 overflow-y-auto p-5 text-xs">
        {#if activeTab === 'visual'}
          <!-- Visual Builder -->
          <div class="space-y-6">
            {#each grammar.rules as rule, rIdx}
              <div class="bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-3 shadow-sm">
                <!-- Rule Header -->
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-mono text-purple-400 font-bold uppercase">&lt;rule&gt;</span>
                    <label class="flex items-center gap-1.5">
                      <span class="text-slate-400 text-[11px]">Rule ID:</span>
                      <input
                        type="text"
                        bind:value={rule.name}
                        oninput={syncToXml}
                        class="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                      />
                    </label>

                    <label class="flex items-center gap-1.5">
                      <span class="text-slate-400 text-[11px]">Scope:</span>
                      <select
                        bind:value={rule.scope}
                        onchange={syncToXml}
                        class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="public">public</option>
                        <option value="private">private</option>
                      </select>
                    </label>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      onclick={() => addItem(rule)}
                      class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-800 text-xs font-medium transition-colors"
                    >
                      <Plus class="w-3 h-3" /> Add Item
                    </button>
                    {#if grammar.rules.length > 1}
                      <button
                        onclick={() => removeRule(rIdx)}
                        class="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    {/if}
                  </div>
                </div>

                <!-- Items Table (Choices / Alternatives) -->
                <div class="space-y-2">
                  <div class="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                    <span class="col-span-5">Spoken Phrase or DTMF Key</span>
                    <span class="col-span-6">Semantic Interpretation (&lt;tag&gt;)</span>
                    <span class="col-span-1 text-right">Action</span>
                  </div>

                  {#each rule.items as item, itIdx}
                    <div class="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div class="col-span-5">
                        <input
                          type="text"
                          bind:value={item.phrase}
                          oninput={syncToXml}
                          placeholder="e.g. sales, billing..."
                          class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div class="col-span-6">
                        <input
                          type="text"
                          bind:value={item.semanticTag}
                          oninput={syncToXml}
                          placeholder='out = "value";'
                          class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div class="col-span-1 flex justify-end">
                        <button
                          onclick={() => removeItem(rule, itIdx)}
                          class="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}

            <button
              onclick={addRule}
              class="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-purple-500 hover:bg-purple-950/20 text-slate-400 hover:text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus class="w-4 h-4" />
              <span>Add Another Rule (&lt;rule&gt;)</span>
            </button>
          </div>

        {:else if activeTab === 'code'}
          <!-- Raw SRGS XML View -->
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Standard W3C SRGS 1.0 XML Markup</span>
              <div class="flex items-center gap-2">
                <button
                  onclick={copyXml}
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  {#if copied}
                    <Check class="w-3 h-3 text-emerald-400" />
                    <span class="text-emerald-400">Copied!</span>
                  {:else}
                    <Copy class="w-3 h-3" />
                    <span>Copy XML</span>
                  {/if}
                </button>
                <button
                  onclick={downloadGrxml}
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  <Download class="w-3 h-3" />
                  <span>Download .grxml</span>
                </button>
                <label class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer">
                  <Upload class="w-3 h-3" />
                  <span>Upload .grxml</span>
                  <input type="file" accept=".grxml,.srgs,.xml" onchange={handleFileUpload} class="hidden" />
                </label>
              </div>
            </div>

            <textarea
              rows="16"
              bind:value={xmlText}
              oninput={syncFromXml}
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500 resize-none selection:bg-purple-900"
            ></textarea>
          </div>

        {:else if activeTab === 'test'}
          <!-- Interactive Matcher / Tester -->
          <div class="max-w-xl mx-auto space-y-6 py-4">
            <div class="text-center space-y-1">
              <h4 class="font-bold text-slate-200 text-sm">Interactive Grammar Matcher</h4>
              <p class="text-xs text-slate-400">Enter a test utterance or DTMF digits to verify rule recognition and semantic return values.</p>
            </div>

            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label for="test_grammar_input" class="block text-slate-400 text-xs">Simulated User Input (Spoken or DTMF):</label>
              <div class="flex gap-2">
                <input
                  id="test_grammar_input"
                  type="text"
                  bind:value={testInput}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') runTest();
                  }}
                  placeholder={grammar.mode === 'voice' ? 'e.g. sales, billing, representative...' : 'e.g. 1, 2, 0...'}
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onclick={runTest}
                  class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Search class="w-3.5 h-3.5" />
                  <span>Test Match</span>
                </button>
              </div>
            </div>

            <!-- Match Result Card -->
            {#if testResult}
              <div class="p-4 rounded-xl border transition-all {testResult.matched
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'}">
                <div class="flex items-center gap-2 mb-2">
                  {#if testResult.matched}
                    <CheckCircle2 class="w-5 h-5 text-emerald-400" />
                    <span class="font-bold text-sm text-emerald-300">MATCH SUCCESS</span>
                  {:else}
                    <AlertCircle class="w-5 h-5 text-rose-400" />
                    <span class="font-bold text-sm text-rose-300">NOMATCH (No match found)</span>
                  {/if}
                </div>

                {#if testResult.matched}
                  <div class="space-y-1 font-mono text-xs pl-7">
                    <div>Matched Rule: <span class="text-white font-semibold">#{testResult.matchedRule}</span></div>
                    <div>Matched Token: <span class="text-white font-semibold">"{testResult.matchedPhrase}"</span></div>
                    {#if testResult.semanticValue}
                      <div>Semantic Interpretation (out): <span class="text-emerald-300 font-bold font-mono">{JSON.stringify(testResult.semanticValue)}</span></div>
                    {/if}
                  </div>
                {:else}
                  <p class="text-xs text-rose-300/80 pl-7">
                    The utterance "{testInput}" did not match any of the active grammar items in rule &lt;rule id="{grammar.root}"&gt;.
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div class="text-[11px] text-slate-400">
          Rules: <strong>{grammar.rules.length}</strong> • Total Items: <strong>{grammar.rules.reduce((acc, r) => acc + r.items.length, 0)}</strong>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick={onClose}
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onclick={handleSaveGrammar}
            class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-colors flex items-center gap-1.5"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Apply Grammar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
