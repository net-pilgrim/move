<script lang="ts">
  import {
    Plus,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Sparkles,
    Play,
    Copy,
    Download,
    Check,
    Code,
    LayoutGrid,
    ShieldAlert,
    CheckCircle2,
    Layers,
    ChevronLeft,
    ChevronRight
  } from '@lucide/svelte';
  import ScratchToolbox from './ScratchToolbox.svelte';
  import ScratchBlockItem from './ScratchBlockItem.svelte';
  import type { ScratchBlock, ScratchBlockType } from '../../types/scratch';
  import {
    createBlock,
    scratchToVxml,
    SCRATCH_TEMPLATES
  } from '../../lib/scratch/scratch-engine';
  import type { VxmlDocSettings } from '../../types/vxml';

  interface Props {
    blocks: ScratchBlock[];
    docSettings: VxmlDocSettings;
    onChange?: () => void;
    onRunSimulator?: () => void;
  }

  let {
    blocks = $bindable(),
    docSettings,
    onChange,
    onRunSimulator
  }: Props = $props();

  let zoom = $state(1);
  let showCodeDrawer = $state(true);
  let copyFeedback = $state(false);

  // Live generated VoiceXML from current blocks
  let vxmlCode = $derived(scratchToVxml(blocks, docSettings));

  // Quick diagnostics
  let totalBlocksCount = $derived.by(() => {
    let count = 0;
    function countBlocks(list: ScratchBlock[]) {
      for (const b of list) {
        count++;
        if (b.children) countBlocks(b.children);
        if (b.elseChildren) countBlocks(b.elseChildren);
      }
    }
    countBlocks(blocks);
    return count;
  });

  let dialogIds = $derived.by(() => {
    const ids: string[] = [];
    for (const b of blocks) {
      if (b.type === 'dialog_form' || b.type === 'dialog_menu') {
        if (b.params.id) ids.push(b.params.id);
      }
    }
    return ids;
  });

  let duplicateIds = $derived(
    dialogIds.filter((id, index) => dialogIds.indexOf(id) !== index)
  );

  function handleAddTopLevelBlock(type: ScratchBlockType) {
    const newBlock = createBlock(type);
    blocks = [...blocks, newBlock];
    onChange?.();
  }

  function handleDeleteTopLevelBlock(blockId: string) {
    blocks = blocks.filter((b) => b.id !== blockId);
    onChange?.();
  }

  function handleDuplicateTopLevelBlock(block: ScratchBlock) {
    const dup = JSON.parse(JSON.stringify(block));
    dup.id = `block_${Math.random().toString(36).substring(2, 8)}`;
    if (dup.params?.id) {
      dup.params.id = `${dup.params.id}_copy`;
    }
    const idx = blocks.findIndex((b) => b.id === block.id);
    blocks.splice(idx + 1, 0, dup);
    blocks = [...blocks];
    onChange?.();
  }

  function handleCanvasDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleCanvasDrop(e: DragEvent) {
    e.preventDefault();
    const newType = e.dataTransfer?.getData('text/scratch-new-block-type') as ScratchBlockType;
    if (newType) {
      handleAddTopLevelBlock(newType);
    }
  }

  function handleZoomIn() {
    zoom = Math.min(1.5, Math.round((zoom + 0.1) * 10) / 10);
  }

  function handleZoomOut() {
    zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10);
  }

  function handleResetZoom() {
    zoom = 1;
  }

  function handleCleanUpBlocks() {
    // Organizes top level blocks neatly
    blocks = [...blocks];
    onChange?.();
  }

  function handleLoadTemplate(templateId: string) {
    const t = SCRATCH_TEMPLATES.find((tpl) => tpl.id === templateId);
    if (!t) return;
    blocks = JSON.parse(JSON.stringify(t.blocks));
    onChange?.();
  }

  function handleCopyVxml() {
    navigator.clipboard.writeText(vxmlCode);
    copyFeedback = true;
    setTimeout(() => {
      copyFeedback = false;
    }, 2000);
  }

  function handleExportVxmlFile() {
    const blob = new Blob([vxmlCode], { type: 'application/voicexml+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scratch-callflow.vxml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
</script>

<div class="flex-1 flex w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-slate-950 select-none">
  <!-- Left Column: Scratch Block Toolbox -->
  <ScratchToolbox onAddBlock={handleAddTopLevelBlock} />

  <!-- Center Column: Scratch Workspace Canvas -->
  <div class="flex-1 flex flex-col h-full relative overflow-hidden">
    <!-- Workspace Top Action Bar -->
    <div class="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-10 shrink-0">
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={() => handleAddTopLevelBlock('dialog_form')}
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Form</span>
        </button>

        <button
          type="button"
          onclick={() => handleAddTopLevelBlock('dialog_menu')}
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold shadow transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>+ Menu</span>
        </button>

        <!-- Scratch Templates -->
        <div class="relative ml-2">
          <select
            onchange={(e) => handleLoadTemplate(e.currentTarget.value)}
            class="bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="" disabled selected>Scratch Templates...</option>
            {#each SCRATCH_TEMPLATES as t}
              <option value={t.id}>{t.name}</option>
            {/each}
          </select>
        </div>

        <button
          type="button"
          onclick={handleCleanUpBlocks}
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors ml-1"
          title="Clean up block layout"
        >
          <LayoutGrid class="w-3.5 h-3.5 text-slate-400" />
          <span>Clean Up</span>
        </button>
      </div>

      <!-- Center / Right Controls: Zoom & Drawer Toggle -->
      <div class="flex items-center gap-2">
        <!-- Zoom Controls -->
        <div class="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            type="button"
            onclick={handleZoomOut}
            class="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut class="w-3.5 h-3.5" />
          </button>
          <span class="px-2 text-[11px] font-mono text-slate-300 font-semibold min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onclick={handleZoomIn}
            class="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onclick={handleResetZoom}
            class="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors ml-0.5"
            title="Reset Zoom"
          >
            <RotateCcw class="w-3 h-3" />
          </button>
        </div>

        <!-- Toggle Live Code Drawer -->
        <button
          type="button"
          onclick={() => (showCodeDrawer = !showCodeDrawer)}
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-800/40 text-xs font-medium transition-colors"
        >
          <Code class="w-3.5 h-3.5" />
          <span>{showCodeDrawer ? 'Hide Code' : 'Show Code'}</span>
        </button>
      </div>
    </div>

    <!-- Infinite / Scrollable Scratch Canvas -->
    <div
      role="region"
      aria-label="Scratch workspace canvas"
      class="flex-1 overflow-auto scratch-workspace-canvas p-8 relative"
      ondragover={handleCanvasDragOver}
      ondrop={handleCanvasDrop}
    >
      <div
        class="transition-transform origin-top-left flex flex-col gap-6 min-h-full min-w-full pb-32"
        style="transform: scale({zoom});"
      >
        {#if blocks.length === 0}
          <div class="m-auto text-center py-20 px-4 max-w-md bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-sm">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-950/40">
              <Layers class="w-6 h-6" />
            </div>
            <h3 class="text-sm font-bold text-white mb-1">Scratch Workspace is Empty</h3>
            <p class="text-xs text-slate-400 mb-4">
              Click <strong>+ Form</strong> or <strong>+ Menu</strong> above, or select a block from the toolbox on the left to start building your voice application.
            </p>
            <div class="flex items-center justify-center gap-2">
              <button
                type="button"
                onclick={() => handleLoadTemplate('scratch_support_router')}
                class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow"
              >
                Load Starter Template
              </button>
            </div>
          </div>
        {:else}
          {#each blocks as block, idx (block.id)}
            <div class="w-fit">
              <ScratchBlockItem
                block={block}
                index={idx}
                parentList={blocks}
                onChange={onChange}
                onDelete={handleDeleteTopLevelBlock}
                onDuplicate={handleDuplicateTopLevelBlock}
              />
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Right Column: Live VXML Code & Telephony Simulator Drawer -->
  {#if showCodeDrawer}
    <aside class="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shrink-0 select-text">
      <!-- Drawer Header -->
      <div class="h-11 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
        <div class="flex items-center gap-2">
          <Code class="w-4 h-4 text-indigo-400" />
          <h2 class="text-xs font-bold text-white">VoiceXML 2.1 Preview</h2>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {totalBlocksCount} blocks
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            onclick={handleCopyVxml}
            class="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Copy VoiceXML to clipboard"
          >
            {#if copyFeedback}
              <Check class="w-3.5 h-3.5 text-emerald-400" />
            {:else}
              <Copy class="w-3.5 h-3.5" />
            {/if}
          </button>

          <button
            type="button"
            onclick={handleExportVxmlFile}
            class="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Download .vxml file"
          >
            <Download class="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>
      </div>

      <!-- Spec Validation Alert -->
      <div class="px-3 py-2 border-b border-slate-800 text-xs flex items-center justify-between {duplicateIds.length > 0 ? 'bg-rose-950/40 text-rose-300' : 'bg-emerald-950/30 text-emerald-300'}">
        <div class="flex items-center gap-1.5">
          {#if duplicateIds.length > 0}
            <ShieldAlert class="w-3.5 h-3.5 text-rose-400" />
            <span>Duplicate ID: {duplicateIds.join(', ')}</span>
          {:else}
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>Valid VXML 2.1 Document</span>
          {/if}
        </div>

        {#if onRunSimulator}
          <button
            type="button"
            onclick={onRunSimulator}
            class="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow transition-colors"
          >
            <Play class="w-3 h-3 fill-current" />
            <span>Simulate</span>
          </button>
        {/if}
      </div>

      <!-- Generated Code Body -->
      <div class="flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed bg-slate-950 text-slate-300">
        <pre class="whitespace-pre-wrap">{vxmlCode}</pre>
      </div>

      <!-- Drawer Footer Actions -->
      <div class="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <span class="text-[10px] text-slate-400">W3C VoiceXML 2.1 Standard</span>
        <button
          type="button"
          onclick={handleExportVxmlFile}
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Export .vxml</span>
        </button>
      </div>
    </aside>
  {/if}
</div>
