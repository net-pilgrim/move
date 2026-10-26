<script lang="ts">
  import type { Node } from '@xyflow/svelte';
  import {
    X,
    Trash2,
    Copy,
    Plus,
    Volume2,
    Settings,
    ListOrdered,
    Hash,
    SquarePlay,
    Database,
    GitBranch,
    Mic,
    PhoneForwarded,
    PhoneOff,
    ExternalLink,
    LogOut,
    Sparkles
  } from '@lucide/svelte';

  let {
    selectedNode = null,
    onUpdateNode,
    onDeleteNode,
    onDuplicateNode,
    onOpenGrammarEditor,
    onClose
  }: {
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, updatedData: any) => void;
    onDeleteNode: (nodeId: string) => void;
    onDuplicateNode: (node: Node) => void;
    onOpenGrammarEditor?: (initialXml: string, onSave: (xml: string) => void) => void;
    onClose: () => void;
  } = $props();

  // Local copy of data for reactive editing
  let data = $state<any>({});

  $effect(() => {
    if (selectedNode) {
      data = JSON.parse(JSON.stringify(selectedNode.data));
    }
  });

  function triggerUpdate() {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, $state.snapshot(data));
    }
  }

  function addChoice() {
    if (!data.choices) data.choices = [];
    const newIdx = data.choices.length + 1;
    data.choices.push({
      id: 'c_' + Math.random().toString(36).substring(2, 6),
      dtmf: String(newIdx),
      text: `Option ${newIdx}`
    });
    triggerUpdate();
  }

  function removeChoice(index: number) {
    if (!data.choices) return;
    data.choices.splice(index, 1);
    triggerUpdate();
  }

  function addAssign() {
    if (!data.assigns) data.assigns = [];
    data.assigns.push({ name: 'var_name', expr: "'value'" });
    triggerUpdate();
  }

  function removeAssign(index: number) {
    if (!data.assigns) return;
    data.assigns.splice(index, 1);
    triggerUpdate();
  }
</script>

