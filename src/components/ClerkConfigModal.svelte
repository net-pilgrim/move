<script lang="ts">
  import { X, ShieldCheck, Key, ExternalLink, Copy, Check, Lock } from '@lucide/svelte';

  let { isOpen = false, onClose }: { isOpen: boolean; onClose: () => void } = $props();

  let copied = $state(false);

  const envSnippet = `# Create .env.local in the root directory:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here`;

  function handleCopy() {
    navigator.clipboard.writeText(envSnippet);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2500);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Lock class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm">Clerk Authentication Setup</h3>
            <p class="text-xs text-slate-400">Secure user accounts, cloud flow persistence & team access</p>
          </div>
        </div>
        <button
          onclick={onClose}
          class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-4 text-xs text-slate-300 overflow-y-auto max-h-[75vh]">
        <div class="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3.5 space-y-2">
          <div class="flex items-center gap-2 font-semibold text-indigo-300">
            <ShieldCheck class="w-4 h-4" />
            <span>Currently Running in Local Guest Mode</span>
          </div>
          <p class="text-slate-400 leading-relaxed">
            All VoiceXML 2.1 authoring, validation, SRGS grammar editing, and IVR simulations work 100% locally in guest mode without needing any external accounts.
          </p>
        </div>

        <div>
          <h4 class="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <Key class="w-4 h-4 text-amber-400" />
            <span>Connect Clerk in 3 Simple Steps:</span>
          </h4>
          <ol class="space-y-2.5 list-decimal list-inside text-slate-300 pl-1">
            <li class="leading-relaxed">
              Sign up or log in to the
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noreferrer"
                class="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-0.5 ml-1"
              >
                Clerk Dashboard <ExternalLink class="w-3 h-3" />
              </a>.
            </li>
            <li class="leading-relaxed">
              Create a new application and copy your <strong>Publishable Key</strong> (starts with <code class="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">pk_test_...</code>).
            </li>
            <li class="leading-relaxed">
              Paste it into a <code class="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">.env.local</code> file in this project root:
            </li>
          </ol>
        </div>

        <!-- Code Block -->
        <div class="relative bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[11px]">
          <pre class="text-emerald-400 overflow-x-auto">{envSnippet}</pre>
          <button
            onclick={handleCopy}
            class="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
            title="Copy to clipboard"
          >
            {#if copied}
              <Check class="w-3 h-3 text-emerald-400" />
              <span class="text-emerald-400">Copied</span>
            {:else}
              <Copy class="w-3 h-3" />
              <span>Copy</span>
            {/if}
          </button>
        </div>

        <div class="border-t border-slate-800 pt-3 text-[11px] text-slate-400">
          Once <code class="text-indigo-300 font-mono">.env.local</code> is saved, Vite will automatically reload, enabling Clerk's drop-in user profile, avatar, Google/GitHub sign-in, and session management.
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
        <button
          onclick={onClose}
          class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  </div>
{/if}
