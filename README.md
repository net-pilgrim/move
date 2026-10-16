# VoiceXML 2.1 Visual Flow Editor

A modern, node-based interactive **VoiceXML (VXML) 2.1** visual editor built with **Svelte 5**, **Svelte Flow** (`@xyflow/svelte`), **Tailwind CSS**, and **TypeScript**.

Compliant with the **W3C Voice Extensible Markup Language (VoiceXML) Version 2.1 Recommendation**.

---

## 🚀 Features

- **Full VoiceXML 2.1 Elements Support**:
  - `<menu>`: Dialog with audio prompts, DTMF touch-tone routing, and speech utterance options.
  - `<field>`: Form input collection supporting builtin grammars (`digits`, `boolean`, `currency`, `number`, `phone`, `time`, `date`) and custom SRGS XML grammars.
  - `<block>`: Procedural execution, variable `<assign>`, prompts, and ECMAScript `<script>`.
  - `<data>`: **VoiceXML 2.1 core addition** — dynamic backend XML data fetching without page transitions (GET / POST).
  - `<if>` / `<else>`: Conditional logic and multi-branch decision trees.
  - `<record>`: Audio voicemail and caller voice recording with `beep`, `maxtime`, and `dtmfterm`.
  - `<transfer>`: Telephony bridging and blind call transfer to telephone numbers (`tel:`) or SIP endpoints (`sip:`).
  - `<subdialog>`: Modular execution of reusable VoiceXML documents with parameter passing.
  - `<disconnect>` & `<exit>`: Graceful call termination.

- **W3C SRGS 1.0 Grammar Studio**:
  - Visual rule & item builder for Speech Recognition Grammar Specification (SRGS 1.0 XML `application/srgs+xml`).
  - Supports both **Voice** (speech recognition) and **DTMF** (keypad input) modes.
  - Semantic Interpretation for Speech Recognition (SISR `<tag>out = "...";</tag>`).
  - Interactive grammar recognition tester to verify phrase matching and semantic returns in real time.
  - Export and import standalone `.grxml` / `.srgs` grammar files.
  - Pre-built grammar templates (*Yes/No Confirmation*, *Credit Card Types*, *DTMF Keypad Choices*, *Department Routing*).
  - Integrated into form `<field>` elements and runnable in the IVR Call Simulator.

- **Real-Time Compliant Code Generation**:
  - Live bi-directional synthesis of W3C-compliant XML markup with proper `version="2.1"` and namespace declarations.
  - One-click copy to clipboard and `.vxml` file export.

- **VoiceXML 2.1 Specification Validator & Diagnostics**:
  - Live spec compliance diagnostics engine checking:
    - Unique NMTOKEN dialog IDs.
    - Transition target integrity (broken `<goto>` / `<choice>` references).
    - DTMF conflict prevention.
    - Missing required attributes according to W3C VXML 2.1 specifications.

- **Bi-directional VXML Parser / Importer**:
  - Import existing `.vxml` files or paste raw VoiceXML markup.
  - Reverse-engineers forms, menus, choices, fields, and transitions into canvas nodes and wiring.

- **Interactive IVR Simulator**:
  - In-browser telephony test simulator with dual-tone multi-frequency (DTMF) audio tone generation via the Web Audio API.
  - Text-to-Speech (TTS) voice playback via Web Speech Synthesis API.
  - Interactive telephone dialpad (0-9, *, #) and simulated speech recognition input.
  - Live call trace log and ECMAScript session variable inspection.

- **Auto-Layout Algorithm**:
  - One-click DAG layering algorithm to neatly organize complex call flows.

- **Pre-Built Industry Templates**:
  1. *Customer Support Router* (Classic menu, DTMF options, transfer to agent)
  2. *VXML 2.1 Data Fetch Flow* (PIN collection, `<data>` fetch, condition branch)
  3. *Voicemail System* (Record audio, review/confirm, hangup)

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Run Test Suite
```bash
npx tsx tests/test-vxml.ts
```
