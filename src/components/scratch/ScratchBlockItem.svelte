<script lang="ts">
  import {
    Trash2,
    Copy,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Plus,
    MessageSquare,
    PhoneCall,
    Volume2,
    Code,
    Sliders,
    ArrowRight
  } from '@lucide/svelte';
  import ScratchBlockItem from './ScratchBlockItem.svelte';
  import type { ScratchBlock, ScratchBlockType } from '../../types/scratch';
  import { PALETTE_ITEMS, createBlock } from '../../lib/scratch/scratch-engine';

  interface Props {
    block: ScratchBlock;
    index: number;
    parentList: ScratchBlock[];
    isNested?: boolean;
    onChange?: () => void;
    onDelete?: (blockId: string) => void;
    onDuplicate?: (block: ScratchBlock) => void;
  }

  let {
    block = $bindable(),
    index,
    parentList,
    isNested = false,
    onChange,
    onDelete,
    onDuplicate
  }: Props = $props();

  let isCollapsed = $state(false);
  let showAddChildMenu = $state(false);

  function getCategoryClass(cat: string): string {
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

  function handleAddChild(type: ScratchBlockType) {
    if (!block.children) {
      block.children = [];
    }
    block.children.push(createBlock(type));
    showAddChildMenu = false;
    onChange?.();
  }

  function handleAddElseChild(type: ScratchBlockType) {
    if (!block.elseChildren) {
      block.elseChildren = [];
    }
    block.elseChildren.push(createBlock(type));
    onChange?.();
  }

  function handleDeleteChild(childId: string) {
    if (block.children) {
      block.children = block.children.filter((c) => c.id !== childId);
    }
    if (block.elseChildren) {
      block.elseChildren = block.elseChildren.filter((c) => c.id !== childId);
    }
    onChange?.();
  }

  function handleDuplicateChild(childBlock: ScratchBlock) {
    const dup = JSON.parse(JSON.stringify(childBlock));
    dup.id = `block_${Math.random().toString(36).substring(2, 8)}`;
    if (block.children && block.children.some((c) => c.id === childBlock.id)) {
      const idx = block.children.findIndex((c) => c.id === childBlock.id);
      block.children.splice(idx + 1, 0, dup);
    } else if (block.elseChildren && block.elseChildren.some((c) => c.id === childBlock.id)) {
      const idx = block.elseChildren.findIndex((c) => c.id === childBlock.id);
      block.elseChildren.splice(idx + 1, 0, dup);
    }
    onChange?.();
  }

  function handleDragStart(e: DragEvent) {
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/scratch-block-id', block.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  }
</script>

<div
  class="scratch-block {getCategoryClass(block.category)} {block.shape === 'hat' ? 'scratch-shape-hat' : block.shape === 'cap' ? 'scratch-shape-cap' : 'scratch-shape-stack'} mb-1.5"
  draggable={true}
  ondragstart={handleDragStart}
  role="group"
  aria-label="Scratch Block {block.type}"
>
  <!-- Top Puzzle Notch (for stack and cap blocks) -->
  {#if block.shape !== 'hat' && !isNested}
    <div class="scratch-notch-top"></div>
  {/if}

  <!-- Block Header & Inline Parameters -->
  <div class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold leading-none shadow-sm min-h-[36px] flex-wrap">
    <!-- Collapse / Expand for C-Blocks -->
    {#if block.shape.startsWith('c-block')}
      <button
        type="button"
        onclick={() => (isCollapsed = !isCollapsed)}
        class="p-0.5 hover:bg-black/20 rounded transition-colors"
        title="Collapse/Expand block"
      >
        {#if isCollapsed}
          <ChevronRight class="w-3.5 h-3.5 text-white/90" />
        {:else}
          <ChevronDown class="w-3.5 h-3.5 text-white/90" />
        {/if}
      </button>
    {/if}

    <!-- Grip Handle -->
    <span class="cursor-grab text-white/60 hover:text-white inline-flex items-center">
      <GripVertical class="w-3.5 h-3.5" />
    </span>

    <!-- Specific Block Label & Parameters -->
    {#if block.type === 'when_start'}
      <span>when call starts &rarr; goto</span>
      <input
        type="text"
        bind:value={block.params.next}
        oninput={onChange}
        placeholder="target_dialog"
        class="scratch-input-pill w-28"
      />

    {:else if block.type === 'dialog_form'}
      <span class="uppercase tracking-wider text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono">FORM</span>
      <span>#</span>
      <input
        type="text"
        bind:value={block.params.id}
        oninput={onChange}
        placeholder="form_id"
        class="scratch-input-pill w-28 font-bold"
      />

    {:else if block.type === 'dialog_menu'}
      <span class="uppercase tracking-wider text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono">MENU</span>
      <span>#</span>
      <input
        type="text"
        bind:value={block.params.id}
        oninput={onChange}
        placeholder="menu_id"
        class="scratch-input-pill w-28 font-bold"
      />
      <label class="flex items-center gap-1 text-[11px] font-normal cursor-pointer ml-1 bg-black/15 px-1.5 py-0.5 rounded-full">
        <input
          type="checkbox"
          bind:checked={block.params.dtmf}
          onchange={onChange}
          class="rounded accent-amber-500 cursor-pointer"
        />
        <span>DTMF touch-tone</span>
      </label>

    {:else if block.type === 'prompt_say'}
      <Volume2 class="w-3.5 h-3.5 opacity-80" />
      <span>say</span>
      <input
        type="text"
        bind:value={block.params.text}
        oninput={onChange}
        placeholder="Text to speak..."
        class="scratch-input-pill flex-1 min-w-[200px]"
      />

    {:else if block.type === 'prompt_audio'}
      <Volume2 class="w-3.5 h-3.5 opacity-80" />
      <span>play audio</span>
      <input
        type="text"
        bind:value={block.params.src}
        oninput={onChange}
        placeholder="audio.wav"
        class="scratch-input-pill w-28 font-mono"
      />
      <span>fallback</span>
      <input
        type="text"
        bind:value={block.params.text}
        oninput={onChange}
        placeholder="Prompt text"
        class="scratch-input-pill w-32"
      />

    {:else if block.type === 'prompt_config'}
      <span>prompt settings: bargein</span>
      <select
        bind:value={block.params.bargein}
        onchange={onChange}
        class="scratch-select-pill"
      >
        <option value={true}>true</option>
        <option value={false}>false</option>
      </select>
      <span>timeout</span>
      <input
        type="text"
        bind:value={block.params.timeout}
        oninput={onChange}
        placeholder="5s"
        class="scratch-input-pill w-14"
      />

    {:else if block.type === 'input_field'}
      <span class="uppercase tracking-wider text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono">FIELD</span>
      <input
        type="text"
        bind:value={block.params.name}
        oninput={onChange}
        placeholder="field_name"
        class="scratch-input-pill w-24 font-bold"
      />
      <span>type</span>
      <select
        bind:value={block.params.type}
        onchange={onChange}
        class="scratch-select-pill font-mono"
      >
        <option value="digits">digits</option>
        <option value="boolean">boolean</option>
        <option value="number">number</option>
        <option value="phone">phone</option>
        <option value="currency">currency</option>
        <option value="time">time</option>
        <option value="date">date</option>
        <option value="custom">custom SRGS</option>
      </select>

    {:else if block.type === 'input_choice'}
      <span>[DTMF</span>
      <input
        type="text"
        bind:value={block.params.dtmf}
        oninput={onChange}
        placeholder="1"
        class="scratch-input-pill w-10 text-center font-bold"
      />
      <span>] label</span>
      <input
        type="text"
        bind:value={block.params.text}
        oninput={onChange}
        placeholder="Option text..."
        class="scratch-input-pill w-32"
      />
      <span>&rarr; goto</span>
      <input
        type="text"
        bind:value={block.params.next}
        oninput={onChange}
        placeholder="target_dialog"
        class="scratch-input-pill w-28"
      />

    {:else if block.type === 'input_record'}
      <span>record into</span>
      <input
        type="text"
        bind:value={block.params.name}
        oninput={onChange}
        placeholder="var_name"
        class="scratch-input-pill w-24"
      />
      <span>maxtime</span>
      <input
        type="text"
        bind:value={block.params.maxtime}
        oninput={onChange}
        placeholder="30s"
        class="scratch-input-pill w-14"
      />
      <label class="flex items-center gap-1 text-[11px] font-normal cursor-pointer bg-black/15 px-1.5 py-0.5 rounded-full">
        <input
          type="checkbox"
          bind:checked={block.params.beep}
          onchange={onChange}
          class="accent-blue-500"
        />
        <span>beep</span>
      </label>

    {:else if block.type === 'grammar_builtin'}
      <span>grammar</span>
      <input
        type="text"
        bind:value={block.params.type}
        oninput={onChange}
        placeholder="digits"
        class="scratch-input-pill w-20"
      />
      <input
        type="text"
        bind:value={block.params.params}
        oninput={onChange}
        placeholder="?minlength=4;maxlength=6"
        class="scratch-input-pill w-44"
      />

    {:else if block.type === 'logic_assign'}
      <span>assign</span>
      <input
        type="text"
        bind:value={block.params.name}
        oninput={onChange}
        placeholder="var_name"
        class="scratch-input-pill w-24 font-mono font-bold"
      />
      <span>=</span>
      <input
        type="text"
        bind:value={block.params.expr}
        oninput={onChange}
        placeholder="expr"
        class="scratch-input-pill w-36 font-mono"
      />

    {:else if block.type === 'logic_var'}
      <span>declare var</span>
      <input
        type="text"
        bind:value={block.params.name}
        oninput={onChange}
        placeholder="var_name"
        class="scratch-input-pill w-24 font-mono"
      />
      <span>init</span>
      <input
        type="text"
        bind:value={block.params.expr}
        oninput={onChange}
        placeholder="0 or 'val'"
        class="scratch-input-pill w-28 font-mono"
      />

    {:else if block.type === 'logic_script'}
      <Code class="w-3.5 h-3.5 opacity-80" />
      <span>script</span>
      <input
        type="text"
        bind:value={block.params.code}
        oninput={onChange}
        placeholder="ecmascript code..."
        class="scratch-input-pill flex-1 font-mono text-[11px] min-w-[160px]"
      />

    {:else if block.type === 'control_goto'}
      <ArrowRight class="w-3.5 h-3.5 opacity-80" />
      <span>goto #</span>
      <input
        type="text"
        bind:value={block.params.next}
        oninput={onChange}
        placeholder="target_dialog"
        class="scratch-input-pill w-28 font-bold"
      />

    {:else if block.type === 'control_if'}
      <span>if</span>
      <input
        type="text"
        bind:value={block.params.condition}
        oninput={onChange}
        placeholder="condition expression"
        class="scratch-input-pill flex-1 font-mono min-w-[140px]"
      />
      <span>then</span>

    {:else if block.type === 'control_subdialog'}
      <span>subdialog</span>
      <input
        type="text"
        bind:value={block.params.name}
        oninput={onChange}
        placeholder="sub_name"
        class="scratch-input-pill w-24"
      />
      <span>src</span>
      <input
        type="text"
        bind:value={block.params.src}
        oninput={onChange}
        placeholder="sub.vxml"
        class="scratch-input-pill w-28 font-mono"
      />

    {:else if block.type === 'control_submit'}
      <span>submit to</span>
      <input
        type="text"
        bind:value={block.params.next}
        oninput={onChange}
        placeholder="url.php"
        class="scratch-input-pill w-28 font-mono"
      />
      <span>namelist</span>
      <input
        type="text"
        bind:value={block.params.namelist}
        oninput={onChange}
        placeholder="var1 var2"
        class="scratch-input-pill w-24"
      />

    {:else if block.type === 'telephony_transfer'}
      <PhoneCall class="w-3.5 h-3.5 opacity-80" />
      <span>transfer call to</span>
      <input
        type="text"
        bind:value={block.params.dest}
        oninput={onChange}
        placeholder="tel:+18005550199"
        class="scratch-input-pill w-36 font-mono font-bold"
      />
      <label class="flex items-center gap-1 text-[11px] font-normal cursor-pointer bg-black/15 px-1.5 py-0.5 rounded-full">
        <input
          type="checkbox"
          bind:checked={block.params.bridge}
          onchange={onChange}
          class="accent-rose-500"
        />
        <span>bridge</span>
      </label>

    {:else if block.type === 'telephony_disconnect'}
      <span>disconnect call</span>
      <input
        type="text"
        bind:value={block.params.message}
        oninput={onChange}
        placeholder="Optional goodbye message"
        class="scratch-input-pill w-44"
      />

    {:else if block.type === 'telephony_exit'}
      <span>exit app expr</span>
      <input
        type="text"
        bind:value={block.params.expr}
        oninput={onChange}
        placeholder="'exit_code'"
        class="scratch-input-pill w-24 font-mono"
      />

    {:else if block.type === 'data_fetch'}
      <span class="bg-black/25 px-1.5 py-0.5 rounded text-[10px] font-mono">DATA</span>
      <span>fetch</span>
      <input
        type="text"
        bind:value={block.params.src}
        oninput={onChange}
        placeholder="https://api..."
        class="scratch-input-pill w-40 font-mono"
      />
      <span>as</span>
      <input
        type="text"
        bind:value={block.params.name}
        oninput={onChange}
        placeholder="data_name"
        class="scratch-input-pill w-24 font-mono"
      />
      <select
        bind:value={block.params.method}
        onchange={onChange}
        class="scratch-select-pill font-mono"
      >
        <option value="get">GET</option>
        <option value="post">POST</option>
      </select>

    {:else if block.type === 'event_catch'}
      <span>catch event</span>
      <select
        bind:value={block.params.event}
        onchange={onChange}
        class="scratch-select-pill font-mono"
      >
        <option value="noinput">noinput</option>
        <option value="nomatch">nomatch</option>
        <option value="help">help</option>
        <option value="error">error</option>
        <option value="connection.disconnect.hangup">hangup</option>
      </select>
    {/if}

    <!-- Block Control Actions (Right aligned) -->
    <div class="ml-auto flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
      {#if onDuplicate}
        <button
          type="button"
          onclick={() => onDuplicate(block)}
          class="p-1 hover:bg-black/25 rounded transition-colors"
          title="Duplicate block"
        >
          <Copy class="w-3 h-3 text-white" />
        </button>
      {/if}

      {#if onDelete}
        <button
          type="button"
          onclick={() => onDelete(block.id)}
          class="p-1 hover:bg-rose-950/60 rounded transition-colors text-white hover:text-rose-300"
          title="Delete block"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      {/if}
    </div>
  </div>

  <!-- C-Block Mouth (Children Slot) -->
  {#if block.shape.startsWith('c-block') && !isCollapsed}
    <div class="scratch-c-body">
      <!-- Left Connecting Spine -->
      <div class="scratch-c-spine"></div>

      <!-- Inner Drop / Children Slot -->
      <div class="scratch-c-slot">
        {#if block.children && block.children.length > 0}
          {#each block.children as child, cIdx (child.id)}
            <ScratchBlockItem
              block={child}
              index={cIdx}
              parentList={block.children}
              isNested={true}
              {onChange}
              onDelete={handleDeleteChild}
              onDuplicate={handleDuplicateChild}
            />
          {/each}
        {:else}
          <div class="text-[11px] text-slate-400/80 italic py-1 px-2 select-none">
            Drop child blocks or click (+) to add items inside
          </div>
        {/if}

        <!-- Add Child Quick Button -->
        <div class="relative mt-1">
          <button
            type="button"
            onclick={() => (showAddChildMenu = !showAddChildMenu)}
            class="flex items-center gap-1 text-[11px] text-white/80 hover:text-white bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded transition-colors"
          >
            <Plus class="w-3 h-3" />
            <span>Add block inside</span>
          </button>

          {#if showAddChildMenu}
            <div class="absolute left-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-30 max-h-60 overflow-y-auto">
              <div class="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompts & Speech</div>
              <button
                type="button"
                onclick={() => handleAddChild('prompt_say')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-purple-900/40 hover:text-purple-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>say [prompt]</span>
              </button>
              <button
                type="button"
                onclick={() => handleAddChild('prompt_audio')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-purple-900/40 hover:text-purple-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>play audio [src]</span>
              </button>

              <div class="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 border-t border-slate-800">Inputs & Choices</div>
              <button
                type="button"
                onclick={() => handleAddChild('input_choice')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-blue-900/40 hover:text-blue-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>choice [dtmf] &rarr; goto</span>
              </button>
              <button
                type="button"
                onclick={() => handleAddChild('input_field')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-blue-900/40 hover:text-blue-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>field [name] [type]</span>
              </button>
              <button
                type="button"
                onclick={() => handleAddChild('input_record')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-blue-900/40 hover:text-blue-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>record [audio]</span>
              </button>

              <div class="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 border-t border-slate-800">Flow & Logic</div>
              <button
                type="button"
                onclick={() => handleAddChild('control_goto')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-orange-900/40 hover:text-orange-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>goto #[target]</span>
              </button>
              <button
                type="button"
                onclick={() => handleAddChild('logic_assign')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-green-900/40 hover:text-green-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span>assign [var] = [expr]</span>
              </button>
              <button
                type="button"
                onclick={() => handleAddChild('control_if')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-orange-900/40 hover:text-orange-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>if &lt;cond&gt; then ... else ...</span>
              </button>

              <div class="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 border-t border-slate-800">Telephony</div>
              <button
                type="button"
                onclick={() => handleAddChild('telephony_transfer')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-rose-900/40 hover:text-rose-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                <span>transfer to [tel]</span>
              </button>
              <button
                type="button"
                onclick={() => handleAddChild('telephony_disconnect')}
                class="w-full text-left px-2.5 py-1 text-xs text-slate-200 hover:bg-rose-900/40 hover:text-rose-300 flex items-center gap-1.5"
              >
                <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                <span>disconnect call</span>
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- If-Else Middle Divider & Else Slot -->
    {#if block.shape === 'c-block-if'}
      <div class="scratch-c-divider text-xs font-semibold">
        <span>else</span>
      </div>
      <div class="scratch-c-body">
        <div class="scratch-c-spine"></div>
        <div class="scratch-c-slot">
          {#if block.elseChildren && block.elseChildren.length > 0}
            {#each block.elseChildren as eChild, eIdx (eChild.id)}
              <ScratchBlockItem
                block={eChild}
                index={eIdx}
                parentList={block.elseChildren}
                isNested={true}
                {onChange}
                onDelete={handleDeleteChild}
                onDuplicate={handleDuplicateChild}
              />
            {/each}
          {:else}
            <div class="text-[11px] text-slate-400/80 italic py-1 px-2 select-none">
              Else branch blocks
            </div>
          {/if}
          <button
            type="button"
            onclick={() => handleAddElseChild('prompt_say')}
            class="flex items-center gap-1 text-[11px] text-white/80 hover:text-white bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded transition-colors w-fit mt-1"
          >
            <Plus class="w-3 h-3" />
            <span>Add block in else</span>
          </button>
        </div>
      </div>
    {/if}

    <!-- Bottom closing bar of C-Block -->
    <div class="scratch-c-footer"></div>
  {/if}
</div>
