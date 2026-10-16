<script lang="ts">
  import { auth } from '../lib/auth/clerk.svelte';
  import { LogIn, Shield } from '@lucide/svelte';

  let { onOpenConfigModal }: { onOpenConfigModal: () => void } = $props();
</script>

<div class="flex items-center gap-2">
  {#if !auth.isLoaded}
    <div class="w-7 h-7 rounded-full bg-slate-800 animate-pulse border border-slate-700"></div>
  {:else if auth.isConfigured}
    {#if auth.isSignedIn}
      <div class="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full py-0.5 px-1.5 shadow-sm">
        {#if auth.user?.fullName}
          <span class="text-xs text-slate-200 font-medium pl-1 hidden sm:inline max-w-[120px] truncate">
            {auth.user.fullName}
          </span>
        {/if}
        <!-- Clerk Mounts the official UserButton dropdown avatar widget here -->
        <div use:auth.mountUserButton class="flex items-center"></div>
      </div>
    {:else}
      <button
        onclick={() => auth.openSignIn()}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/40 transition-colors"
        title="Sign in with Clerk"
      >
        <LogIn class="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    {/if}
  {:else}
    <!-- Guest / Unconfigured Clerk Mode Button -->
    <button
      onclick={onOpenConfigModal}
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors group"
      title="Running in Guest Mode. Click to configure Clerk authentication."
    >
      <Shield class="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
      <span class="hidden sm:inline">Guest</span>
      <span class="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
        Clerk
      </span>
    </button>
  {/if}
</div>
