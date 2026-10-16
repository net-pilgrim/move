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
    Search,
    ChevronLeft,
    ChevronRight,
    GripVertical,
    Plus
  } from '@lucide/svelte';
  import type { VxmlNodeType } from '../types/vxml';

  let {
    onAddNode,
    isCollapsed = $bindable(false)
  }: {
    onAddNode: (type: VxmlNodeType, position?: { x: number; y: number }) => void;
    isCollapsed?: boolean;
  } = $props();

  let searchQuery = $state('');

  interface PaletteItem {
    type: VxmlNodeType;
    label: string;
    tag: string;
    icon: any;
    colorClass: string;
    bgClass: string;
    isVxml21?: boolean;
    description: string;
    category: 'dialogs' | 'logic' | 'audio' | 'terminate';
  }

  const categories = [
    { id: 'dialogs', title: 'Core Dialogs' },
    { id: 'logic', title: 'Data & Branching' },
    { id: 'audio', title: 'Voice & Telephony' },
    { id: 'terminate', title: 'Call Termination' }
  ];

  const paletteItems: PaletteItem[] = [
    {
      type: 'vxml-menu',
      label: 'Menu Dialog',
      tag: '<menu>',
      icon: ListOrdered,
      colorClass: 'text-indigo-400 border-indigo-500/30 group-hover:border-indigo-400',
      bgClass: 'bg-indigo-500/10 hover:bg-indigo-500/20',
      description: 'DTMF touch-tone & speech menu',
      category: 'dialogs'
    },
    {
      type: 'vxml-field',
      label: 'Form Field',
      tag: '<field>',
      icon: Hash,
      colorClass: 'text-emerald-400 border-emerald-500/30 group-hover:border-emerald-400',
      bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      description: 'Collect digits, numbers, or boolean',
      category: 'dialogs'
    },
    {
      type: 'vxml-block',
      label: 'Block',
      tag: '<block>',
      icon: SquarePlay,
      colorClass: 'text-sky-400 border-sky-500/30 group-hover:border-sky-400',
      bgClass: 'bg-sky-500/10 hover:bg-sky-500/20',
      description: 'Prompts, scripts & assignments',
      category: 'dialogs'
    },
    {
      type: 'vxml-data',
      label: 'Data Fetch',
      tag: '<data>',
      icon: Database,
      colorClass: 'text-purple-400 border-purple-500/30 group-hover:border-purple-400',
      bgClass: 'bg-purple-500/10 hover:bg-purple-500/20',
      isVxml21: true,
      description: 'VXML 2.1 async backend XML/REST fetch',
      category: 'logic'
    },
    {
      type: 'vxml-condition',
      label: 'Condition / Branch',
      tag: '<if>',
      icon: GitBranch,
      colorClass: 'text-amber-400 border-amber-500/30 group-hover:border-amber-400',
      bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
      description: 'Branching logic on JS expression',
      category: 'logic'
    },
    {
      type: 'vxml-record',
      label: 'Audio Record',
      tag: '<record>',
      icon: Mic,
      colorClass: 'text-fuchsia-400 border-fuchsia-500/30 group-hover:border-fuchsia-400',
      bgClass: 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20',
      description: 'Record caller voice audio with beep',
      category: 'audio'
    },
    {
      type: 'vxml-transfer',
      label: 'Call Transfer',
      tag: '<transfer>',
      icon: PhoneForwarded,
      colorClass: 'text-rose-400 border-rose-500/30 group-hover:border-rose-400',
      bgClass: 'bg-rose-500/10 hover:bg-rose-500/20',
      description: 'Bridge or blind transfer (tel: / sip:)',
      category: 'audio'
    },
    {
      type: 'vxml-subdialog',
      label: 'Subdialog',
      tag: '<subdialog>',
      icon: ExternalLink,
      colorClass: 'text-cyan-400 border-cyan-500/30 group-hover:border-cyan-400',
      bgClass: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      description: 'Execute reusable modular flow',
      category: 'audio'
    },
    {
      type: 'vxml-disconnect',
      label: 'Disconnect',
      tag: '<disconnect/>',
      icon: PhoneOff,
      colorClass: 'text-red-400 border-red-500/30 group-hover:border-red-400',
      bgClass: 'bg-red-500/10 hover:bg-red-500/20',
      description: 'Hang up and terminate call session',
      category: 'terminate'
    },
    {
      type: 'vxml-exit',
      label: 'Exit',
      tag: '<exit/>',
      icon: LogOut,
      colorClass: 'text-zinc-400 border-zinc-500/30 group-hover:border-zinc-400',
      bgClass: 'bg-zinc-500/10 hover:bg-zinc-500/20',
      description: 'Exit VoiceXML interpreter',
      category: 'terminate'
    }
  ];

  const filteredItems = $derived(
    paletteItems.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function handleDragStart(event: DragEvent, type: VxmlNodeType) {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('application/vxml-node-type', type);
    event.dataTransfer.effectAllowed = 'move';
  }
</script>

<aside
  class="relative h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 z-20 shrink-0 select-none {isCollapsed
    ? 'w-12'
    : 'w-64'}"
