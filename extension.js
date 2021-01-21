const vscode = require('vscode');
const path = require('path');

function isStatType(stat, type) {
  return (stat.type & type) == type;
}

function activate(context) {
  const getProperty = (obj, prop, deflt) => { return obj.hasOwnProperty(prop) ? obj[prop] : deflt; };
  const isString = obj => typeof obj === 'string';

  let includeExtensions;
  let excludeFolders;
  let unableToApply;
  var recentlyUsedCommandOnAllFiles = [];

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
      const folders = vscode.workspace.workspaceFolders;
      if (!folders) { return; }
      const config = vscode.workspace.getConfiguration('commandOnAllFiles');
      let commandKey = await new Promise(resolve => {
        if (args !== undefined) {
          resolve(args[0]);
          return;
        }
        let commands = config.get('commands');
        let qpItems = [];
        for (const key in commands) {
          if (!commands.hasOwnProperty(key)) { continue; }
          const argsCommand = commands[key];
          let label = getProperty(argsCommand, 'label', key);
          let description = getProperty(argsCommand, 'description');
          let detail = getProperty(argsCommand, 'detail');
          qpItems.push( { idx: qpItems.length, commandKey: key, label, description, detail } );
        }
        if (qpItems.length === 0) {
          vscode.window.showInformationMessage("No usable command found");
          resolve(undefined);
          return;
        }
        const sortIndex = a => {
          let idx = recentlyUsedCommandOnAllFiles.findIndex( e => e === a.commandKey );
          return idx >= 0 ? idx : recentlyUsedCommandOnAllFiles.length + a.idx;
        };
        // TODO when we persistently save recentlyUsedCommandOnAllFiles
        qpItems.sort( (a, b) => sortIndex(a) - sortIndex(b) );
        resolve(vscode.window.showQuickPick(qpItems)
          .then( item => {
            if (item) {
              let commandKey = item.commandKey;
              recentlyUsedCommandOnAllFiles = [commandKey].concat(recentlyUsedCommandOnAllFiles.filter( e => e !== commandKey ));
            }
            return item;
        }));
      }).then( item => {
        if (isString(item)) return item;
        return item ? item.commandKey : undefined;
      });
  
      if (commandKey === undefined) { return; }
      let argsCommand = getProperty(config.get('commands'), commandKey);
      if (!argsCommand) { return; }
      const getConfigProperty = (property, deflt) => {
        let val = getProperty(argsCommand, property);
        if (!val) {
          val = config.get(property, deflt);
        }
        return val;
      };
      includeExtensions = getConfigProperty('includeFileExtensions', []);
      excludeFolders = getConfigProperty('excludeFolders', []);
      excludeFolders.push('.git'); // Never traverse this
      unableToApply = [];
      let command = getProperty(argsCommand, 'command');
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
