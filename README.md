Apply one or more commands to all files in the Workspace.

If you want to apply multiple commands or a command with arguments you need to use
the extension [multi-command](https://marketplace.visualstudio.com/items?itemName=ryuta46.multi-command) by ryuta46.

This extension is based on the [Format All Files in Workspace](https://marketplace.visualstudio.com/items?itemName=alexr00.formatallfilesinworkspace) by Alex Ross

# Extension commands

The extension exports the following command:

* **CommandOnAllFiles: Apply 1 or more commands to all files in the Workspace** : `commandOnAllFiles.applyOnWorkspace`  
  It applies a command to all files in the (Multi Root) Workspace. It needs a command to apply in an argument. The argument is an array with the first element a key in the setting `commandOnAllFiles.commands`.  
  When the command is called from the command palette a list of known commands is shown and the user can select one or <kbd>Escape</kbd> the selection.

# applyOnWorkspace

The command will:
* Open all files in an editor that meet the criteria
* The command from the argument will be applied
* The file will be saved
* The editor is closed.

This means that files that are open in a tab will be closed if they meet the criteria. If there is a way to get a list of files currently open this will change.

# Extension Settings

* `commandOnAllFiles.includeFileExtensions`: Only files with file extensions in this list will be processed.  
  A file extension contains the **`.`** (period). Example `[".html", ".css", ".js"]`  
  Defaults to `[]`.
* `commandOnAllFiles.excludeFolders`: These folders will be skipped when looking for files to process.  
  Can contain workspacefolder (base)names to exclude certain Multi Root Workspaces.  
  Defaults to `["node_modules", "out", ".vscode-test", "media", ".git"]`
* `commandOnAllFiles.includeFolders`: An array of [Glob Patterns](https://code.visualstudio.com/api/references/vscode-api#GlobPattern) describing folders that will determine which files will be processed.  
  There is no need to use `**` at the start of the Glob Pattern.  
  If no Glob Pattern defined all files with a matching extension are processed.
* `commandOnAllFiles.saveFiles`: If `true` save and close a modified file. If `false` keep a modified file open in the editor. (default: `true`)
* `commandOnAllFiles.commands`: An object with key/value items describing the commands to use.  
  The key is the description of a command. The value is an object with properties for the commandID to apply together with possible overrides of `includeFileExtensions`, `excludeFolders` and `includeFolders`. The properties of the value object are:
    * `command`: the commandID to apply
    * `includeFileExtensions`: override `commandOnAllFiles.includeFileExtensions` if defined
    * `excludeFolders`: override `commandOnAllFiles.excludeFolders` if defined
    * `includeFolders`: override `commandOnAllFiles.includeFolders` if defined
    * `saveFiles`: override `commandOnAllFiles.saveFiles` if defined
    * `label`, `description`, `detail`: when `applyOnWorkspace` is called from the command palette it shows a QuickPick list. These 3 properties (`strings`) are used in the construction of the [QuickPickItem](https://code.visualstudio.com/api/references/vscode-api#QuickPickItem). The default value for `label` is the key name of the command. In the 3 properties you can [use icons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) with the `$(<name>)`-syntax.

No matter what the value of `commandOnAllFiles.excludeFolders` is the `".git"` entry will always be added. This to prevent that if you make a mistake in the configuration you could corrupt your Source Control Repository.

To prevent an incorrect directory match in the `includeFolders` glob patterns always include the separator `/`. Using `["/src/"]` prevents a match on directory `src-test`.

# Example

If you know the command description from the **View** > **Command Palette** (`Ctrl+Shift+P`), what do you need to set the `"command"` property.

For example you want to apply the command `Inline CSS`, you have to find the command ID for this command with the **Keyboard Shortcuts** editor.

1. Use menu: **File** > **Preferences** > **Keyboard Shortcuts**
1. Search for `Inline`
1. Locate the `Inline CSS` command
1. From context menu (right click): **Copy Command ID**
1. Use this as the value of the `"command"` property

An example of how to configure the extension to add `Hello` to the end of all `.txt` files in the Workspace. We need the extension [multi-command](https://marketplace.visualstudio.com/items?itemName=ryuta46.multi-command) because the have to perform a sequence of commands.

The default value for `commandOnAllFiles.excludeFolders` is enough for this example.

In `settings.json`:

``` json
  "multiCommand.commands": [
    {
      "command": "multiCommand.addHelloAtEnd",
      "sequence": [
        "cursorBottom",
        { "command": "type",
          "args": { "text": "Hello" }
        }
      ]
    }
  ],
  "commandOnAllFiles.commands": {
    "Add Hello to the End": {
      "command": "multiCommand.addHelloAtEnd",
      "includeFileExtensions": [".txt"]
    }
  }
```

In `keybindings.json`:

``` json
  {
    "key": "ctrl+i a", // or any other key combo
    "command": "commandOnAllFiles.applyOnWorkspace",
    "args": ["Add Hello to the End"]
  }
```

# TODO

* Find a way to get a list of file URI's that have a tab so only close files not currently open
