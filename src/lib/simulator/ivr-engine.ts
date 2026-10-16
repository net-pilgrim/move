import type { Node, Edge } from '@xyflow/svelte';
import type {
  MenuNodeData,
  FieldNodeData,
  BlockNodeData,
  DataNodeData,
  ConditionNodeData,
  RecordNodeData,
  TransferNodeData,
  DisconnectNodeData,
  ExitNodeData
} from '../../types/vxml';
import { testGrammarMatch, xmlToSrgs } from '../grammar/srgs';

// DTMF standard frequencies
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477]
};

let audioCtx: AudioContext | null = null;

export function playDtmfTone(key: string, durationMs: number = 160) {
  const freqs = DTMF_FREQS[key];
  if (!freqs) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];

    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(audioCtx.currentTime + durationMs / 1000);
    osc2.stop(audioCtx.currentTime + durationMs / 1000);
  } catch (err) {
    console.warn('AudioContext tone error:', err);
  }
}

export function playBeepTone() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (err) {
    // Ignore
  }
}

export interface CallLogEntry {
  id: string;
  timestamp: string;
  type: 'system' | 'prompt' | 'input' | 'dtmf' | 'event' | 'error' | 'hangup';
  text: string;
}

export interface SimulatorState {
  isActive: boolean;
  currentNodeId: string | null;
  activePrompt: string;
  isMuted: boolean;
  isSpeaking: boolean;
  collectedInput: string;
  variables: Record<string, any>;
  logs: CallLogEntry[];
}

export class IvrSimulator {
  private nodes: Node[] = [];
  private edges: Edge[] = [];
  private state: SimulatorState = {
    isActive: false,
    currentNodeId: null,
    activePrompt: '',
    isMuted: false,
    isSpeaking: false,
    collectedInput: '',
    variables: {},
    logs: []
  };
  private onStateChange: (state: SimulatorState) => void;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(onStateChange: (state: SimulatorState) => void) {
    this.onStateChange = onStateChange;
  }

  public updateGraph(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  public getState(): SimulatorState {
    return { ...this.state };
  }

  public toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    if (this.state.isMuted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.state.isSpeaking = false;
    }
    this.notify();
    return this.state.isMuted;
  }

  public startCall(initialNodeId?: string) {
    this.endCall(false);
    this.state.isActive = true;
    this.state.logs = [];
    this.state.variables = {
      call_start: new Date().toLocaleTimeString(),
      call_status: 'connected'
    };
    this.state.collectedInput = '';

    this.log('system', 'Call initiated. Call connected.');

    // Determine start node: either requested or the first node
    const startNode = initialNodeId
      ? this.nodes.find((n) => n.id === initialNodeId)
      : this.nodes[0];

    if (!startNode) {
      this.log('error', 'No dialog nodes found in document.');
      this.endCall(false);
      return;
    }

    this.navigateToNode(startNode.id);
  }

