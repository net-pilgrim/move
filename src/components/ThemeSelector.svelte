<script lang="ts">
  import { Sun, Moon, Laptop, Palette, Check } from '@lucide/svelte';
  import { theme, THEME_COLORS, type ThemeColor } from '../lib/theme/theme.svelte';

  let isOpen = $state(false);

  function handleSelectColor(colorId: ThemeColor) {
    theme.setColor(colorId);
    isOpen = false;
  }
</script>

<div class="theme-selector-container">
  <!-- Mode Quick Toggle -->
  <button
    type="button"
    class="theme-mode-btn"
    onclick={() => theme.toggleMode()}
    title={`Current mode: ${theme.mode}. Click to toggle light/dark.`}
    aria-label="Toggle light and dark mode"
  >
    {#if theme.mode === 'dark'}
      <Moon class="theme-icon" />
    {:else if theme.mode === 'light'}
      <Sun class="theme-icon" />
    {:else}
      <Laptop class="theme-icon" />
    {/if}
  </button>

  <!-- Color Palette Dropdown Trigger -->
  <div class="palette-dropdown-wrapper">
    <button
      type="button"
      class="theme-palette-btn"
      onclick={() => (isOpen = !isOpen)}
      title="Choose theme accent color"
      aria-label="Theme accent color"
    >
      <Palette class="theme-icon" />
      <span class="active-color-dot" style="background-color: var(--pico-primary);"></span>
    </button>

    {#if isOpen}
      <!-- Backdrop to close -->
      <button
        type="button"
        class="palette-backdrop"
        onclick={() => (isOpen = false)}
        aria-label="Close palette selector"
        tabindex="-1"
      ></button>

      <!-- Dropdown Card -->
      <div class="palette-menu">
        <div class="palette-header">
          <span class="palette-title">Theme Palette</span>
          <div class="mode-toggles">
            <button
              type="button"
              class="mode-pill {theme.mode === 'light' ? 'active' : ''}"
              onclick={() => theme.setMode('light')}
              title="Light mode"
            >
              <Sun class="mode-mini-icon" />
            </button>
            <button
              type="button"
              class="mode-pill {theme.mode === 'dark' ? 'active' : ''}"
              onclick={() => theme.setMode('dark')}
              title="Dark mode"
            >
              <Moon class="mode-mini-icon" />
            </button>
            <button
              type="button"
              class="mode-pill {theme.mode === 'auto' ? 'active' : ''}"
              onclick={() => theme.setMode('auto')}
              title="System preference"
            >
              <Laptop class="mode-mini-icon" />
            </button>
          </div>
        </div>

        <div class="palette-grid">
          {#each THEME_COLORS as c}
            <button
              type="button"
              class="color-option {theme.color === c.id ? 'selected' : ''}"
              onclick={() => handleSelectColor(c.id)}
              title={c.label}
            >
              <span class="color-swatch" style="background-color: {c.preview};">
                {#if theme.color === c.id}
                  <Check class="check-icon" />
                {/if}
              </span>
              <span class="color-name">{c.label}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .theme-selector-container {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    position: relative;
  }

  .theme-mode-btn,
  .theme-palette-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.5rem;
    margin: 0;
    font-size: 0.75rem;
    border-radius: var(--pico-border-radius);
    background: var(--pico-card-background-color);
    border: 1px solid var(--pico-muted-border-color);
    color: var(--pico-color);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    box-shadow: none;
    line-height: 1;
    gap: 0.35rem;
  }

  .theme-mode-btn:hover,
  .theme-palette-btn:hover {
    background: var(--pico-form-element-background-color);
    border-color: var(--pico-primary);
    color: var(--pico-primary);
  }

  :global(.theme-icon) {
    width: 0.95rem;
    height: 0.95rem;
  }

  :global(.mode-mini-icon) {
    width: 0.85rem;
    height: 0.85rem;
  }

  .active-color-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    display: inline-block;
  }

  .palette-dropdown-wrapper {
    position: relative;
  }

  .palette-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
  }

  .palette-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    z-index: 50;
    width: 17rem;
    background: var(--pico-card-background-color);
    border: 1px solid var(--pico-border-color);
    border-radius: calc(var(--pico-border-radius) * 1.5);
    box-shadow: var(--pico-box-shadow);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .palette-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--pico-muted-border-color);
  }

  .palette-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--pico-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mode-toggles {
    display: inline-flex;
    background: var(--pico-background-color);
    border: 1px solid var(--pico-muted-border-color);
    border-radius: var(--pico-border-radius);
    padding: 0.15rem;
    gap: 0.15rem;
  }

  .mode-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.4rem;
    margin: 0;
    border-radius: calc(var(--pico-border-radius) * 0.7);
    background: transparent;
    border: none;
    color: var(--pico-muted-color);
    cursor: pointer;
    box-shadow: none;
  }

  .mode-pill.active {
    background: var(--pico-primary-background);
    color: var(--pico-primary-inverse);
  }

  .palette-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
  }

  .color-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    margin: 0;
    border-radius: var(--pico-border-radius);
    background: var(--pico-background-color);
    border: 1px solid var(--pico-muted-border-color);
    color: var(--pico-color);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.1s ease;
    box-shadow: none;
    text-align: left;
  }

  .color-option:hover {
    border-color: var(--pico-primary);
  }

  .color-option.selected {
    border-color: var(--pico-primary);
    background: var(--pico-form-element-background-color);
    font-weight: 600;
  }

  .color-swatch {
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
  }

  :global(.check-icon) {
    width: 0.65rem;
    height: 0.65rem;
    stroke-width: 3.5;
  }

  .color-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
