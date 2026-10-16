<script lang="ts">
  import {
    X,
    Phone,
    PhoneOff,
    Volume2,
    VolumeX,
    Mic,
    Send,
    Clock,
    RefreshCw,
    Activity,
    CheckCircle2,
    Terminal,
    Minimize2,
    Maximize2,
    Eye
  } from '@lucide/svelte';
  import type { SimulatorState } from '../lib/simulator/ivr-engine';

  let {
    isOpen = false,
    simulatorState,
    onStartCall,
    onEndCall,
    onSendDtmf,
    onSubmitInput,
    onTriggerNoInput,
    onToggleMute,
    onClose
  }: {
    isOpen: boolean;
    simulatorState: SimulatorState;
    onStartCall: () => void;
    onEndCall: () => void;
    onSendDtmf: (digit: string) => void;
    onSubmitInput: (text: string) => void;
    onTriggerNoInput: () => void;
    onToggleMute: () => void;
    onClose: () => void;
  } = $props();

  let isDocked = $state(false);
  let dockedTab = $state<'phone' | 'logs'>('phone');
  let speechInput = $state('');

  const keypadKeys = [
    { key: '1', sub: '' },
    { key: '2', sub: 'ABC' },
    { key: '3', sub: 'DEF' },
    { key: '4', sub: 'GHI' },
    { key: '5', sub: 'JKL' },
    { key: '6', sub: 'MNO' },
    { key: '7', sub: 'PQRS' },
    { key: '8', sub: 'TUV' },
    { key: '9', sub: 'WXYZ' },
    { key: '*', sub: '' },
    { key: '0', sub: '+' },
    { key: '#', sub: '' }
  ];

  function handleKeypadPress(k: string) {
    onSendDtmf(k);
  }

  function handleSpeechSubmit(e: Event) {
    e.preventDefault();
    if (!speechInput.trim()) return;
    onSubmitInput(speechInput.trim());
    speechInput = '';
  }
</script>

