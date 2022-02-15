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
  commands,
  workspace,
  ExtensionContext,
  ServerOptions,
} from 'coc.nvim'
import {
  TextDocument,
  WorkspaceFolder
} from 'vscode-languageserver-protocol';
import fg from 'fast-glob';
import { join, resolve } from 'path';
import { existsSync } from "fs";
import {activateHeadwind} from './headwind';

// REF: https://github.com/tailwindlabs/tailwindcss-intellisense/blob/master/packages/tailwindcss-language-service/src/util/isObject.ts
function isObject(variable: any): boolean {
  return Object.prototype.toString.call(variable) === "[object Object]";
}
// REF: https://github.com/tailwindlabs/tailwindcss-intellisense/blob/master/packages/tailwindcss-language-service/src/util/array.ts
function dedupe<T>(arr: Array<T>): Array<T> {
  return arr.filter((value, index, self) => self.indexOf(value) === index)
}
// REF: https://github.com/tailwindlabs/tailwindcss-intellisense/blob/master/packages/tailwindcss-language-service/src/util/languages.ts
const htmlLanguages = [
  'aspnetcorerazor',
  'astro',
  'astro-markdown',
  'blade',
  'django-html',
  'edge',
  'ejs',
  'erb',
  'gohtml',
  'GoHTML',
  'haml',
  'handlebars',
  'hbs',
  'html',
  'HTML (Eex)',
  'HTML (EEx)',
  'html-eex',
  'jade',
  'leaf',
  'liquid',
  'markdown',
  'mdx',
  'mustache',
  'njk',
  'nunjucks',
  'phoenix-heex',
  'php',
  'razor',
  'slim',
  'twig',
]
// REF: https://github.com/tailwindlabs/tailwindcss-intellisense/blob/master/packages/tailwindcss-language-service/src/util/languages.ts
const cssLanguages = ['css', 'less', 'postcss', 'sass', 'scss', 'stylus', 'sugarss']
// REF: https://github.com/tailwindlabs/tailwindcss-intellisense/blob/master/packages/tailwindcss-language-service/src/util/languages.ts
const jsLanguages = [
  'javascript',
  'javascriptreact',
  'reason',
  'rescript',
  'typescript',
  'typescriptreact',
]
// REF: https://github.com/tailwindlabs/tailwindcss-intellisense/blob/master/packages/tailwindcss-language-service/src/util/languages.ts
export const specialLanguages = ['vue', 'svelte']

const defaultLanguages = [...cssLanguages, ...htmlLanguages, ...jsLanguages, ...specialLanguages]

export type ConfigurationScope =
  | Uri
  | TextDocument
  | WorkspaceFolder
  | { uri?: Uri; languageId: string };

const CONFIG_GLOB =
  "**/{tailwind,tailwind.config,tailwind-config,.tailwindrc}.{js,cjs}";

let defaultClient: LanguageClient
let languages: Map<string, string[]> = new Map()
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

function getUserLanguages(folder?: WorkspaceFolder): Record<string, string> {
  const langs = Workspace.getConfiguration(
    "tailwindCSS",
    folder.uri.toString()
  ).includeLanguages;
  return isObject(langs) ? langs : {};
}

export async function activate(context: ExtensionContext) {
  let module = getConfigCustomServerPath();
  if (module && existsSync(module)) {
    module = module;
  } else {
    module = context.asAbsolutePath(
      join(
        "node_modules",
        "@tailwindcss",
        "language-server",
        "bin",
        "tailwindcss-language-server"
      )
    );
  }

  let outputChannel: OutputChannel = Workspace.createOutputChannel(
    'tailwindcss-language-server'
  )
  context.subscriptions.push(
    commands.registerCommand("tailwindCSS.showOutput", () => {
      if (outputChannel) {
        outputChannel.show();
      }
    })
  );
  const config = workspace.getConfiguration('tailwindCSS')

  async function didOpenTextDocument(document: TextDocument): Promise<void> {
    let uri = Uri.parse(document.uri)

    if (uri.scheme !== 'file') return

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

      if (!languages.has(folder.uri.toString())) {
        languages.set(
          folder.uri.toString(),
          dedupe([...defaultLanguages, ...Object.keys(getUserLanguages(folder))])
        )
      }

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

      let configuration = {
        edidor: Workspace.getConfiguration("editor"),
        tailwindCSS: Workspace.getConfiguration("tailwindCSS"),
      };

      let inspectPort = configuration.tailwindCSS.get('inspectPort', null)

      let serverOptions: ServerOptions = {
        run: {
          module,
          transport: TransportKind.ipc,
          options: { execArgv: inspectPort === null ? [] : [`--inspect=${inspectPort}`] },
        },
        debug: {
          module,
          transport: TransportKind.ipc,
          options: {
            execArgv: ['--nolazy', `--inspect=${6011 + clients.size}`],
          },
        },
      }

      let clientOptions: LanguageClientOptions = {
        documentSelector: languages.get(folder.uri.toString()).map(language => ({
          scheme: 'file',
          language,
          pattern: `${Uri.parse(folder.uri).fsPath}/**/*`
        })),
        diagnosticCollectionName: 'tailwindcss-language-server',
        workspaceFolder: folder,
        outputChannel: outputChannel,
        synchronize: {
          fileEvents: Workspace.createFileSystemWatcher(CONFIG_GLOB)
        },
        middleware: {
          workspace: {
            configuration: (params) => {
              return params.items.map(({ section, scopeUri }) => {
                let scope: ConfigurationScope = folder;
                if (scopeUri) {
                  let doc = Workspace.textDocuments.find(
                    (doc) => doc.uri.toString() === scopeUri
                  );
                  if (doc) {
                    scope = {
                      languageId: doc.languageId,
                    };
                  }
                }
                return Workspace.getConfiguration(section);
              });
            },
          },
        },
        initializationOptions: {
          userLanguages: getUserLanguages(folder),
        },
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

function getConfigCustomServerPath() {
  return workspace.getConfiguration("tailwindCSS").get<string>("custom.serverPath", "");
}
