import * as vscode from 'vscode';
import { GrabberServer } from './server';
import type { GrabberPayload, ElementContext } from './types';

let server: GrabberServer | null = null;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('[Grabber] Extension activating...');

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'grabber.showStatus';
  context.subscriptions.push(statusBarItem);

  // Start the server
  startServer(context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('grabber.showStatus', showStatus),
    vscode.commands.registerCommand('grabber.restartServer', () => {
      restartServer(context);
    })
  );

  updateStatusBar();
}

function startServer(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('grabber');
  const port = config.get<number>('port', 4567);

  server = new GrabberServer(port);

  server.on('context', async (payload: GrabberPayload) => {
    await handleIncomingContext(payload);
  });

  server.on('connected', () => {
    updateStatusBar();
    vscode.window.showInformationMessage('Grabber: Chrome extension connected');
  });

  server.on('disconnected', () => {
    updateStatusBar();
  });

  server.on('error', (error: Error) => {
    vscode.window.showErrorMessage(`Grabber Server Error: ${error.message}`);
  });

  server.start();
  console.log(`[Grabber] Server started on port ${port}`);
}

function restartServer(context: vscode.ExtensionContext) {
  if (server) {
    server.stop();
    server = null;
  }
  startServer(context);
  vscode.window.showInformationMessage('Grabber: Server restarted');
}

function updateStatusBar() {
  if (server?.isConnected) {
    statusBarItem.text = '$(plug) Grabber';
    statusBarItem.tooltip = 'Grabber: Chrome extension connected';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = '$(plug) Grabber';
    statusBarItem.tooltip = 'Grabber: Waiting for Chrome extension...';
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );
  }
  statusBarItem.show();
}

function showStatus() {
  const config = vscode.workspace.getConfiguration('grabber');
  const port = config.get<number>('port', 4567);

  if (server?.isConnected) {
    vscode.window.showInformationMessage(
      `Grabber: Chrome extension connected on port ${port}`
    );
  } else {
    vscode.window.showWarningMessage(
      `Grabber: Waiting for Chrome extension on port ${port}...`
    );
  }
}

async function handleIncomingContext(payload: GrabberPayload) {
  const { prompt, context, type } = payload;

  console.log('[Grabber] Received context:', {
    type,
    component: context?.component?.componentName,
    file: context?.component?.fileName,
  });

  // Build the full prompt with context
  let fullPrompt: string;
  if (type === 'GRABBER_STYLE_CONTEXT') {
    // Style changes payload — the prompt is already pre-formatted by the side panel
    fullPrompt = buildStylePrompt(prompt, context, payload);
  } else {
    fullPrompt = buildPromptWithContext(prompt, context);
  }

  // Get config
  const config = vscode.workspace.getConfiguration('grabber');
  const autoSubmit = config.get<boolean>('autoSubmit', true);

  try {
    // Open Copilot Chat with the query
    await vscode.commands.executeCommand('workbench.action.chat.open', {
      query: fullPrompt,
      isPartialQuery: !autoSubmit,
    });

    vscode.window.showInformationMessage('Grabber: Context sent to Copilot Chat');
  } catch (error) {
    console.error('[Grabber] Failed to open Copilot Chat:', error);
    vscode.window.showErrorMessage(
      'Grabber: Failed to open Copilot Chat. Make sure GitHub Copilot is installed.'
    );
  }
}

function buildPromptWithContext(
  userPrompt: string,
  context: ElementContext
): string {
  const parts: string[] = [];

  parts.push('## Selected Component Context\n');

  if (context.component) {
    parts.push(`**Component:** \`${context.component.componentName}\``);
    parts.push(
      `**File:** \`${context.component.fileName}:${context.component.lineNumber}\``
    );

    // if (Object.keys(context.component.props).length > 0) {
    //   parts.push('**Props:**');
    //   parts.push('```json');
    //   parts.push(JSON.stringify(context.component.props, null, 2));
    //   parts.push('```');
    // }
  }

  if (context.hierarchy.length > 0) {
    parts.push(`**Component Hierarchy:** ${context.hierarchy.join(' > ')}`);
  }

  parts.push('**Rendered HTML:**');
  parts.push('```html');
  parts.push(context.html);
  parts.push('```');

  parts.push(`**Page URL:** ${context.pageUrl}`);
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('## Request:');
  parts.push(userPrompt);

  return parts.join('\n');
}

function buildStylePrompt(
  userPrompt: string,
  context: ElementContext,
  _payload: any
): string {
  const parts: string[] = [];

  // The side panel already builds a well-formatted prompt with style changes
  // and context. Add component file context.
  parts.push('## Style Editor Changes\n');

  if (context?.component) {
    parts.push(`**Component:** \`${context.component.componentName}\``);
    parts.push(
      `**File:** \`${context.component.fileName}:${context.component.lineNumber}\``
    );
  }

  if (context?.hierarchy?.length > 0) {
    parts.push(`**Component Hierarchy:** ${context.hierarchy.join(' > ')}`);
  }

  parts.push('');
  parts.push(userPrompt);

  return parts.join('\n');
}

export function deactivate() {
  if (server) {
    server.stop();
    server = null;
  }
  console.log('[Grabber] Extension deactivated');
}
