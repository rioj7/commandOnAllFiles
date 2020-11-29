const vscode = require('vscode');
const path = require('path');

function isStatType(stat, type) {
  return (stat.type & type) == type;
}

function activate(context) {
  const getProperty = (obj, prop, deflt) => { return obj.hasOwnProperty(prop) ? obj[prop] : deflt; };

  let includeExtensions;
  let excludeFolders;
  let unableToApply;

  async function applyOnWorkspace(uri, command) {
    const stat = await vscode.workspace.fs.stat(uri);
    if ( isStatType(stat, vscode.FileType.Directory) && !excludeFolders.includes(path.basename(uri.fsPath))) {
      const files = await vscode.workspace.fs.readDirectory(uri);
      for (const file of files) {
        await applyOnWorkspace(vscode.Uri.joinPath(uri, file[0]), command);
      }
      return;
    }
    if ( isStatType(stat, vscode.FileType.File) && includeExtensions.includes(path.extname(uri.fsPath))) {
      try {
        await vscode.window.showTextDocument(uri);
        await vscode.commands.executeCommand(command);
        await vscode.commands.executeCommand('workbench.action.files.save');
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      } catch (e) {
        unableToApply.push(uri.fsPath);
      }
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('commandOnAllFiles.applyOnWorkspace', async (args) => {
      if (!args) { return; }
      const folders = vscode.workspace.workspaceFolders;
      if (!folders) { return; }
      const config = vscode.workspace.getConfiguration('commandOnAllFiles');
      args = getProperty(config.get('commands'), args[0]);
      if (!args) { return; }
      const getConfigProperty = (property, deflt) => {
        let val = getProperty(args, property);
        if (!val) {
          val = config.get(property, deflt);
        }
        return val;
      };
      includeExtensions = getConfigProperty('includeFileExtensions', []);
      excludeFolders = getConfigProperty('excludeFolders', []);
      excludeFolders.push('.git'); // Never traverse this
      unableToApply = [];
      let command = getProperty(args, 'command');
      for (const folder of folders) {
        await applyOnWorkspace(folder.uri, command);
      }
      vscode.window.showInformationMessage('Finished CommandOnAllFiles.');
    })
  );
};

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