>
  <!-- Sidebar Header -->
  <div class="h-12 border-b border-slate-800 px-3 flex items-center justify-between bg-slate-950/70">
    {#if !isCollapsed}
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="text-xs font-bold text-white uppercase tracking-wider">Node Palette</span>
        <span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-mono border border-indigo-700/50">
          VXML 2.1
        </span>
      </div>
    {/if}

    <button
      onclick={() => (isCollapsed = !isCollapsed)}
      class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {#if isCollapsed}
        <ChevronRight class="w-4 h-4" />
      {:else}
        <ChevronLeft class="w-4 h-4" />
      {/if}
    </button>
  </div>

  {#if !isCollapsed}
    <!-- Search Bar -->
    <div class="p-2.5 border-b border-slate-800">
      <div class="relative">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Filter elements..."
          class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
        />
      </div>
    </div>

    <!-- Instructions Tip -->
    <div class="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
      <span>Drag or click to add</span>
      <span class="text-indigo-400 font-mono font-semibold">+ click</span>
    </div>

    <!-- Items List grouped by category -->
    <div class="flex-1 overflow-y-auto p-2.5 space-y-4 text-xs">
      {#each categories as cat}
        {@const catItems = filteredItems.filter((i) => i.category === cat.id)}
        {#if catItems.length > 0}
          <div class="space-y-1.5">
            <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1">
              {cat.title}
            </div>

            {#each catItems as item}
              <div
                role="button"
                tabindex="0"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, item.type)}
                onclick={() => onAddNode(item.type)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAddNode(item.type);
                  }
                }}
                class="group w-full text-left p-2 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/80 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all shadow-sm flex items-start gap-2.5"
              >
                <div class="p-1.5 rounded-lg {item.bgClass} {item.colorClass} border shrink-0 mt-0.5 transition-colors">
                  <item.icon class="w-3.5 h-3.5" />
                </div>

                <div class="flex-1 overflow-hidden">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                      {item.label}
                    </span>
                    {#if item.isVxml21}
                      <span class="text-[8px] px-1 rounded bg-purple-900 text-purple-300 font-bold border border-purple-700/50 flex items-center gap-0.5">
                        <Sparkles class="w-2 h-2 text-amber-300" /> 2.1
                      </span>
                    {/if}
                  </div>
                  <div class="text-[10px] font-mono text-slate-400">{item.tag}</div>
                  <div class="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</div>
                </div>

                <div class="opacity-0 group-hover:opacity-100 text-slate-400 self-center shrink-0 transition-opacity">
                  <Plus class="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  {:else}
    <!-- Collapsed View: Just icons -->
    <div class="flex-1 overflow-y-auto py-3 space-y-2 flex flex-col items-center">
      {#each paletteItems as item}
        <button
          draggable="true"
          ondragstart={(e) => handleDragStart(e, item.type)}
          onclick={() => onAddNode(item.type)}
          class="p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing relative group"
          title={`${item.label} (${item.tag})`}
        >
          <div class="{item.colorClass}">
            <item.icon class="w-4 h-4" />
          </div>
        </button>
      {/each}
    </div>
  {/if}
</aside>
