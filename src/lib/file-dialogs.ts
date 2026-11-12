import { isTauri, invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

export interface FileDialogFilter {
  name: string;
  extensions: string[];
}

export interface OpenFileResult {
  name: string;
  content: string;
  path?: string;
}

/**
 * Check if the application is currently running inside Tauri desktop environment
 */
export function isDesktopApp(): boolean {
  try {
    return isTauri();
  } catch {
    return false;
  }
}

/**
 * Open file using native desktop dialog (or browser file input fallback)
 */
export async function openFileWithNativeDialog(options: {
  title?: string;
  filters?: FileDialogFilter[];
}): Promise<OpenFileResult | null> {
  if (isDesktopApp()) {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: options.title ?? 'Open VoiceXML or Project File',
        filters: options.filters ?? [
          { name: 'VoiceXML & Project Files (*.vxml, *.xml, *.json)', extensions: ['vxml', 'xml', 'json'] },
          { name: 'VoiceXML (*.vxml, *.xml)', extensions: ['vxml', 'xml'] },
          { name: 'Project JSON (*.json)', extensions: ['json'] },
          { name: 'All Files (*.*)', extensions: ['*'] }
        ]
      });

      if (!selected || typeof selected !== 'string') {
        return null;
      }

      let content: string;
      try {
        // First try via plugin-fs
        content = await readTextFile(selected);
      } catch {
        // Fallback to Tauri Rust invoke command
        content = await invoke<string>('read_text_file', { path: selected });
      }

      // Extract filename from path
      const name = selected.split(/[/\\]/).pop() || selected;

      return {
        name,
        content,
        path: selected
      };
    } catch (err) {
      console.error('[FileDialog] Native open failed:', err);
      throw err;
    }
  }

  // Fallback for browser environment
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options.filters && options.filters.length > 0) {
      const exts = options.filters.flatMap((f) => f.extensions.map((e) => `.${e}`));
      input.accept = exts.join(',');
    }

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          content: e.target?.result as string
        });
      };
      reader.onerror = () => reject(new Error('Failed to read selected file'));
      reader.readAsText(file);
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Save file using native desktop dialog (or browser blob download fallback)
 */
export async function saveFileWithNativeDialog(options: {
  defaultPath: string;
  title?: string;
  content: string;
  mimeType?: string;
  filters?: FileDialogFilter[];
}): Promise<{ savedPath: string } | null> {
  if (isDesktopApp()) {
    try {
      const selected = await save({
        defaultPath: options.defaultPath,
        title: options.title ?? 'Save File',
        filters: options.filters ?? [
          { name: 'VoiceXML (*.vxml)', extensions: ['vxml'] },
          { name: 'XML (*.xml)', extensions: ['xml'] },
          { name: 'JSON (*.json)', extensions: ['json'] },
          { name: 'All Files (*.*)', extensions: ['*'] }
        ]
      });

      if (!selected) {
        return null;
      }

      try {
        // Try via plugin-fs
        await writeTextFile(selected, options.content);
      } catch {
        // Fallback to Tauri Rust invoke command
        await invoke('write_text_file', { path: selected, contents: options.content });
      }

      return { savedPath: selected };
    } catch (err) {
      console.error('[FileDialog] Native save failed:', err);
      throw err;
    }
  }

  // Fallback for browser environment: anchor download
  const blob = new Blob([options.content], {
    type: options.mimeType ?? 'text/plain;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.defaultPath;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { savedPath: options.defaultPath };
}
