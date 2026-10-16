<script lang="ts">
  import { untrack } from 'svelte';
  import {
    SvelteFlow,
    Background,
    Controls,
    type Node,
    type Edge,
    type Connection
  } from '@xyflow/svelte';
  import {
    Phone,
    FileCode,
    Upload,
    Download,
    Sliders,
    Sparkles,
    LayoutGrid,
    CheckCircle2,
    ShieldAlert,
    Play,
    Check,
    FileUp,
    FolderDown,
    Save
  } from '@lucide/svelte';

  import { nodeTypes } from './components/nodes';
  import LeftSidebar from './components/LeftSidebar.svelte';
  import Inspector from './components/Inspector.svelte';
  import CodeModal from './components/CodeModal.svelte';
  import ImportModal from './components/ImportModal.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import DiagnosticsPanel from './components/DiagnosticsPanel.svelte';
  import SimulatorModal from './components/SimulatorModal.svelte';
  import GrammarModal from './components/GrammarModal.svelte';

  import { generateVxml } from './lib/vxml/generator';
  import { parseVxml } from './lib/vxml/parser';
  import { validateVxml } from './lib/vxml/validator';
  import { autoLayoutNodes } from './lib/vxml/layout';
  import { TEMPLATES } from './lib/templates/templates';
  import { IvrSimulator, type SimulatorState } from './lib/simulator/ivr-engine';
  import type { VxmlDocSettings, VxmlNodeType } from './types/vxml';
  import type { ParseResult } from './lib/vxml/parser';

  // Initialize with the Customer Support Router template
  const initialTemplate = TEMPLATES[0];

  let nodes = $state.raw<Node[]>(JSON.parse(JSON.stringify(initialTemplate.nodes)));
  let edges = $state.raw<Edge[]>(JSON.parse(JSON.stringify(initialTemplate.edges)));
  let docSettings = $state<VxmlDocSettings>(JSON.parse(JSON.stringify(initialTemplate.settings)));

  let selectedNode = $state<Node | null>(null);
  let isSidebarCollapsed = $state(false);

  // Modals state
  let showCodeModal = $state(false);
  let showImportModal = $state(false);
  let showSettingsModal = $state(false);
  let showDiagnostics = $state(false);
  let showSimulator = $state(false);
  let showGrammarModal = $state(false);
  let grammarModalXml = $state('');
  let grammarSaveHandler = $state<((xml: string) => void) | null>(null);

  function handleOpenGrammarStudio(initialXml: string = '', onSaveCallback?: (xml: string) => void) {
    grammarModalXml = initialXml;
    grammarSaveHandler = onSaveCallback || null;
    showGrammarModal = true;
  }

  // Toast / notification feedback
  let toastMessage = $state<string | null>(null);
  let fileInputRef = $state<HTMLInputElement | null>(null);

  function showToast(msg: string) {
    toastMessage = msg;
    setTimeout(() => {
      if (toastMessage === msg) toastMessage = null;
    }, 3000);
  }

  // Diagnostics and Code generation (derived)
  let diagnostics = $derived(validateVxml(nodes, edges, docSettings));
  let generatedVxml = $derived(generateVxml(nodes, edges, docSettings));

  let errorCount = $derived(diagnostics.filter((d) => d.severity === 'error').length);
  let warningCount = $derived(diagnostics.filter((d) => d.severity === 'warning').length);

  // Simulator instance and state
  let simulatorState = $state<SimulatorState>({
    isActive: false,
    currentNodeId: null,
    activePrompt: '',
    isMuted: false,
    isSpeaking: false,
    collectedInput: '',
    variables: {},
    logs: []
  });

  const ivrSimulator = new IvrSimulator((newState) => {
    simulatorState = newState;
  });

  $effect(() => {
    ivrSimulator.updateGraph(nodes, edges);
  });

  // Dynamically highlight active node in background during IVR simulation
  $effect(() => {
    const activeId = simulatorState.isActive ? simulatorState.currentNodeId : null;
    const currentNodes = untrack(() => nodes);
    let hasChanges = false;
    const nextNodes = currentNodes.map((n) => {
      const isAct = Boolean(activeId && (n.id === activeId || (n.data as any)?.dialogId === activeId));
      if ((n.data as any)?.isSimulatingActive !== isAct) {
        hasChanges = true;
        return {
          ...n,
          data: {
            ...n.data,
            isSimulatingActive: isAct
          }
        };
      }
      return n;
    });

    if (hasChanges) {
      nodes = nextNodes;
    }

    if (selectedNode) {
      const isAct = Boolean(activeId && (selectedNode.id === activeId || (selectedNode.data as any)?.dialogId === activeId));
      if ((selectedNode.data as any)?.isSimulatingActive !== isAct) {
        selectedNode = {
          ...selectedNode,
          data: {
            ...selectedNode.data,
            isSimulatingActive: isAct
          }
        };
      }
    }
  });

  // Flow event handlers
  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target) return;

    let defaultLabel = 'next';
    if (connection.sourceHandle) {
      if (connection.sourceHandle.startsWith('choice-')) {
        const choiceId = connection.sourceHandle.replace('choice-', '');
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const choice = (sourceNode?.data as any)?.choices?.find((c: any) => c.id === choiceId);
        defaultLabel = choice?.dtmf ? `[${choice.dtmf}] ${choice.text}` : choice?.text || 'choice';
      } else {
        defaultLabel = connection.sourceHandle;
      }
    }

    const newEdge: Edge = {
      id: `e_${connection.source}_${connection.sourceHandle || ''}_${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'smoothstep',
      animated: true,
      label: defaultLabel
    };

    edges = [...edges, newEdge];
  }

  function handleNodeClick({ node }: { node: Node }) {
    selectedNode = node;
  }

  function handlePaneClick() {
    selectedNode = null;
  }

  function handleUpdateNode(nodeId: string, updatedData: any) {
    nodes = nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: updatedData };
      }
      return n;
    });

    if (selectedNode?.id === nodeId) {
      selectedNode = nodes.find((n) => n.id === nodeId) || null;
    }
  }

  function handleDeleteNode(nodeId: string) {
    nodes = nodes.filter((n) => n.id !== nodeId);
    edges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    if (selectedNode?.id === nodeId) {
      selectedNode = null;
    }
    showToast('Element deleted.');
  }

  function handleDuplicateNode(node: Node) {
    const newId = `${node.id}_copy_${Math.random().toString(36).substring(2, 5)}`;
    const newData = JSON.parse(JSON.stringify(node.data));
    newData.dialogId = newId;

    const newNode: Node = {
      id: newId,
      type: node.type,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: newData
    };

    nodes = [...nodes, newNode];
    selectedNode = newNode;
    showToast(`Duplicated #${node.id} to #${newId}`);
  }

  function handleAddNode(type: VxmlNodeType, position?: { x: number; y: number }) {
    const id = `node_${Math.random().toString(36).substring(2, 7)}`;
    const pos = position || {
      x: 250 + Math.random() * 150,
      y: 150 + Math.random() * 150
    };

    let data: any = {
      dialogId: id,
      label: `${type.replace('vxml-', '')}_${id}`
    };

    switch (type) {
      case 'vxml-menu':
        data = {
          ...data,
          dtmf: true,
          prompt: { text: 'Welcome. Please make a selection.', bargein: true, timeout: '5s' },
          choices: [
            { id: 'c1', dtmf: '1', text: 'Option One' },
            { id: 'c2', dtmf: '2', text: 'Option Two' }
          ]
        };
        break;

      case 'vxml-field':
        data = {
          ...data,
          fieldName: 'field_' + id,
          type: 'digits',
          grammarParams: '?length=4',
          prompt: { text: 'Please enter your digits.', bargein: true }
        };
        break;

      case 'vxml-block':
        data = {
          ...data,
          blockName: 'block_' + id,
          prompt: { text: 'Executing block statement.' },
          assigns: [{ name: 'count', expr: '1' }]
        };
        break;

      case 'vxml-data':
        data = {
          ...data,
          dataName: 'response_data',
          src: '/api/vxml21/lookup',
          method: 'get',
          prompt: { text: 'Fetching backend XML data...' }
        };
        break;

      case 'vxml-condition':
        data = {
          ...data,
          condition: "user_status === 'active'",
          truePrompt: 'Condition is true.',
          falsePrompt: 'Condition is false.'
        };
        break;

      case 'vxml-record':
        data = {
          ...data,
          recordName: 'rec_' + id,
          beep: true,
          maxtime: '30s',
          dtmfterm: true,
          prompt: { text: 'Please record after the tone.' }
        };
        break;

      case 'vxml-transfer':
        data = {
          ...data,
          transferName: 'xfer_' + id,
          dest: 'tel:+18005550199',
          bridge: true,
          connecttimeout: '30s',
          prompt: { text: 'Transferring call...' }
        };
        break;

      case 'vxml-subdialog':
        data = {
          ...data,
          subdialogName: 'sub_' + id,
          src: 'subflow.vxml',
          method: 'get'
        };
        break;

      case 'vxml-disconnect':
        data = {
          ...data,
          prompt: { text: 'Thank you for calling. Goodbye.' }
        };
        break;

      case 'vxml-exit':
        data = {
          ...data,
          expr: "'normal_exit'"
        };
        break;
    }

    const newNode: Node = {
      id,
      type,
      position: pos,
      data
    };

    nodes = [...nodes, newNode];
    selectedNode = newNode;
  }

  // Drag and drop onto canvas
  function handleCanvasDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleCanvasDrop(e: DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer?.getData('application/vxml-node-type') as VxmlNodeType;
    if (!type) return;

    const canvasEl = e.currentTarget as HTMLElement;
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left - 100;
    const y = e.clientY - rect.top - 50;

    handleAddNode(type, { x: Math.max(20, x), y: Math.max(20, y) });
  }

  function handleAutoLayout() {
    nodes = autoLayoutNodes(nodes, edges);
    showToast('Auto-layout applied.');
  }

  function handleLoadTemplate(templateId: string) {
    const t = TEMPLATES.find((tpl) => tpl.id === templateId);
    if (!t) return;
    nodes = JSON.parse(JSON.stringify(t.nodes));
    edges = JSON.parse(JSON.stringify(t.edges));
    docSettings = JSON.parse(JSON.stringify(t.settings));
    selectedNode = null;
    showToast(`Loaded "${t.name}" template.`);
  }

  // Export VoiceXML file
  function handleExportVxmlFile() {
    const blob = new Blob([generatedVxml], { type: 'application/voicexml+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'callflow.vxml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported callflow.vxml successfully.');
  }

  // Export JSON project file
  function handleExportProjectJson() {
    const project = {
      vxmlVersion: '2.1',
      exportedAt: new Date().toISOString(),
      docSettings,
      nodes,
      edges
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vxml-project.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported vxml-project.json.');
  }

  // Trigger file browser for direct VXML import
  function handleTriggerImportFile() {
    if (fileInputRef) {
      fileInputRef.click();
    }
  }

  // Handle direct file import (.vxml, .xml, .json)
  function handleFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const project = JSON.parse(content);
          if (project.nodes && project.edges) {
            nodes = project.nodes;
            edges = project.edges;
            if (project.docSettings) docSettings = project.docSettings;
            selectedNode = null;
            showToast(`Imported project from ${file.name}`);
            return;
          }
        } catch {
          // Fall through to VXML parser
        }
      }

      // VoiceXML parsing
      const result = parseVxml(content);
      if (result.error) {
        alert(`Error parsing VoiceXML: ${result.error}`);
        return;
      }

      nodes = result.nodes;
      edges = result.edges;
      docSettings = result.settings;
      selectedNode = null;
      showToast(`Imported ${result.nodes.length} dialog elements from ${file.name}`);
    };

    reader.readAsText(file);
    input.value = '';
  }

  function handleImport(result: ParseResult) {
    nodes = result.nodes;
    edges = result.edges;
    docSettings = result.settings;
    selectedNode = null;
    showToast(`Imported ${result.nodes.length} elements from markup.`);
  }

  function handleSaveSettings(newSettings: VxmlDocSettings) {
    docSettings = newSettings;
    showToast('Document settings updated.');
  }

  function handleSelectNodeById(nodeId: string) {
    const found = nodes.find((n) => n.id === nodeId);
    if (found) {
      selectedNode = found;
      showDiagnostics = false;
    }
  }
