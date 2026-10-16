<script lang="ts">
  import { Phone, Lock, Sparkles, Shield, Key, AlertCircle } from '@lucide/svelte';
  import { auth } from '../lib/auth/clerk.svelte';

  let { onOpenConfigModal }: { onOpenConfigModal: () => void } = $props();
</script>

<div class="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans text-slate-100">
  <!-- Subtle decorative ambient background glows -->
  <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

  <div class="w-full max-w-md z-10 flex flex-col items-center space-y-6">
    <!-- Branding Header -->
    <div class="text-center flex flex-col items-center space-y-3">
      <div class="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-950/60 ring-1 ring-white/10">
        <Phone class="w-8 h-8" />
      </div>

      <div>
        <div class="flex items-center justify-center gap-2">
          <h1 class="text-xl font-bold tracking-tight text-white">VoiceXML 2.1 Editor</h1>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50 flex items-center gap-1 font-semibold">
            <Sparkles class="w-3 h-3 text-amber-300" /> VXML 2.1
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1">W3C Compliant Interactive Voice Flow Studio</p>
      </div>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs">
        <Lock class="w-3.5 h-3.5 text-indigo-400" />
        <span>Authentication Required</span>
      </div>
    </div>

    <!-- Auth Card or Embedded Clerk Sign-In Component -->
    <div class="w-full flex flex-col items-center">
      {#if auth.error}
        <!-- Initialization error alert -->
        <div class="w-full bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 text-xs space-y-2 mb-4">
          <div class="flex items-center gap-2 text-rose-300 font-semibold">
            <AlertCircle class="w-4 h-4" />
            <span>Authentication Error</span>
          </div>
          <p class="text-slate-300">{auth.error}</p>
          <button
            onclick={() => auth.init()}
            class="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      {/if}

      {#if auth.isConfigured}
        <!-- Embedded Clerk Sign-In Widget -->
        <div class="w-full flex justify-center">
          <div use:auth.mountSignIn class="w-full flex justify-center"></div>
        </div>
      {:else}
        <!-- Unconfigured Clerk Notification Card -->
        <div class="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-4 text-center">
          <div class="p-3 mx-auto w-fit rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield class="w-6 h-6" />
          </div>

          <div>
            <h2 class="font-bold text-slate-100 text-sm">Protected Workspace</h2>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              This deployment is configured to require authentication. Configure your Clerk Publishable Key to sign in.
            </p>
          </div>

          <button
            onclick={onOpenConfigModal}
            class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-colors flex items-center justify-center gap-2"
          >
            <Key class="w-4 h-4" />
            <span>Configure Clerk Key</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- Security & License Footer -->
    <div class="text-[11px] text-slate-400 text-center space-y-1">
      <p>Secure authentication powered by Clerk</p>
      <p class="font-mono text-slate-400">GNU AGPLv3 Licensed</p>
    </div>
  </div>
</div>
