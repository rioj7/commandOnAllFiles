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
  let includeFolders;
  let unableToApply;
  let saveFiles;
  var recentlyUsedCommandOnAllFiles = [];

  async function applyOnWorkspace(uri, command) {
    const stat = await vscode.workspace.fs.stat(uri);
    if (isStatType(stat, vscode.FileType.Directory)) {
      if (excludeFolders.includes(path.basename(uri.fsPath))) { return; }
      const files = await vscode.workspace.fs.readDirectory(uri);
      for (const file of files) {
        await applyOnWorkspace(vscode.Uri.joinPath(uri, file[0]), command);
      }
      return;
    }
    if ( isStatType(stat, vscode.FileType.File) && includeExtensions.includes(path.extname(uri.fsPath))) {
      if (includeFolders && includeFolders.length > 0) {
        let found = false;
        let path = uri.path;
        for (const incFolderRE of includeFolders) {
          incFolderRE.lastIndex = 0;
          if (incFolderRE.test(path)) {
            found = true;
            break;
          }
        }
        if (!found) { return; }
      }
      try {
        let editor = await vscode.window.showTextDocument(uri);
        await vscode.commands.executeCommand(command);
        if (saveFiles) {
          await vscode.commands.executeCommand('workbench.action.files.save');
        }
        if (!editor.document.isDirty) {
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
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
        if (val === undefined) {
          val = config.get(property, deflt);
        }
        return val;
      };
      saveFiles = getConfigProperty('saveFiles', true);
      includeExtensions = getConfigProperty('includeFileExtensions', []);
      excludeFolders = getConfigProperty('excludeFolders', []).concat(); // make shallow copy of configuration array
      excludeFolders.push('.git'); // Never traverse this
      let globRE = /\.|\*\*|\*|\?|\{([^}]+)\}|\[!/g;
      includeFolders = getConfigProperty('includeFolders', []).map( glob => {
        globRE.lastIndex = 0;
        return new RegExp(glob.replace(globRE, (m, p1) => {
          if (m === '.') return '\\.';
          if (m === '*') return '[^/]+';
          if (m === '?') return '[^/]';
          if (m === '**') return '.*';
          if (m.startsWith('{')) return `(${p1.replaceAll(',','|')})`;
          if (m === '[!') return '[^';
        }));
      });
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
