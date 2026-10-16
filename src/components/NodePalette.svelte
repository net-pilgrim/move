<script lang="ts">
  import {
    ListOrdered,
    Hash,
    SquarePlay,
    Database,
    GitBranch,
    Mic,
    PhoneForwarded,
    ExternalLink,
    PhoneOff,
    LogOut,
    Sparkles,
    Plus
  } from '@lucide/svelte';
  import type { VxmlNodeType } from '../types/vxml';

  let {
    onAddNode
  }: {
    onAddNode: (type: VxmlNodeType) => void;
  } = $props();

  let isOpen = $state(false);

  const paletteItems: Array<{
    type: VxmlNodeType;
    label: string;
    tag: string;
    icon: any;
    color: string;
    isVxml21?: boolean;
    description: string;
  }> = [
    {
      type: 'vxml-menu',
      label: 'Menu Dialog',
      tag: '<menu>',
      icon: ListOrdered,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50',
      description: 'Audio prompt with DTMF & speech choices'
    },
    {
      type: 'vxml-field',
      label: 'Form Field',
      tag: '<field>',
      icon: Hash,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50',
      description: 'Collect digits, numbers, or boolean input'
    },
    {
      type: 'vxml-block',
      label: 'Block',
      tag: '<block>',
      icon: SquarePlay,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:border-sky-500/50',
      description: 'Procedural statements, scripts & prompts'
    },
    {
      type: 'vxml-data',
      label: 'Data Fetch',
      tag: '<data>',
      icon: Database,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50',
      isVxml21: true,
      description: 'VoiceXML 2.1 XML data fetch without page load'
    },
    {
      type: 'vxml-condition',
      label: 'Condition / Branch',
      tag: '<if>',
      icon: GitBranch,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50',
      description: 'Branching logic based on ECMAScript expression'
    },
    {
      type: 'vxml-record',
      label: 'Audio Record',
      tag: '<record>',
      icon: Mic,
      color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20 hover:border-fuchsia-500/50',
      description: 'Record caller voice audio with beep & timer'
    },
    {
      type: 'vxml-transfer',
      label: 'Call Transfer',
      tag: '<transfer>',
      icon: PhoneForwarded,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50',
      description: 'Bridge or blind transfer to phone number / SIP'
    },
    {
      type: 'vxml-subdialog',
      label: 'Subdialog',
      tag: '<subdialog>',
      icon: ExternalLink,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/50',
      description: 'Invoke reusable modular VoiceXML document'
    },
    {
      type: 'vxml-disconnect',
      label: 'Disconnect',
      tag: '<disconnect/>',
      icon: PhoneOff,
      color: 'text-red-400 bg-red-500/10 border-red-500/20 hover:border-red-500/50',
      description: 'Terminate telephony call session'
    },
    {
      type: 'vxml-exit',
      label: 'Exit',
      tag: '<exit/>',
      icon: LogOut,
      color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20 hover:border-zinc-500/50',
      description: 'Exit VoiceXML interpreter'
    }
  ];

  function selectNode(type: VxmlNodeType) {
    onAddNode(type);
    isOpen = false;
  }
</script>

<div class="relative">
  <button
    onclick={() => (isOpen = !isOpen)}
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-colors"
  >
    <Plus class="w-4 h-4" />
    <span>Add Node</span>
  </button>

  {#if isOpen}
    <!-- Backdrop to close -->
    <div
      role="presentation"
      class="fixed inset-0 z-30"
      onclick={() => (isOpen = false)}
      onkeydown={(e) => {
        if (e.key === 'Escape') isOpen = false;
      }}
    ></div>

    <!-- Dropdown Menu -->
    <div class="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-40 space-y-1 max-h-96 overflow-y-auto">
      <div class="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        VoiceXML 2.1 Elements
      </div>

      {#each paletteItems as item}
        <button
          onclick={() => selectNode(item.type)}
          class="w-full text-left p-2 rounded-lg border flex items-start gap-2.5 transition-all {item.color}"
        >
          <div class="p-1 rounded bg-slate-950/60 mt-0.5">
            <item.icon class="w-3.5 h-3.5" />
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-semibold text-slate-200">{item.label}</span>
              <span class="text-[10px] font-mono text-slate-400">{item.tag}</span>
              {#if item.isVxml21}
                <span class="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-700/50 flex items-center gap-0.5">
                  <Sparkles class="w-2.5 h-2.5 text-amber-300" /> 2.1
                </span>
              {/if}
            </div>
            <p class="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
