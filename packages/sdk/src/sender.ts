/**
 * VS Code HTTP sender — POST to localhost:4567.
 * Identical protocol to what the Chrome extension's background script used.
 */

import type { BagEntry, ElementStylePayload } from './types';

const DEFAULT_SERVER_URL = 'http://localhost:4567';

/**
 * Check if VS Code Grabber server is running.
 */
export async function checkVSCodeConnection(serverUrl = DEFAULT_SERVER_URL): Promise<boolean> {
  try {
    const r = await fetch(`${serverUrl}/health`);
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Send payload to VS Code extension.
 */
export async function sendToVSCode(
  data: Record<string, unknown>,
  serverUrl = DEFAULT_SERVER_URL
): Promise<{ success: boolean; error?: string }> {
  try {
    const r = await fetch(`${serverUrl}/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return r.ok ? { success: true } : { success: false, error: `HTTP ${r.status}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Format the changes bag as a Copilot instruction — same format as the Chrome extension.
 */
export function formatBagForCopilot(bag: BagEntry[]): string {
  let prompt = `## UI Change Request\n\nPlease apply the following changes to the codebase. Each item targets a specific React component.\n\n`;

  for (let i = 0; i < bag.length; i++) {
    const entry = bag[i];
    const loc = entry.fileName
      ? `${entry.fileName}${entry.lineNumber ? ':' + entry.lineNumber : ''}`
      : '';

    prompt += `### ${i + 1}. ${entry.componentName}`;
    if (loc) prompt += ` (${loc})`;
    prompt += '\n';

    if (entry.note) {
      prompt += `${entry.note}\n`;
    }

    if (entry.styleChanges.length > 0) {
      prompt += '\nStyle changes:\n';
      for (const ch of entry.styleChanges) {
        prompt += `- \`${ch.property}\`: ${ch.from} \u2192 ${ch.to}\n`;
      }
    }

    prompt += '\n';
  }

  prompt += `---\nApply these changes using the project's existing styling approach. Ensure the changes match the existing patterns in each file.\n`;

  return prompt;
}
