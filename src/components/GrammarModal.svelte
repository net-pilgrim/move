<script lang="ts">
  import { untrack } from 'svelte';
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
    AlertCircle,
    Star,
    ArrowRightLeft
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
    fieldNodes = [],
    selectedFieldNodeId,
    onSave,
    onClose
  }: {
    isOpen: boolean;
    initialXml?: string;
    fieldNodes?: Array<{ id: string; label: string; fieldName: string }>;
    selectedFieldNodeId?: string;
    onSave: (srgsXml: string, targetDestination?: string) => void;
    onClose: () => void;
  } = $props();

  let activeTab = $state<'visual' | 'code' | 'test'>('visual');
  let grammar = $state<SrgsGrammar>(getDefaultSrgsGrammar());
  let xmlText = $state('');
  let xmlError = $state<string | null>(null);
  let copied = $state(false);
  let targetDestination = $state<string>('');

  // Test phrase state
  let testInput = $state('');
  let testTargetRule = $state('');
  let testResult = $state<GrammarTestResult | null>(null);

  // Keep track of open transition to avoid reactive resets on user modifications
  let prevIsOpen = false;

  $effect(() => {
    const currentlyOpen = isOpen;
    if (currentlyOpen && !prevIsOpen) {
      untrack(() => {
        const raw = initialXml?.trim() || '';
        if (raw) {
          try {
            grammar = xmlToSrgs(raw);
            xmlText = raw;
            xmlError = null;
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
        testTargetRule = grammar.root || grammar.rules[0]?.name || '';
        xmlError = null;

        if (selectedFieldNodeId) {
          targetDestination = selectedFieldNodeId;
        } else if (fieldNodes && fieldNodes.length > 0) {
          targetDestination = fieldNodes[0].id;
        } else {
          targetDestination = '__new__';
        }
      });
    }
    prevIsOpen = currentlyOpen;
  });

  // Sync visual changes to XML
  function syncToXml() {
    xmlText = srgsToXml(grammar);
    xmlError = null;
  }

  // Sync XML changes to visual
  function syncFromXml() {
    try {
      const parsed = xmlToSrgs(xmlText);
      grammar = parsed;
      if (!grammar.rules.some((r) => r.name === grammar.root) && grammar.rules.length > 0) {
        grammar.root = grammar.rules[0].name;
      }
      if (!testTargetRule || !grammar.rules.some((r) => r.name === testTargetRule)) {
        testTargetRule = grammar.root || grammar.rules[0]?.name || '';
      }
      xmlError = null;
    } catch (err: any) {
      xmlError = err?.message || 'XML syntax error';
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
    let newName = `RULE_${idx}`;
    let counter = idx;
    while (grammar.rules.some((r) => r.name === newName)) {
      counter++;
      newName = `RULE_${counter}`;
    }

    const newRule: SrgsRule = {
      id: 'r_' + Math.random().toString(36).substring(2, 8),
      name: newName,
      scope: 'public',
      type: 'one-of',
      items: [
        {
          id: 'i_' + Math.random().toString(36).substring(2, 8),
          phrase: 'example phrase',
          semanticTag: 'out = "value";'
        }
      ]
    };

    grammar.rules.push(newRule);
    if (!grammar.root) {
      grammar.root = newRule.name;
    }
    syncToXml();
  }

  function removeRule(ruleIdx: number) {
    if (grammar.rules.length <= 1) return;
    const removedRule = grammar.rules[ruleIdx];
    grammar.rules.splice(ruleIdx, 1);
    if (grammar.root === removedRule.name && grammar.rules.length > 0) {
      grammar.root = grammar.rules[0].name;
    }
    if (testTargetRule === removedRule.name) {
      testTargetRule = grammar.root || grammar.rules[0]?.name || '';
    }
    syncToXml();
  }

  function handleRuleNameInput(rule: SrgsRule, newName: string) {
    const oldName = rule.name;
    rule.name = newName;
    const trimmed = newName.trim();
    if (trimmed) {
      if (grammar.root === oldName || !grammar.root) {
        grammar.root = trimmed;
      }
      if (testTargetRule === oldName || !testTargetRule) {
        testTargetRule = trimmed;
      }
      for (const r of grammar.rules) {
        for (const it of r.items) {
          if (it.ruleRef === oldName) {
            it.ruleRef = trimmed;
            it.phrase = `#${trimmed}`;
          }
        }
      }
    }
    syncToXml();
  }

  function setAsRootRule(ruleName: string) {
    grammar.root = ruleName;
    syncToXml();
  }

  function addItem(rule: SrgsRule) {
    rule.items.push({
      id: 'i_' + Math.random().toString(36).substring(2, 8),
      phrase: 'new phrase',
      semanticTag: 'out = "value";'
    });
    syncToXml();
  }

  function removeItem(rule: SrgsRule, itemIdx: number) {
    if (rule.items.length <= 1) {
      // Clear phrase rather than leaving empty rule
      rule.items[0].phrase = '';
      rule.items[0].semanticTag = '';
      rule.items[0].ruleRef = undefined;
    } else {
      rule.items.splice(itemIdx, 1);
    }
    syncToXml();
  }

  function handleItemPhraseInput(item: SrgsItem, val: string) {
    item.phrase = val;
    const trimmed = val.trim();
    if (trimmed.startsWith('#')) {
      item.ruleRef = trimmed.slice(1).trim();
    } else {
      item.ruleRef = undefined;
    }
    syncToXml();
  }

  function loadTemplate(tplId: string) {
    const tpl = GRAMMAR_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    grammar = JSON.parse(JSON.stringify(tpl.grammar));
    testTargetRule = grammar.root || grammar.rules[0]?.name || '';
    syncToXml();
  }

  function runTest() {
    testResult = testGrammarMatch(grammar, testInput, testTargetRule || undefined);
  }

  function copyXml() {
    if (activeTab === 'visual') {
      syncToXml();
    }
    navigator.clipboard.writeText(xmlText);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function downloadGrxml() {
    if (activeTab === 'visual') {
      syncToXml();
    }
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
    if (activeTab === 'code') {
      syncFromXml();
    } else {
      syncToXml();
    }
    onSave(xmlText, targetDestination);
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
            <p class="text-xs text-slate-400">Design multi-rule speech & DTMF grammars with semantic interpretation (&lt;tag&gt;) for VoiceXML 2.1</p>
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
            <select
              bind:value={grammar.root}
              onchange={syncToXml}
              class="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {#each grammar.rules as r}
                <option value={r.name}>{r.name}</option>
              {/each}
            </select>
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
            {#each grammar.rules as rule, rIdx (rule.id)}
              <div class="bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-3 shadow-sm {grammar.root === rule.name ? 'ring-1 ring-purple-600/40 border-purple-800/60' : ''}">
                <!-- Rule Header -->
                <div class="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="text-[10px] font-mono text-purple-400 font-bold uppercase">&lt;rule&gt;</span>
                    
                    <label class="flex items-center gap-1.5">
                      <span class="text-slate-400 text-[11px]">Rule ID:</span>
                      <input
                        type="text"
                        bind:value={rule.name}
                        oninput={(e) => handleRuleNameInput(rule, e.currentTarget.value)}
                        placeholder="RULE_NAME"
                        class="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-mono text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </label>

                    <label class="flex items-center gap-1.5">
                      <span class="text-slate-400 text-[11px]">Scope:</span>
                      <select
                        bind:value={rule.scope}
                        onchange={syncToXml}
                        class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="public">public</option>
                        <option value="private">private</option>
                      </select>
                    </label>

                    <label class="flex items-center gap-1.5">
                      <span class="text-slate-400 text-[11px]">Type:</span>
                      <select
                        bind:value={rule.type}
                        onchange={syncToXml}
                        class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                      >
                        <option value="one-of">&lt;one-of&gt; (Choice / OR)</option>
                        <option value="sequence">&lt;sequence&gt; (Sequence / AND)</option>
                      </select>
                    </label>

                    {#if grammar.root === rule.name}
                      <span class="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-semibold text-[10px] border border-purple-700/60 flex items-center gap-1">
                        <Star class="w-3 h-3 text-amber-400 fill-amber-400" />
                        ROOT RULE
                      </span>
                    {:else}
                      <button
                        type="button"
                        onclick={() => setAsRootRule(rule.name)}
                        class="text-[10px] text-slate-400 hover:text-purple-300 hover:underline flex items-center gap-1 transition-colors"
                      >
                        Set as root
                      </button>
                    {/if}
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
                    <span class="col-span-5">Phrase or Rule Reference (#RULE)</span>
                    <span class="col-span-4">Semantic Interpretation (&lt;tag&gt;)</span>
                    <span class="col-span-2">Repeat</span>
                    <span class="col-span-1 text-right">Action</span>
                  </div>

                  {#each rule.items as item, itIdx (item.id)}
                    <div class="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div class="col-span-5 flex items-center gap-1.5">
                        <input
                          type="text"
                          bind:value={item.phrase}
                          oninput={(e) => handleItemPhraseInput(item, e.currentTarget.value)}
                          placeholder="e.g. sales, yes, or #RULE_REF"
                          class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                        />
                        {#if grammar.rules.length > 1}
                          <!-- Quick rule reference selector if multiple rules exist -->
                          <select
                            onchange={(e) => {
                              if (e.currentTarget.value) {
                                handleItemPhraseInput(item, `#${e.currentTarget.value}`);
                                e.currentTarget.value = '';
                              }
                            }}
                            class="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] rounded px-1 py-1.5 shrink-0 focus:outline-none"
                            title="Reference another rule"
                          >
                            <option value="">#ref</option>
                            {#each grammar.rules as otherR}
                              {#if otherR.name !== rule.name}
                                <option value={otherR.name}>#{otherR.name}</option>
                              {/if}
                            {/each}
                          </select>
                        {/if}
                      </div>
                      <div class="col-span-4">
                        <input
                          type="text"
                          bind:value={item.semanticTag}
                          oninput={syncToXml}
                          placeholder='out = "value";'
                          class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div class="col-span-2">
                        <select
                          bind:value={item.repeat}
                          onchange={syncToXml}
                          class="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
                        >
                          <option value="">repeat: 1 (exact)</option>
                          <option value="0-1">repeat: 0-1 (optional ?)</option>
                          <option value="1+">repeat: 1+ (one or more +)</option>
                          <option value="0+">repeat: 0+ (any *)</option>
                        </select>
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

            <!-- Add Another Rule Button -->
            <button
              type="button"
              onclick={addRule}
              class="w-full py-3 rounded-xl border-2 border-dashed border-purple-800/60 hover:border-purple-500 hover:bg-purple-950/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus class="w-4 h-4 text-purple-400" />
              <span>Add Another Rule (&lt;rule&gt;)</span>
            </button>
          </div>

        {:else if activeTab === 'code'}
          <!-- Raw SRGS XML View -->
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <div class="flex items-center gap-2">
                <span>Standard W3C SRGS 1.0 XML Markup</span>
                {#if xmlError}
                  <span class="text-rose-400 font-medium text-[11px] flex items-center gap-1">
                    <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                    <span>{xmlError}</span>
                  </span>
                {/if}
              </div>
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
              <div class="flex items-center justify-between">
                <label for="test_grammar_input" class="block text-slate-400 text-xs">Simulated User Input (Spoken or DTMF):</label>
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-slate-400">Target Rule:</span>
                  <select
                    bind:value={testTargetRule}
                    class="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px] text-purple-300"
                  >
                    {#each grammar.rules as r}
                      <option value={r.name}>{r.name} {r.name === grammar.root ? '(Root)' : ''}</option>
                    {/each}
                  </select>
                </div>
              </div>

              <div class="flex gap-2">
                <input
                  id="test_grammar_input"
                  type="text"
                  bind:value={testInput}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') runTest();
                  }}
                  placeholder={grammar.mode === 'voice' ? 'e.g. sales, billing, yes, san francisco...' : 'e.g. 1, 2, 0...'}
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
                    The utterance "{testInput}" did not match any of the active grammar items in rule &lt;rule id="{testTargetRule || grammar.root}"&gt;.
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        <div class="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Rules: <strong class="text-slate-200">{grammar.rules.length}</strong></span>
          <span>•</span>
          <span>Total Items: <strong class="text-slate-200">{grammar.rules.reduce((acc, r) => acc + r.items.length, 0)}</strong></span>
          <span>•</span>
          <span>Root: <strong class="text-purple-300 font-mono">{grammar.root}</strong></span>
        </div>

        <div class="flex items-center gap-2.5">
          <label class="flex items-center gap-1.5 text-xs text-slate-400">
            <span class="text-[11px]">Apply to:</span>
            <select
              bind:value={targetDestination}
              class="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
            >
              {#if fieldNodes && fieldNodes.length > 0}
                <optgroup label="Form Fields on Canvas">
                  {#each fieldNodes as fn}
                    <option value={fn.id}>{fn.label} ({fn.fieldName})</option>
                  {/each}
                </optgroup>
              {/if}
              <optgroup label="Actions">
                <option value="__new__">+ Create New Field Node on Canvas</option>
                <option value="__clipboard__">Copy to Clipboard Only</option>
              </optgroup>
            </select>
          </label>

          <button
            type="button"
            onclick={onClose}
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onclick={handleSaveGrammar}
            class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Apply Grammar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