{#if selectedNode}
  <aside class="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20 text-slate-200">
    <!-- Header -->
    <div class="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
      <div class="flex items-center gap-2">
        <div class="p-1 rounded bg-slate-800 text-indigo-400">
          <Settings class="w-4 h-4" />
        </div>
        <div>
          <div class="text-xs font-semibold text-white">Element Inspector</div>
          <div class="text-[10px] text-slate-400 font-mono">{selectedNode.type}</div>
        </div>
      </div>
      <button
        onclick={onClose}
        class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
        title="Close Inspector"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Scrollable Body -->
    <div class="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
      <!-- General Dialog Info -->
      <section class="space-y-3">
        <div class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
          Dialog Identity
        </div>

        <label class="block space-y-1">
          <span class="text-slate-400 text-[11px]">Dialog ID (NMTOKEN)</span>
          <input
            type="text"
            bind:value={data.dialogId}
            oninput={triggerUpdate}
            class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
          />
        </label>
      </section>

      <!-- Prompt Configuration (Common to almost all nodes) -->
      {#if data.prompt !== undefined}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center gap-1.5 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
            <Volume2 class="w-3.5 h-3.5 text-indigo-400" />
            <span>Voice Prompt &lt;prompt&gt;</span>
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Prompt TTS Text</span>
            <textarea
              rows="3"
              bind:value={data.prompt.text}
              oninput={triggerUpdate}
              placeholder="e.g. Welcome to our automated service..."
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
            ></textarea>
          </label>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Audio File URI (Optional)</span>
            <input
              type="text"
              bind:value={data.prompt.audio}
              oninput={triggerUpdate}
              placeholder="e.g. https://cdn.example.com/welcome.wav"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Barge-in</span>
              <select
                bind:value={data.prompt.bargein}
                onchange={triggerUpdate}
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value={true}>true (allow interrupt)</option>
                <option value={false}>false (must listen)</option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Timeout</span>
              <input
                type="text"
                bind:value={data.prompt.timeout}
                oninput={triggerUpdate}
                placeholder="e.g. 5s"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </label>
          </div>
        </section>
      {/if}

      <!-- Node-Specific Properties -->
      {#if selectedNode.type === 'vxml-menu'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Menu Choices
            </span>
            <button
              onclick={addChoice}
              class="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus class="w-3 h-3" /> Add Choice
            </button>
          </div>

          <div class="space-y-2">
            {#each data.choices || [] as choice, idx}
              <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-slate-500 font-mono">Choice #{idx + 1}</span>
                  <button
                    onclick={() => removeChoice(idx)}
                    class="text-slate-500 hover:text-rose-400 p-0.5"
                    title="Remove choice"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                  <label class="col-span-1 block">
                    <span class="text-[10px] text-slate-400 mb-0.5 block">DTMF</span>
                    <input
                      type="text"
                      bind:value={choice.dtmf}
                      oninput={triggerUpdate}
                      placeholder="1"
                      class="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-xs text-white"
                    />
                  </label>
                  <label class="col-span-2 block">
                    <span class="text-[10px] text-slate-400 mb-0.5 block">Spoken Text</span>
                    <input
                      type="text"
                      bind:value={choice.text}
                      oninput={triggerUpdate}
                      placeholder="Sales"
                      class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </label>
                </div>
              </div>
            {/each}
          </div>

          <div class="space-y-2 pt-2">
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Noinput Prompt</span>
              <input
                type="text"
                bind:value={data.noinputPrompt}
                oninput={triggerUpdate}
                placeholder="e.g. Please choose an option."
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
            </label>
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Nomatch Prompt</span>
              <input
                type="text"
                bind:value={data.nomatchPrompt}
                oninput={triggerUpdate}
                placeholder="e.g. That is not a valid choice."
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
            </label>
          </div>
        </section>

      {:else if selectedNode.type === 'vxml-field'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
            Field Configuration
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Field Variable Name</span>
            <input
              type="text"
              bind:value={data.fieldName}
              oninput={triggerUpdate}
              placeholder="e.g. pin_code"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
            />
          </label>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Grammar Type</span>
            <select
              bind:value={data.type}
              onchange={triggerUpdate}
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
            >
              <option value="digits">digits (telephone keypad numbers)</option>
              <option value="boolean">boolean (yes / no)</option>
              <option value="number">number (integers and decimals)</option>
              <option value="currency">currency (monetary amounts)</option>
              <option value="phone">phone (telephone numbers)</option>
              <option value="time">time</option>
              <option value="date">date</option>
              <option value="custom">custom (SRGS XML)</option>
            </select>
          </label>

          {#if data.type === 'digits'}
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Digits Parameters</span>
              <input
                type="text"
                bind:value={data.grammarParams}
                oninput={triggerUpdate}
                placeholder="?minlength=4;maxlength=6 or ?length=4"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
              />
            </label>
          {/if}

          {#if data.type === 'custom'}
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-slate-400 text-[11px]">SRGS Grammar Rules</span>
                {#if onOpenGrammarEditor}
                  <button
                    type="button"
                    onclick={() => {
                      if (onOpenGrammarEditor) {
                        onOpenGrammarEditor(data.customGrammar || '', (newXml) => {
                          data.type = 'custom';
                          data.customGrammar = newXml;
                          triggerUpdate();
                        });
                      }
                    }}
                    class="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                  >
                    <Sparkles class="w-3 h-3 text-amber-400" />
                    <span>Open Grammar Studio</span>
                  </button>
                {/if}
              </div>
              <textarea
                rows="4"
                bind:value={data.customGrammar}
                oninput={triggerUpdate}
                placeholder="<grammar ...>...</grammar>"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs resize-none"
              ></textarea>
            </div>
          {:else}
            <div class="pt-0.5 flex justify-end">
              <button
                type="button"
                onclick={() => {
                  data.type = 'custom';
                  triggerUpdate();
                  if (onOpenGrammarEditor) {
                    onOpenGrammarEditor(data.customGrammar || '', (newXml) => {
                      data.type = 'custom';
                      data.customGrammar = newXml;
                      triggerUpdate();
                    });
                  }
                }}
                class="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
              >
                <Sparkles class="w-2.5 h-2.5 text-amber-400" />
                <span>Switch to custom SRGS grammar</span>
              </button>
            </div>
          {/if}

          <div class="space-y-2 pt-2">
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Noinput Prompt</span>
              <input
                type="text"
                bind:value={data.noinputPrompt}
                oninput={triggerUpdate}
                placeholder="e.g. Please enter your input."
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
            </label>
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Nomatch Prompt</span>
              <input
                type="text"
                bind:value={data.nomatchPrompt}
                oninput={triggerUpdate}
                placeholder="e.g. Input not recognized. Try again."
                class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
            </label>
          </div>
        </section>

      {:else if selectedNode.type === 'vxml-data'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center gap-1.5 font-semibold text-purple-400 uppercase text-[10px] tracking-wider">
            <Sparkles class="w-3.5 h-3.5 text-amber-400" />
            <span>VoiceXML 2.1 &lt;data&gt; Element</span>
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Target Variable Name ("name")</span>
            <input
              type="text"
              bind:value={data.dataName}
              oninput={triggerUpdate}
              placeholder="e.g. account_data"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
            />
          </label>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Endpoint URL ("src")</span>
            <input
              type="text"
              bind:value={data.src}
              oninput={triggerUpdate}
              placeholder="https://api.example.com/v1/customer"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">HTTP Method</span>
              <select
                bind:value={data.method}
                onchange={triggerUpdate}
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs font-mono"
              >
                <option value="get">GET</option>
                <option value="post">POST</option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Namelist</span>
              <input
                type="text"
                bind:value={data.namelist}
                oninput={triggerUpdate}
                placeholder="var1 var2"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs font-mono"
              />
            </label>
          </div>
        </section>

      {:else if selectedNode.type === 'vxml-condition'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
            Branching Condition (&lt;if&gt;)
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">JavaScript Expression ("cond")</span>
            <input
              type="text"
              bind:value={data.condition}
              oninput={triggerUpdate}
              placeholder="e.g. balance &gt; 0"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-mono text-xs"
            />
          </label>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">True Prompt (Optional)</span>
            <input
              type="text"
              bind:value={data.truePrompt}
              oninput={triggerUpdate}
              placeholder="e.g. Your balance is in good standing."
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
            />
          </label>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">False Prompt (Optional)</span>
            <input
              type="text"
              bind:value={data.falsePrompt}
              oninput={triggerUpdate}
              placeholder="e.g. Your balance is zero or negative."
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
            />
          </label>
        </section>

      {:else if selectedNode.type === 'vxml-block'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Variable Assignments
            </span>
            <button
              onclick={addAssign}
              class="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
            >
              <Plus class="w-3 h-3" /> Add Assign
            </button>
          </div>

          <div class="space-y-2">
            {#each data.assigns || [] as a, idx}
              <div class="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded border border-slate-800">
                <input
                  type="text"
                  bind:value={a.name}
                  oninput={triggerUpdate}
                  placeholder="name"
                  class="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-sky-300 font-mono"
                />
                <span class="text-slate-500">=</span>
                <input
                  type="text"
                  bind:value={a.expr}
                  oninput={triggerUpdate}
                  placeholder="expr"
                  class="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200 font-mono"
                />
                <button
                  onclick={() => removeAssign(idx)}
                  class="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            {/each}
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Inline Script (&lt;script&gt;)</span>
            <textarea
              rows="3"
              bind:value={data.script}
              oninput={triggerUpdate}
              placeholder="user_status = 'verified';"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs resize-none"
            ></textarea>
          </label>
        </section>

      {:else if selectedNode.type === 'vxml-transfer'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
            Transfer Settings
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Destination URI ("dest")</span>
            <input
              type="text"
              bind:value={data.dest}
              oninput={triggerUpdate}
              placeholder="tel:+18005550199 or sip:agent@pbx.com"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-rose-300 font-mono text-xs"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Bridge Call</span>
              <select
                bind:value={data.bridge}
                onchange={triggerUpdate}
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs"
              >
                <option value={true}>true (bridge)</option>
                <option value={false}>false (blind)</option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Connect Timeout</span>
              <input
                type="text"
                bind:value={data.connecttimeout}
                oninput={triggerUpdate}
                placeholder="30s"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs font-mono"
              />
            </label>
          </div>
        </section>

      {:else if selectedNode.type === 'vxml-record'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
            Audio Recording Settings
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Recording Variable ("name")</span>
            <input
              type="text"
              bind:value={data.recordName}
              oninput={triggerUpdate}
              placeholder="e.g. voicemail_audio"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-fuchsia-300 font-mono text-xs"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Play Beep</span>
              <select
                bind:value={data.beep}
                onchange={triggerUpdate}
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs"
              >
                <option value={true}>true</option>
                <option value={false}>false</option>
              </select>
            </label>
            <label class="block space-y-1">
              <span class="text-slate-400 text-[11px]">Max Time</span>
              <input
                type="text"
                bind:value={data.maxtime}
                oninput={triggerUpdate}
                placeholder="30s"
                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs font-mono"
              />
            </label>
          </div>
        </section>

      {:else if selectedNode.type === 'vxml-subdialog'}
        <section class="space-y-3 pt-3 border-t border-slate-800">
          <div class="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
            Subdialog Settings
          </div>

          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Source URI ("src")</span>
            <input
              type="text"
              bind:value={data.src}
              oninput={triggerUpdate}
              placeholder="subflow.vxml"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono text-xs"
            />
          </label>
          <label class="block space-y-1">
            <span class="text-slate-400 text-[11px]">Namelist</span>
            <input
              type="text"
              bind:value={data.namelist}
              oninput={triggerUpdate}
              placeholder="param1 param2"
              class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
            />
          </label>
        </section>
      {/if}
    </div>

    <!-- Actions Footer -->
    <div class="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
      <button
        onclick={() => onDuplicateNode(selectedNode)}
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
      >
        <Copy class="w-3.5 h-3.5" /> Duplicate
      </button>

      <button
        onclick={() => onDeleteNode(selectedNode.id)}
        class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-medium transition-colors"
      >
        <Trash2 class="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  </aside>
{/if}