</script>

<!-- Hidden File Input for 1-Click VXML / Project Import -->
<input
  bind:this={fileInputRef}
  type="file"
  accept=".vxml,.xml,.json"
  onchange={handleFileSelected}
  class="hidden"
/>

<div class="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
  <!-- Top Navigation & Control Header -->
  <header class="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-30 shadow-md">
    <!-- Left: Branding & Tag -->
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-950/50">
        <Phone class="w-5 h-5" />
      </div>

      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm font-bold tracking-tight text-white">VoiceXML 2.1 Editor</h1>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50 flex items-center gap-1 font-semibold">
            <Sparkles class="w-3 h-3 text-amber-300" /> VXML 2.1
          </span>
        </div>
        <p class="text-[10px] text-slate-400">W3C Compliant Interactive Voice Flow Studio</p>
      </div>
    </div>

    <!-- Center: Toolbar Controls -->
    <div class="flex items-center gap-2">
      <!-- Auto Layout -->
      <button
        onclick={handleAutoLayout}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        title="Automatically arrange nodes neatly"
      >
        <LayoutGrid class="w-3.5 h-3.5 text-slate-400" />
        <span>Auto Layout</span>
      </button>

      <!-- Templates Dropdown -->
      <div class="relative flex items-center">
        <select
          onchange={(e) => handleLoadTemplate(e.currentTarget.value)}
          class="bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="" disabled selected>Templates...</option>
          {#each TEMPLATES as t}
            <option value={t.id}>{t.name}</option>
          {/each}
        </select>
      </div>

      <div class="h-5 w-px bg-slate-800 mx-1"></div>

      <!-- Spec Diagnostics Button -->
      <button
        onclick={() => (showDiagnostics = !showDiagnostics)}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors {errorCount > 0
          ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/40'
          : warningCount > 0
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'}"
      >
        {#if errorCount > 0}
          <ShieldAlert class="w-3.5 h-3.5 text-rose-400" />
          <span>{errorCount} {errorCount === 1 ? 'Error' : 'Errors'}</span>
        {:else if warningCount > 0}
          <ShieldAlert class="w-3.5 h-3.5 text-amber-400" />
          <span>{warningCount} Warnings</span>
        {:else}
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
          <span>Valid Spec</span>
        {/if}
      </button>

      <!-- IVR Simulator Button -->
      <button
        onclick={() => {
          showSimulator = true;
          ivrSimulator.startCall();
        }}
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
      >
        <Play class="w-3.5 h-3.5 fill-current" />
        <span>Run Simulator</span>
      </button>
    </div>

    <!-- Right: Import, Export, Code & Settings -->
    <div class="flex items-center gap-2">
      <!-- 1-Click Import VXML Button -->
      <div class="relative group">
        <button
          onclick={handleTriggerImportFile}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 hover:border-cyan-700 text-xs font-medium transition-colors"
          title="Open .vxml or .xml file from your computer"
        >
          <Upload class="w-3.5 h-3.5 text-cyan-400" />
          <span>Import .vxml</span>
        </button>
      </div>

      <!-- 1-Click Export VXML Button -->
      <button
        onclick={handleExportVxmlFile}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/40 transition-colors"
        title="Download VoiceXML 2.1 file (callflow.vxml)"
      >
        <Download class="w-3.5 h-3.5" />
        <span>Export .vxml</span>
      </button>

      <!-- SRGS 1.0 Grammar Studio -->
      <button
        onclick={() => handleOpenGrammarStudio()}
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 hover:border-purple-700 text-xs font-medium transition-colors"
        title="Open SRGS 1.0 Grammar Studio"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-400" />
        <span>Grammar Studio</span>
      </button>

      <!-- View VXML Code Modal -->
      <button
        onclick={() => (showCodeModal = true)}
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        title="Inspect generated XML code"
      >
        <FileCode class="w-3.5 h-3.5 text-indigo-400" />
        <span>Code</span>
      </button>

      <!-- More Actions (Paste Import, Project JSON) -->
      <button
        onclick={() => (showImportModal = true)}
        class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        title="Paste VoiceXML Markup"
      >
        <FileUp class="w-4 h-4 text-slate-400" />
      </button>

      <button
        onclick={handleExportProjectJson}
        class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        title="Save Project (JSON)"
      >
        <FolderDown class="w-4 h-4 text-slate-400" />
      </button>

      <button
        onclick={() => (showSettingsModal = true)}
        class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        title="Document-level Settings"
      >
        <Sliders class="w-4 h-4 text-slate-400" />
      </button>
    </div>
  </header>

  <!-- Main Work Area: Left Toolbar + Svelte Flow Canvas + Right Inspector -->
  <div class="flex-1 flex w-full h-[calc(100vh-3.5rem)] relative overflow-hidden">
    <!-- Left Toolbar: Node Palette with Drag & Drop -->
    <LeftSidebar
      bind:isCollapsed={isSidebarCollapsed}
      onAddNode={handleAddNode}
    />

    <!-- Visual Svelte Flow Canvas -->
    <div
      role="region"
      aria-label="Flowchart canvas"
      class="flex-1 h-full w-full relative bg-slate-950"
      ondragover={handleCanvasDragOver}
      ondrop={handleCanvasDrop}
    >
      <SvelteFlow
        bind:nodes
        bind:edges
        {nodeTypes}
        onconnect={handleConnect}
        onnodeclick={handleNodeClick}
        onpaneclick={handlePaneClick}
        fitView
      >
        <Background gap={18} size={1.2} patternColor="#334155" />
        <Controls class="!bg-slate-900 !border-slate-800 !text-slate-300" />
      </SvelteFlow>

      <!-- Toast Notification Alert -->
      {#if toastMessage}
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-indigo-500/40 text-indigo-200 text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-sm animate-fade-in">
          <Check class="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      {/if}
    </div>

    <!-- Contextual Node Inspector Sidebar -->
    {#if selectedNode}
      <Inspector
        {selectedNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onDuplicateNode={handleDuplicateNode}
        onOpenGrammarEditor={handleOpenGrammarStudio}
        onClose={() => (selectedNode = null)}
      />
    {/if}
  </div>

  <!-- Modals & Overlays -->
  <CodeModal
    isOpen={showCodeModal}
    vxmlCode={generatedVxml}
    onClose={() => (showCodeModal = false)}
  />

  <ImportModal
    isOpen={showImportModal}
    onImport={handleImport}
    onClose={() => (showImportModal = false)}
  />

  <SettingsModal
    isOpen={showSettingsModal}
    settings={docSettings}
    onSave={handleSaveSettings}
    onClose={() => (showSettingsModal = false)}
  />

  <DiagnosticsPanel
    isOpen={showDiagnostics}
    {diagnostics}
    onSelectNode={handleSelectNodeById}
    onClose={() => (showDiagnostics = false)}
  />

  <SimulatorModal
    isOpen={showSimulator}
    {simulatorState}
    onStartCall={() => ivrSimulator.startCall()}
    onEndCall={() => ivrSimulator.endCall()}
    onSendDtmf={(k) => ivrSimulator.sendDtmf(k)}
    onSubmitInput={(txt) => ivrSimulator.submitInput(txt)}
    onTriggerNoInput={() => ivrSimulator.triggerNoInput()}
    onToggleMute={() => ivrSimulator.toggleMute()}
    onClose={() => {
      ivrSimulator.endCall(false);
      showSimulator = false;
    }}
  />

  <GrammarModal
    isOpen={showGrammarModal}
    initialXml={grammarModalXml}
    onSave={(newXml) => {
      if (grammarSaveHandler) {
        grammarSaveHandler(newXml);
      }
      showToast('Grammar applied.');
    }}
    onClose={() => (showGrammarModal = false)}
  />
</div>