  public endCall(logHangup: boolean = true) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.state.isActive = false;
    this.state.isSpeaking = false;
    this.state.currentNodeId = null;
    this.state.activePrompt = '';
    this.state.collectedInput = '';
    if (logHangup) {
      this.log('hangup', 'Call disconnected / Call ended.');
    }
    this.notify();
  }

  public sendDtmf(digit: string) {
    if (!this.state.isActive || !this.state.currentNodeId) return;

    playDtmfTone(digit);
    this.log('dtmf', `DTMF Key Pressed: [${digit}]`);

    const currentNode = this.nodes.find((n) => n.id === this.state.currentNodeId);
    if (!currentNode) return;

    if (currentNode.type === 'vxml-menu') {
      const data = currentNode.data as MenuNodeData;
      // Find choice matching digit
      const choice = data.choices?.find((c) => c.dtmf === digit);
      if (choice) {
        this.log('input', `Selected Menu Option: "${choice.text}"`);
        const target = this.findTargetForHandle(currentNode.id, `choice-${choice.id}`) || choice.next;
        if (target) {
          this.navigateToTarget(target);
        } else {
          this.log('error', `Choice "${choice.text}" has no connected target.`);
        }
      } else {
        this.log('event', `No menu choice mapped to DTMF key [${digit}].`);
        if (data.nomatchPrompt) {
          this.speak(data.nomatchPrompt);
        }
      }
    } else if (currentNode.type === 'vxml-field') {
      this.state.collectedInput += digit;
      this.notify();
    }
  }

  public submitInput(text: string) {
    if (!this.state.isActive || !this.state.currentNodeId) return;
    this.log('input', `User input: "${text}"`);

    const currentNode = this.nodes.find((n) => n.id === this.state.currentNodeId);
    if (!currentNode) return;

    if (currentNode.type === 'vxml-menu') {
      const data = currentNode.data as MenuNodeData;
      // Match choice by text or dtmf
      const clean = text.toLowerCase().trim();
      const choice = data.choices?.find(
        (c) => c.text.toLowerCase().includes(clean) || c.dtmf === clean
      );
      if (choice) {
        this.log('event', `Matched menu option "${choice.text}"`);
        const target = this.findTargetForHandle(currentNode.id, `choice-${choice.id}`) || choice.next;
        if (target) {
          this.navigateToTarget(target);
        }
      } else {
        this.log('event', `No match for utterance "${text}"`);
        if (data.nomatchPrompt) {
          this.speak(data.nomatchPrompt);
        }
      }
    } else if (currentNode.type === 'vxml-field') {
      const data = currentNode.data as FieldNodeData;

      let recognizedValue = text;
      let isMatch = true;

      // If custom grammar is defined, test against SRGS rules
      if (data.type === 'custom' && data.customGrammar) {
        try {
          const srgs = xmlToSrgs(data.customGrammar);
          const matchResult = testGrammarMatch(srgs, text);
          if (matchResult.matched) {
            recognizedValue = matchResult.semanticValue || text;
            this.log('event', `[SRGS Grammar Match] Matched phrase "${matchResult.matchedPhrase}" (Semantic val: "${recognizedValue}")`);
          } else {
            isMatch = false;
            this.log('event', `[SRGS Grammar Nomatch] Input "${text}" did not match custom grammar.`);
            if (data.nomatchPrompt) {
              this.speak(data.nomatchPrompt);
            }
            const nomatchTarget = this.findTargetForHandle(currentNode.id, 'nomatch') || data.nomatchNext;
            if (nomatchTarget) {
              this.navigateToTarget(nomatchTarget);
            }
            return;
          }
        } catch (e: any) {
          console.warn('Custom grammar evaluation error:', e);
        }
      }

      this.state.variables[data.fieldName] = recognizedValue;
      this.log('event', `Field "${data.fieldName}" assigned value: "${recognizedValue}"`);

      // Trigger filled transition
      const target = this.findTargetForHandle(currentNode.id, 'filled') || data.filledNext;
      if (target) {
        this.navigateToTarget(target);
      } else {
        this.log('event', `Field filled, but no next dialog connected.`);
      }
    }
  }

  public triggerNoInput() {
    if (!this.state.isActive || !this.state.currentNodeId) return;
    this.log('event', 'Event: <noinput> triggered (Timeout reached)');

    const currentNode = this.nodes.find((n) => n.id === this.state.currentNodeId);
    if (!currentNode) return;

    const d = currentNode.data as any;
    if (d.noinputPrompt) {
      this.speak(d.noinputPrompt);
    }
    const target = this.findTargetForHandle(currentNode.id, 'noinput') || d.noinputNext;
    if (target) {
      this.navigateToTarget(target);
    }
  }

  private navigateToTarget(targetDialogOrNodeId: string) {
    const cleanId = targetDialogOrNodeId.replace(/^#/, '');
    // Match either by node.id or node.data.dialogId
    const targetNode = this.nodes.find(
      (n) => n.id === cleanId || (n.data as any)?.dialogId === cleanId
    );

    if (targetNode) {
      this.navigateToNode(targetNode.id);
    } else {
      this.log('error', `Cannot transition to target "#${cleanId}": Dialog not found.`);
    }
  }

  private navigateToNode(nodeId: string) {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    this.state.currentNodeId = node.id;
    this.state.collectedInput = '';
    const d = node.data as any;
    const dialogId = d.dialogId || node.id;

    const typeName = (node.type || 'dialog').replace('vxml-', '');
    this.log('system', `Entering dialog: <${typeName}> [id: ${dialogId}]`);

    switch (node.type) {
      case 'vxml-menu': {
        const menu = d as MenuNodeData;
        const promptText = menu.prompt?.text || 'Please select an option:';
        this.speak(promptText);
        break;
      }

      case 'vxml-field': {
        const field = d as FieldNodeData;
        const promptText = field.prompt?.text || `Please enter your ${field.fieldName}:`;
        this.speak(promptText);
        break;
      }

      case 'vxml-block': {
        const block = d as BlockNodeData;
        // Process assignments
        if (block.assigns) {
          for (const a of block.assigns) {
            try {
              const val = new Function('return (' + a.expr + ')')();
              this.state.variables[a.name] = val;
            } catch {
              this.state.variables[a.name] = a.expr;
            }
          }
        }
        if (block.prompt?.text) {
          this.speak(block.prompt.text, () => {
            this.handleBlockCompletion(node);
          });
        } else {
          this.handleBlockCompletion(node);
        }
        break;
      }

      case 'vxml-data': {
        const dataNode = d as DataNodeData;
        this.log('system', `[VXML 2.1 <data>] Fetching data from: ${dataNode.src} (${dataNode.method.toUpperCase()})`);
        // Simulate XML data response
        this.state.variables[dataNode.dataName] = {
          status: 'success',
          timestamp: Date.now(),
          endpoint: dataNode.src
        };
        this.log('event', `Variable "${dataNode.dataName}" populated from <data>`);

        if (dataNode.prompt?.text) {
          this.speak(dataNode.prompt.text, () => {
            const next = this.findTargetForHandle(node.id, 'next') || dataNode.next;
            if (next) this.navigateToTarget(next);
          });
        } else {
          const next = this.findTargetForHandle(node.id, 'next') || dataNode.next;
          if (next) this.navigateToTarget(next);
        }
        break;
      }

      case 'vxml-condition': {
        const cond = d as ConditionNodeData;
        const expr = cond.condition || 'true';
        let result = false;
        try {
          // Provide variables in context
          const varKeys = Object.keys(this.state.variables);
          const varVals = Object.values(this.state.variables);
          const fn = new Function(...varKeys, `return Boolean(${expr});`);
          result = fn(...varVals);
        } catch (e: any) {
          this.log('error', `Failed evaluating condition "${expr}": ${e?.message}`);
        }

        this.log('event', `Evaluating condition: [${expr}] => ${result ? 'TRUE' : 'FALSE'}`);

        if (result) {
          if (cond.truePrompt) this.speak(cond.truePrompt);
          const next = this.findTargetForHandle(node.id, 'true') || cond.trueNext;
          if (next) this.navigateToTarget(next);
        } else {
          if (cond.falsePrompt) this.speak(cond.falsePrompt);
          const next = this.findTargetForHandle(node.id, 'false') || cond.falseNext;
          if (next) this.navigateToTarget(next);
        }
        break;
      }

      case 'vxml-record': {
        const rec = d as RecordNodeData;
        this.speak(rec.prompt?.text || 'Please leave your message after the tone.', () => {
          if (rec.beep) playBeepTone();
          this.log('event', `Recording audio (${rec.maxtime})... [BEEP]`);
          setTimeout(() => {
            this.state.variables[rec.recordName] = 'audio_recording_' + Date.now() + '.wav';
            this.log('event', `Recording saved to variable "${rec.recordName}"`);
            const target = this.findTargetForHandle(node.id, 'filled') || rec.filledNext;
            if (target) this.navigateToTarget(target);
          }, 1500);
        });
        break;
      }

      case 'vxml-transfer': {
        const tr = d as TransferNodeData;
        this.speak(tr.prompt?.text || `Transferring your call to ${tr.dest}. Please hold.`, () => {
          this.log('event', `[TRANSFER] Dialing ${tr.dest} (bridge=${tr.bridge})...`);
          setTimeout(() => {
            this.log('system', `Transfer connected to ${tr.dest}. Call ended on this leg.`);
            this.endCall(false);
          }, 2000);
        });
        break;
      }

      case 'vxml-subdialog': {
        this.log('system', `Invoking <subdialog src="${d.src}">`);
        const next = this.findTargetForHandle(node.id, 'next') || d.next;
        if (next) this.navigateToTarget(next);
        break;
      }

      case 'vxml-disconnect': {
        const disc = d as DisconnectNodeData;
        if (disc.prompt?.text) {
          this.speak(disc.prompt.text, () => {
            this.log('event', 'Encountered <disconnect/> tag.');
            this.endCall(true);
          });
        } else {
          this.log('event', 'Encountered <disconnect/> tag.');
          this.endCall(true);
        }
        break;
      }

      case 'vxml-exit': {
        this.log('event', 'Encountered <exit/> tag.');
        this.endCall(true);
        break;
      }
    }

    this.notify();
  }

  private handleBlockCompletion(node: Node) {
    const block = node.data as BlockNodeData;
    const next = this.findTargetForHandle(node.id, 'next') || block.next;
    if (next) {
      this.navigateToTarget(next);
    }
  }

  private findTargetForHandle(sourceNodeId: string, handleId: string): string | undefined {
    const edge = this.edges.find(
      (e) => e.source === sourceNodeId && e.sourceHandle === handleId
    );
    if (!edge) return undefined;
    const targetNode = this.nodes.find((n) => n.id === edge.target);
    return targetNode ? (targetNode.data as any)?.dialogId || targetNode.id : undefined;
  }

  private speak(text: string, onEnd?: () => void) {
    this.state.activePrompt = text;
    this.log('prompt', `[TTS] "${text}"`);
    this.notify();

    if (this.state.isMuted || typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) setTimeout(onEnd, 1000);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    this.state.isSpeaking = true;
    this.notify();

    utterance.onend = () => {
      this.state.isSpeaking = false;
      this.notify();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.state.isSpeaking = false;
      this.notify();
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private log(type: CallLogEntry['type'], text: string) {
    const entry: CallLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      text
    };
    this.state.logs.push(entry);
    this.notify();
  }

  private notify() {
    this.onStateChange({ ...this.state });
  }
}