{#if isOpen}
  <!-- Backdrop wrapper: transparent and non-blocking in docked mode to allow canvas interaction -->
  <div
    class="fixed inset-0 z-50 transition-colors duration-200 {isDocked
      ? 'pointer-events-none p-4 sm:p-6 flex items-end justify-end'
      : 'bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-auto'}"
  >
    <!-- Modal Container -->
    <div
      class="bg-slate-900 border transition-all duration-300 shadow-2xl flex flex-col pointer-events-auto overflow-hidden {isDocked
        ? 'w-full sm:w-[410px] max-h-[88vh] rounded-2xl border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-[0_12px_45px_rgba(0,0,0,0.85)]'
        : 'w-full max-w-4xl max-h-[90vh] rounded-2xl border-slate-700'}"
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <div class="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <Phone class="w-4 h-4" />
          </div>
          <div class="truncate">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-slate-100 text-xs sm:text-sm truncate">
                {isDocked ? 'IVR Phone Simulator' : 'Interactive VoiceXML 2.1 IVR Simulator'}
              </h3>
              {#if simulatorState.isActive && simulatorState.currentNodeId}
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 animate-pulse shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active: {simulatorState.currentNodeId}
                </span>
              {/if}
            </div>
            {#if !isDocked}
              <p class="text-[11px] text-slate-400 truncate">Test dialog flows, speech prompts, DTMF touch tones & live node tracking</p>
            {/if}
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Dock / Float Toggle Button -->
          <button
            onclick={() => (isDocked = !isDocked)}
            class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-800/40 text-xs font-medium transition-colors"
            title={isDocked ? 'Expand to Full Modal (Center)' : 'Dock & Float (Interact with Canvas in BG)'}
          >
            {#if isDocked}
              <Maximize2 class="w-3.5 h-3.5" />
              <span class="hidden sm:inline text-[11px]">Expand</span>
            {:else}
              <Minimize2 class="w-3.5 h-3.5" />
              <span class="hidden sm:inline text-[11px]">Dock & Float</span>
            {/if}
          </button>

          <!-- Audio Mute Toggle Button -->
          <button
            onclick={onToggleMute}
            class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={simulatorState.isMuted ? 'Unmute Audio (TTS)' : 'Mute Audio (TTS)'}
          >
            {#if simulatorState.isMuted}
              <VolumeX class="w-4 h-4 text-rose-400" />
            {:else}
              <Volume2 class="w-4 h-4 text-emerald-400" />
            {/if}
          </button>

          <!-- Close Button -->
          <button
            onclick={onClose}
            class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close Simulator"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Docked Mode Tabs Subheader -->
      {#if isDocked}
        <div class="flex border-b border-slate-800 bg-slate-950/60 text-xs font-medium shrink-0">
          <button
            onclick={() => (dockedTab = 'phone')}
            class="flex-1 py-1.5 text-center transition-colors border-b-2 {dockedTab === 'phone'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'}"
          >
            Keypad & Speech
          </button>
          <button
            onclick={() => (dockedTab = 'logs')}
            class="flex-1 py-1.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 {dockedTab === 'logs'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'}"
          >
            <span>Trace Logs</span>
            {#if simulatorState.logs.length > 0}
              <span class="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-indigo-300 font-mono">
                {simulatorState.logs.length}
              </span>
            {/if}
          </button>
        </div>
      {/if}

      <!-- Simulator Content Body -->
      {#if isDocked}
        <!-- DOCKED COMPACT VIEW -->
        {#if dockedTab === 'phone'}
          <div class="p-4 flex flex-col gap-3 overflow-y-auto">
            <!-- Active Node & Prompt Banner -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full {simulatorState.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}"></span>
                  <span class="font-medium text-slate-200 text-[11px]">
                    {simulatorState.isActive ? 'Call Connected' : 'Call Idle'}
                  </span>
                </span>

                {#if simulatorState.isSpeaking}
                  <span class="text-[10px] text-indigo-400 font-mono animate-pulse flex items-center gap-1">
                    <Activity class="w-3 h-3" /> SPEAKING
                  </span>
                {/if}
              </div>

              <!-- Active Prompt Output -->
              <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800 min-h-[50px] flex flex-col justify-center">
                {#if simulatorState.activePrompt}
                  <p class="text-xs text-indigo-200 italic leading-relaxed">
                    "{simulatorState.activePrompt}"
                  </p>
                {:else if simulatorState.isActive}
                  <p class="text-xs text-slate-500 italic">Listening for input...</p>
                {:else}
                  <p class="text-xs text-slate-500 italic">Press "Start Call" to begin IVR simulation.</p>
                {/if}
              </div>

              {#if simulatorState.collectedInput}
                <div class="text-[11px] text-amber-300 font-mono text-right">
                  Buffer: [{simulatorState.collectedInput}]
                </div>
              {/if}
            </div>

            <!-- Keypad (Compact 3x4 grid) -->
            <div class="grid grid-cols-3 gap-1.5 px-1">
              {#each keypadKeys as k}
                <button
                  disabled={!simulatorState.isActive}
                  onclick={() => handleKeypadPress(k.key)}
                  class="flex flex-col items-center justify-center h-10 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:bg-indigo-900/40 border border-slate-700/60 hover:border-indigo-500/50 text-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <span class="text-sm font-bold font-mono">{k.key}</span>
                  {#if k.sub}
                    <span class="text-[7px] text-slate-400 tracking-wider font-semibold">{k.sub}</span>
                  {/if}
                </button>
              {/each}
            </div>

            <!-- Voice / Speech Input Form -->
            <form onsubmit={handleSpeechSubmit} class="space-y-1.5">
              <label class="text-[10px] text-slate-400 flex items-center gap-1" for="speech_input_docked">
                <Mic class="w-3 h-3 text-indigo-400" />
                <span>Simulate Speech Utterance:</span>
              </label>
              <div class="flex gap-1.5">
                <input
                  id="speech_input_docked"
                  type="text"
                  disabled={!simulatorState.isActive}
                  bind:value={speechInput}
                  placeholder="e.g. Sales, 1234, Yes..."
                  class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!simulatorState.isActive || !speechInput.trim()}
                  class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Send class="w-3 h-3" />
                </button>
              </div>
            </form>

            <!-- Call Action Controls -->
            <div class="flex items-center gap-1.5 pt-2 border-t border-slate-800">
              {#if !simulatorState.isActive}
                <button
                  onclick={onStartCall}
                  class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 transition-colors"
                >
                  <Phone class="w-3.5 h-3.5" /> Start Call
                </button>
              {:else}
                <button
                  onclick={onEndCall}
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-950/40 transition-colors"
                >
                  <PhoneOff class="w-3.5 h-3.5" /> Hang Up
                </button>
                <button
                  onclick={onTriggerNoInput}
                  class="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 text-xs font-medium transition-colors"
                  title="Trigger <noinput> timeout event"
                >
                  <Clock class="w-3 h-3" /> NoInput
                </button>
                <button
                  onclick={onStartCall}
                  class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Restart Call"
                >
                  <RefreshCw class="w-3.5 h-3.5" />
                </button>
              {/if}
            </div>

            <!-- Helpful background indicator hint -->
            <div class="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
              <Eye class="w-3 h-3 text-emerald-400" />
              <span>Active node is highlighted green in the background canvas</span>
            </div>
          </div>
        {:else}
          <!-- DOCKED TRACE LOGS VIEW -->
          <div class="p-3 flex flex-col flex-1 overflow-hidden space-y-2 h-[380px]">
            <!-- Variables summary -->
            <div class="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Variables</span>
                <span class="text-[9px] text-slate-500">{Object.keys(simulatorState.variables).length} vars</span>
              </div>
              <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {#each Object.entries(simulatorState.variables) as [k, v]}
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    <span class="text-indigo-400">{k}</span>: {JSON.stringify(v)}
                  </span>
                {:else}
                  <span class="text-[10px] text-slate-500 italic">No variables declared yet</span>
                {/each}
              </div>
            </div>

            <!-- Logs list -->
            <div class="flex-1 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 overflow-y-auto space-y-1 font-mono text-[11px]">
              {#each simulatorState.logs as log (log.id)}
                <div class="flex items-start gap-1.5 leading-snug">
                  <span class="text-[9px] text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                  {#if log.type === 'prompt'}
                    <span class="text-indigo-300">{log.text}</span>
                  {:else if log.type === 'dtmf'}
                    <span class="text-amber-400 font-bold">{log.text}</span>
                  {:else if log.type === 'input'}
                    <span class="text-emerald-400">{log.text}</span>
                  {:else if log.type === 'event'}
                    <span class="text-cyan-300">{log.text}</span>
                  {:else if log.type === 'error'}
                    <span class="text-rose-400 font-semibold">{log.text}</span>
                  {:else if log.type === 'hangup'}
                    <span class="text-red-400 italic">{log.text}</span>
                  {:else}
                    <span class="text-slate-400">{log.text}</span>
                  {/if}
                </div>
              {:else}
                <div class="text-center py-6 text-slate-500 italic text-[11px]">
                  No interpreter logs yet.
                </div>
              {/each}
            </div>

            <!-- Call action footer in logs tab -->
            <div class="flex items-center gap-1.5 pt-1">
              {#if simulatorState.isActive}
                <button
                  onclick={onEndCall}
                  class="flex-1 py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Hang Up
                </button>
              {:else}
                <button
                  onclick={onStartCall}
                  class="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Start Call
                </button>
              {/if}
            </div>
          </div>
        {/if}
      {:else}
        <!-- EXPANDED MODAL 2-COLUMN GRID -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <!-- Left: Phone / Handset & Keypad (5 cols) -->
          <div class="md:col-span-5 border-r border-slate-800 p-5 flex flex-col justify-between bg-slate-950/40 space-y-4">
            <!-- Call Status & Active Prompt Box -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full {simulatorState.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}"></span>
                  <span class="font-medium text-slate-200">
                    {simulatorState.isActive ? 'Call Connected' : 'Call Idle'}
                  </span>
                </span>

                {#if simulatorState.isSpeaking}
                  <span class="text-[10px] text-indigo-400 font-mono animate-pulse flex items-center gap-1">
                    <Activity class="w-3 h-3" /> SPEAKING
                  </span>
                {/if}
              </div>

              <!-- Subtitle / Active Prompt -->
              <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 min-h-[64px] flex flex-col justify-center">
                {#if simulatorState.activePrompt}
                  <p class="text-xs text-indigo-200 italic leading-relaxed">
                    "{simulatorState.activePrompt}"
                  </p>
                {:else if simulatorState.isActive}
                  <p class="text-xs text-slate-500 italic">Listening for input...</p>
                {:else}
                  <p class="text-xs text-slate-500 italic">Press "Start Call" to begin IVR simulation.</p>
                {/if}
              </div>

              {#if simulatorState.collectedInput}
                <div class="text-[11px] text-amber-300 font-mono text-right">
                  Buffer: [{simulatorState.collectedInput}]
                </div>
              {/if}
            </div>

            <!-- Keypad -->
            <div class="grid grid-cols-3 gap-2 px-3">
              {#each keypadKeys as k}
                <button
                  disabled={!simulatorState.isActive}
                  onclick={() => handleKeypadPress(k.key)}
                  class="flex flex-col items-center justify-center h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/50 text-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <span class="text-base font-bold font-mono">{k.key}</span>
                  {#if k.sub}
                    <span class="text-[8px] text-slate-400 tracking-wider font-semibold">{k.sub}</span>
                  {/if}
                </button>
              {/each}
            </div>

            <!-- Voice / Speech Simulation Form -->
            <form onsubmit={handleSpeechSubmit} class="space-y-2">
              <label class="block text-[11px] text-slate-400 flex items-center gap-1" for="speech_input">
                <Mic class="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulate Voice / Utterance Input:</span>
              </label>
              <div class="flex gap-1.5">
                <input
                  id="speech_input"
                  type="text"
                  disabled={!simulatorState.isActive}
                  bind:value={speechInput}
                  placeholder="e.g. Sales, 1234, Yes..."
                  class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!simulatorState.isActive || !speechInput.trim()}
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Send class="w-3 h-3" />
                </button>
              </div>
            </form>

            <!-- Call Actions Buttons -->
            <div class="flex items-center gap-2 pt-2 border-t border-slate-800">
              {#if !simulatorState.isActive}
                <button
                  onclick={onStartCall}
                  class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 transition-colors"
                >
                  <Phone class="w-4 h-4" /> Start Call
                </button>
              {:else}
                <button
                  onclick={onEndCall}
                  class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-950/40 transition-colors"
                >
                  <PhoneOff class="w-4 h-4" /> Hang Up
                </button>
                <button
                  onclick={onTriggerNoInput}
                  class="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 text-xs font-medium transition-colors"
                  title="Trigger <noinput> timeout event"
                >
                  <Clock class="w-3.5 h-3.5" /> NoInput
                </button>
                <button
                  onclick={onStartCall}
                  class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Restart Call"
                >
                  <RefreshCw class="w-4 h-4" />
                </button>
              {/if}
            </div>
          </div>

          <!-- Right: Execution Log & Variables (7 cols) -->
          <div class="md:col-span-7 flex flex-col overflow-hidden bg-slate-900">
            <!-- Session Variables Bar -->
            <div class="p-3 border-b border-slate-800 bg-slate-950/60">
              <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Session ECMAScript Variables</span>
                <span class="text-[10px] text-slate-500">{Object.keys(simulatorState.variables).length} vars</span>
              </div>
              <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {#each Object.entries(simulatorState.variables) as [k, v]}
                  <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    <span class="text-indigo-400">{k}</span>: {JSON.stringify(v)}
                  </span>
                {:else}
                  <span class="text-[11px] text-slate-500 italic">No variables declared yet</span>
                {/each}
              </div>
            </div>

            <!-- Chronological Trace Log -->
            <div class="flex-1 p-3 overflow-y-auto space-y-1.5 font-mono text-xs">
              <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <Terminal class="w-3.5 h-3.5 text-indigo-400" />
                  <span>VoiceXML Interpreter Trace</span>
                </div>
                <button
                  onclick={() => (isDocked = true)}
                  class="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans"
                  title="Dock and view node execution directly on canvas"
                >
                  <Minimize2 class="w-3 h-3" />
                  <span>Dock to see canvas</span>
                </button>
              </div>

              {#each simulatorState.logs as log (log.id)}
                <div class="flex items-start gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span class="text-[10px] text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                  {#if log.type === 'prompt'}
                    <span class="text-indigo-300 leading-snug">{log.text}</span>
                  {:else if log.type === 'dtmf'}
                    <span class="text-amber-400 font-bold leading-snug">{log.text}</span>
                  {:else if log.type === 'input'}
                    <span class="text-emerald-400 leading-snug">{log.text}</span>
                  {:else if log.type === 'event'}
                    <span class="text-cyan-300 leading-snug">{log.text}</span>
                  {:else if log.type === 'error'}
                    <span class="text-rose-400 font-semibold leading-snug">{log.text}</span>
                  {:else if log.type === 'hangup'}
                    <span class="text-red-400 italic leading-snug">{log.text}</span>
                  {:else}
                    <span class="text-slate-400 leading-snug">{log.text}</span>
                  {/if}
                </div>
              {:else}
                <div class="text-center py-10 text-slate-500 italic text-xs">
                  Interpreter idle. Click "Start Call" to begin tracing execution.
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
