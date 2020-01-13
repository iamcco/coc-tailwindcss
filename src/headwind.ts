import { commands, workspace, ExtensionContext, Uri } from 'coc.nvim';
import { Range } from 'vscode-languageserver-protocol';
import { sortClassString, logger } from './utils';
import { spawn } from 'child_process';
import { rustyWindPath } from 'rustywind';

const log = logger.getLog('headwind')

const config = workspace.getConfiguration();
const configRegex: {[key: string]: string} = config.get('tailwindCSS.headwind.classRegex') || {};

const sortOrder = config.get('tailwindCSS.headwind.defaultSortOrder');

const shouldRemoveDuplicatesConfig = config.get(
  'tailwindCSS.headwind.removeDuplicates'
);
const shouldRemoveDuplicates =
  typeof shouldRemoveDuplicatesConfig === 'boolean'
  ? shouldRemoveDuplicatesConfig
  : true;


let isActive: boolean = false
export function activateHeadwind(context: ExtensionContext) {
  if (isActive) {
    return
  }
  isActive = true
  context.subscriptions.push({
    dispose() {
      isActive = false
    }
  })
  let disposable = commands.registerCommand(
    'tailwindCSS.headwind.sortTailwindClasses',
    async () => {
      const doc = await workspace.document
      const editorText = doc.textDocument.getText();
      const editorLangId = doc.textDocument.languageId;

      const classWrapperRegex = new RegExp(configRegex[editorLangId] || configRegex['html'], 'gi');
      let classWrapper: RegExpExecArray | null;
      while (
        (classWrapper = classWrapperRegex.exec(editorText)) !== null
      ) {
        const wrapperMatch = classWrapper[0];
        const valueMatchIndex = classWrapper.findIndex((match, idx) => idx !== 0 && match);
        const valueMatch = classWrapper[valueMatchIndex];

        const startPosition =
          classWrapper.index + wrapperMatch.lastIndexOf(valueMatch);
        const endPosition = startPosition + valueMatch.length;

        const range = Range.create(
          doc.textDocument.positionAt(startPosition),
          doc.textDocument.positionAt(endPosition)
        );

        doc.applyEdits([{
          range,
          newText:sortClassString(
            valueMatch,
            Array.isArray(sortOrder) ? sortOrder : [],
            shouldRemoveDuplicates
          )
        }])
      }
    }
  );

  let runOnProject = commands.registerCommand(
    'tailwindCSS.headwind.sortTailwindClassesOnWorkspace',
    () => {
      let workspaceFolder = workspace.workspaceFolders || [];
      if (workspaceFolder[0]) {
        const workspacePath = Uri.parse(workspaceFolder[0].uri).fsPath
        workspace.showMessage(
          `Running Headwind on: ${workspacePath}`
        );

        let rustyWindArgs = [
          workspacePath,
          '--write',
          shouldRemoveDuplicates ? '' : '--allow-duplicates'
        ].filter(arg => arg !== '');

        let rustyWindProc = spawn(rustyWindPath, rustyWindArgs);

        rustyWindProc.stdout.on(
          'data',
          data =>
          data &&
          data.toString() !== '' &&
          log(`rustywind stdout:\n${data.toString()}`)
        );

        rustyWindProc.stderr.on('data', data => {
          if (data && data.toString() !== '') {
            log(`rustywind stderr:\n${data.toString()}`);
            workspace.showMessage(`Headwind error: ${data.toString()}`, 'error');
          }
        });
      }
    }
  );

  context.subscriptions.push(runOnProject);
  context.subscriptions.push(disposable);

  // if runOnSave is enabled organize tailwind classes before saving
  if (config.get('tailwindCSS.headwind.runOnSave')) {
    context.subscriptions.push(
      workspace.onWillSaveTextDocument(_e => {
        commands.executeCommand('tailwindCSS.headwind.sortTailwindClasses');
      })
    );
  }
}
