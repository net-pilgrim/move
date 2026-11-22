<script lang="ts">
  import { Search, Plus } from '@lucide/svelte';
  import { PALETTE_ITEMS, createBlock } from '../../lib/scratch/scratch-engine';
  import type { ScratchBlockCategory, ScratchBlockType } from '../../types/scratch';

  interface Props {
    onAddBlock: (type: ScratchBlockType) => void;
  }

  let { onAddBlock }: Props = $props();

  let selectedCategory = $state<ScratchBlockCategory | 'all'>('all');
  let searchQuery = $state('');

  const categories = [
    { id: 'all', label: 'All', color: '#64748b' },
    { id: 'dialogs', label: 'Dialogs', color: 'var(--scratch-dialogs)' },
    { id: 'prompts', label: 'Prompts', color: 'var(--scratch-prompts)' },
    { id: 'inputs', label: 'Inputs', color: 'var(--scratch-inputs)' },
    { id: 'logic', label: 'Logic', color: 'var(--scratch-logic)' },
    { id: 'control', label: 'Control', color: 'var(--scratch-control)' },
    { id: 'telephony', label: 'Telephony', color: 'var(--scratch-telephony)' }
  ];

  let filteredItems = $derived(
    PALETTE_ITEMS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    })
  );

  function getCatClass(cat: string): string {
    switch (cat) {
      case 'dialogs':
        return 'scratch-cat-dialogs';
      case 'prompts':
        return 'scratch-cat-prompts';
      case 'inputs':
        return 'scratch-cat-inputs';
      case 'logic':
        return 'scratch-cat-logic';
      case 'control':
        return 'scratch-cat-control';
      case 'telephony':
        return 'scratch-cat-telephony';
      default:
        return 'scratch-cat-dialogs';
    }
  }

  function handleDragStart(e: DragEvent, type: ScratchBlockType) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/scratch-new-block-type', type);
      e.dataTransfer.effectAllowed = 'copy';
    }
  }
</script>

<aside class="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none h-full z-20">
  <!-- Search Header -->
  <div class="p-3 border-b border-slate-800">
    <div class="relative">
      <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search Scratch blocks..."
        class="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  </div>

  <!-- Category Filter Bar (Scratch style colored circle pills) -->
  <div class="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
    {#each categories as cat}
      <button
        type="button"
        onclick={() => (selectedCategory = cat.id as any)}
        class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 {selectedCategory === cat.id
          ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
      >
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          style="background-color: {cat.color};"
        ></span>
        <span>{cat.label}</span>
      </button>
    {/each}
  </div>

  <!-- Palette Blocks List -->
  <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
    {#each filteredItems as item (item.type)}
      <div
        role="button"
        tabindex="0"
        draggable={true}
        ondragstart={(e) => handleDragStart(e, item.type)}
        onclick={() => onAddBlock(item.type)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAddBlock(item.type);
          }
        }}
        class="group text-left w-full cursor-pointer transition-transform hover:-translate-y-0.5"
      >
        <!-- Mock Block Appearance -->
        <div
          class="scratch-block {getCatClass(item.category)} {item.shape === 'hat' ? 'scratch-shape-hat' : item.shape === 'cap' ? 'scratch-shape-cap' : 'scratch-shape-stack'} w-full !mb-0 p-2 text-xs font-semibold flex items-center justify-between"
        >
          <div class="flex items-center gap-1.5 flex-1 min-w-0">
            <span class="truncate">{item.label}</span>
            {#if item.shape === 'c-block' || item.shape === 'c-block-if'}
              <span class="text-[9px] bg-black/25 px-1 py-0.5 rounded font-mono">WRAP</span>
            {/if}
          </div>
          <Plus class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0" />
        </div>
        <p class="text-[10px] text-slate-400 mt-1 px-1 line-clamp-1 group-hover:text-slate-300">
          {item.description}
        </p>
      </div>
    {/each}

    {#if filteredItems.length === 0}
      <div class="text-center py-8 text-xs text-slate-500">
        No blocks matching "{searchQuery}"
      </div>
    {/if}
  </div>

  <!-- Footer Tip -->
  <div class="p-2.5 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
    <span>💡 Click or drag onto canvas</span>
  </div>
</aside>
