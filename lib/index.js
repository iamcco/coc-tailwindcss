"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const coc_nvim_1 = require("coc.nvim");
const fast_glob_1 = __importDefault(require("fast-glob"));
const path_1 = require("path");
const CONFIG_GLOB = '**/{tailwind,tailwind.config,tailwind-config,.tailwindrc}.js';
exports.CSS_LANGUAGES = [
    'css',
    'less',
    'postcss',
    'sass',
    'scss',
    'stylus',
    'vue'
];
exports.JS_LANGUAGES = [
    'javascript',
    'javascriptreact',
    'reason',
    'typescriptreact'
];
exports.HTML_LANGUAGES = [
    'blade',
    'edge',
    'ejs',
    'erb',
    'haml',
    'handlebars',
    'html',
    'HTML (EEx)',
    'HTML (Eex)',
    'jade',
    'leaf',
    'markdown',
    'njk',
    'nunjucks',
    'php',
    'razor',
    'slim',
    'svelte',
    'twig',
    'vue',
    ...exports.JS_LANGUAGES
];
exports.LANGUAGES = [...exports.CSS_LANGUAGES, ...exports.HTML_LANGUAGES].filter((val, index, arr) => arr.indexOf(val) === index);
let defaultClient;
let clients = new Map();
let _sortedWorkspaceFolders;
function sortedWorkspaceFolders() {
    if (_sortedWorkspaceFolders === void 0) {
        _sortedWorkspaceFolders = coc_nvim_1.workspace.workspaceFolders
            ? coc_nvim_1.workspace.workspaceFolders
                .map(folder => {
                let result = folder.uri.toString();
                if (result.charAt(result.length - 1) !== '/') {
                    result = result + '/';
                }
                return result;
            })
                .sort((a, b) => {
                return a.length - b.length;
            })
            : [];
    }
    return _sortedWorkspaceFolders;
}
coc_nvim_1.workspace.onDidChangeWorkspaceFolders(() => (_sortedWorkspaceFolders = undefined));
function getOuterMostWorkspaceFolder(folder) {
    let sorted = sortedWorkspaceFolders();
    for (let element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '/';
        }
        if (uri.startsWith(element)) {
            return coc_nvim_1.workspace.getWorkspaceFolder(element);
        }
    }
    return folder;
}
function activate() {
    return __awaiter(this, void 0, void 0, function* () {
        let module = require.resolve('tailwindcss-language-server');
        let outputChannel = coc_nvim_1.workspace.createOutputChannel('tailwindcss-language-server');
        function didOpenTextDocument(document) {
            return __awaiter(this, void 0, void 0, function* () {
                let uri = coc_nvim_1.Uri.parse(document.uri);
                if (uri.scheme !== 'file' ||
                    exports.LANGUAGES.indexOf(document.languageId) === -1) {
                    return;
                }
                let folder = coc_nvim_1.workspace.getWorkspaceFolder(document.uri);
                // Files outside a folder can't be handled. This might depend on the language.
                // Single file languages like JSON might handle files outside the workspace folders.
                if (!folder) {
                    return;
                }
                // If we have nested workspace folders we only start a server on the outer most workspace folder.
                folder = getOuterMostWorkspaceFolder(folder);
                if (!clients.has(folder.uri.toString())) {
                    // placeholder
                    clients.set(folder.uri.toString(), null);
                    try {
                        const configFiles = yield fast_glob_1.default([path_1.join(coc_nvim_1.Uri.parse(folder.uri).fsPath, CONFIG_GLOB), '!**/node_modules/**']);
                        if (!configFiles || configFiles.length === 0) {
                            return;
                        }
                    }
                    catch (error) {
                        outputChannel.append(`fg: ${error.stack || error.message || error}\n`);
                        return;
                    }
                    let debugOptions = {
                        execArgv: ['--nolazy', `--inspect=${6011 + clients.size}`]
                    };
                    let serverOptions = {
                        run: { module, transport: coc_nvim_1.TransportKind.ipc },
                        debug: { module, transport: coc_nvim_1.TransportKind.ipc, options: debugOptions }
                    };
                    let clientOptions = {
                        documentSelector: exports.LANGUAGES.map(language => ({
                            scheme: 'file',
                            language,
                            pattern: `${coc_nvim_1.Uri.parse(folder.uri).fsPath}/**/*`
                        })),
                        diagnosticCollectionName: 'tailwindcss-language-server',
                        workspaceFolder: folder,
                        outputChannel: outputChannel,
                        synchronize: {
                            fileEvents: coc_nvim_1.workspace.createFileSystemWatcher(CONFIG_GLOB)
                        }
                    };
                    let client = new coc_nvim_1.LanguageClient('tailwindcss-language-server', 'Tailwind CSS Language Server', serverOptions, clientOptions);
                    client.start();
                    clients.set(folder.uri.toString(), client);
                }
            });
        }
        coc_nvim_1.workspace.onDidOpenTextDocument(didOpenTextDocument);
        coc_nvim_1.workspace.textDocuments.forEach(didOpenTextDocument);
        coc_nvim_1.workspace.onDidChangeWorkspaceFolders(event => {
            for (let folder of event.removed) {
                let client = clients.get(folder.uri.toString());
                if (client) {
                    clients.delete(folder.uri.toString());
                    client.stop();
                }
            }
        });
    });
}
exports.activate = activate;
function deactivate() {
    let promises = [];
    if (defaultClient) {
        promises.push(defaultClient.stop());
    }
    for (let client of clients.values()) {
        if (client) {
            promises.push(client.stop());
        }
    }
    return Promise.all(promises).then(() => undefined);
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map
