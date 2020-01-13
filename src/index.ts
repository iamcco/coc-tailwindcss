/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
  workspace as Workspace,
  OutputChannel,
  LanguageClient,
  LanguageClientOptions,
  TransportKind,
  Uri,
  workspace,
  ExtensionContext,
} from 'coc.nvim'
import {
  TextDocument,
  WorkspaceFolder
} from 'vscode-languageserver-protocol';
import fg from 'fast-glob';
import { join, resolve } from 'path';
import {activateHeadwind} from './headwind';

const CONFIG_GLOB =
  '**/{tailwind,tailwind.config,tailwind-config,.tailwindrc}.js'

let LANGUAGES: string[] = []

let defaultClient: LanguageClient
let clients: Map<string, LanguageClient> = new Map()

let _sortedWorkspaceFolders: string[] | undefined
function sortedWorkspaceFolders(): string[] {
  if (_sortedWorkspaceFolders === void 0) {
    _sortedWorkspaceFolders = Workspace.workspaceFolders
      ? Workspace.workspaceFolders
          .map(folder => {
            let result = folder.uri.toString()
            if (result.charAt(result.length - 1) !== '/') {
              result = result + '/'
            }
            return result
          })
          .sort((a, b) => {
            return a.length - b.length
          })
      : []
  }
  return _sortedWorkspaceFolders
}
Workspace.onDidChangeWorkspaceFolders(
  () => (_sortedWorkspaceFolders = undefined)
)

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
  let sorted = sortedWorkspaceFolders()
  for (let element of sorted) {
    let uri = folder.uri.toString()
    if (uri.charAt(uri.length - 1) !== '/') {
      uri = uri + '/'
    }
    if (uri.startsWith(element)) {
      const workdir = Workspace.getWorkspaceFolder(element)
      if (workdir) {
        return workdir
      }
    }
  }
  return folder
}

export async function activate(context: ExtensionContext) {
  let module = resolve(context.extensionPath, 'lsp', 'tailwindcss-language-server', 'dist', 'index.js')
  let outputChannel: OutputChannel = Workspace.createOutputChannel(
    'tailwindcss-language-server'
  )
  const config = workspace.getConfiguration('tailwindCSS')
  LANGUAGES = [
    ...config.get<string[]>('cssLanguages', []),
    ...config.get<string[]>('htmlLanguages', []),
    ...config.get<string[]>('jsLanguages', [])
  ]

  async function didOpenTextDocument(document: TextDocument): Promise<void> {
    let uri = Uri.parse(document.uri)
    if (
      uri.scheme !== 'file' ||
      LANGUAGES.indexOf(document.languageId) === -1
    ) {
      return
    }

    let folder = Workspace.getWorkspaceFolder(document.uri)
    // Files outside a folder can't be handled. This might depend on the language.
    // Single file languages like JSON might handle files outside the workspace folders.
    if (!folder) {
      return
    }

    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = getOuterMostWorkspaceFolder(folder)

    if (!clients.has(folder.uri.toString())) {
      // placeholder
      clients.set(folder.uri.toString(), null)

      try {
        const configFiles = await fg([join(Uri.parse(folder.uri).fsPath, CONFIG_GLOB), '!**/node_modules/**'])
        if (!configFiles || configFiles.length === 0) {
          return
        }
      } catch (error) {
        outputChannel.append(`fg: ${error.stack || error.message || error}\n`)
        return
      }

      // register headwind
      activateHeadwind(context)

      let debugOptions = {
        execArgv: ['--nolazy', `--inspect=${6011 + clients.size}`]
      }
      let serverOptions = {
        run: { module, transport: TransportKind.ipc },
        debug: { module, transport: TransportKind.ipc, options: debugOptions }
      }
      let clientOptions: LanguageClientOptions = {
        documentSelector: LANGUAGES.map(language => ({
          scheme: 'file',
          language,
          pattern: `${Uri.parse(folder.uri).fsPath}/**/*`
        })),
        diagnosticCollectionName: 'tailwindcss-language-server',
        workspaceFolder: folder,
        outputChannel: outputChannel,
        synchronize: {
          fileEvents: Workspace.createFileSystemWatcher(CONFIG_GLOB)
        }
      }
      let client = new LanguageClient(
        'tailwindCSS',
        'Tailwind CSS Language Server',
        serverOptions,
        clientOptions
      )

      client.start()
      clients.set(folder.uri.toString(), client)
    }
  }

  Workspace.onDidOpenTextDocument(didOpenTextDocument)
  Workspace.textDocuments.forEach(didOpenTextDocument)
  Workspace.onDidChangeWorkspaceFolders(event => {
    for (let folder of event.removed) {
      let client = clients.get(folder.uri.toString())
      if (client) {
        clients.delete(folder.uri.toString())
        client.stop()
      }
    }
  })
}

export function deactivate(): Thenable<void> {
  let promises: Thenable<void>[] = []
  if (defaultClient) {
    promises.push(defaultClient.stop())
  }
  for (let client of clients.values()) {
    if (client) {
      promises.push(client.stop())
    }
  }
  return Promise.all(promises).then(() => undefined)
}
