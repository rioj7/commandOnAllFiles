Apply one or more commands to all files in the Workspace.

If you want to apply multiple commands or a command with arguments you need to use
the extension [multi-command](https://marketplace.visualstudio.com/items?itemName=ryuta46.multi-command) by ryuta46.

This extension is based on the [Format All Files in Workspace](https://marketplace.visualstudio.com/items?itemName=alexr00.formatallfilesinworkspace) by Alex Ross

# Extension commands

The extension export the following command:

* `commandOnAllFiles.applyOnWorkspace`: It applies a command to all files in the (Multi Root) Workspace. It needs a command to apply in an argument. The argument is an array with the first element a key in the setting `commandOnAllFiles.commands`.

Currently this argument can only be supplied with a key binding. This will change it the next release.

# applyOnWorkspace

The command will:
* Open all files in an editor that meet the criteria
* The command from the argument will be applied
* The file will be saved
* The editor is closed.

This means that files that are open in a tab will be closed if they meet the criteria. If there is a way to get a list of files currently open this will change.

# Extension Settings

* `commandOnAllFiles.includeFileExtensions`: Only files with file extensions in this list will be opened and formatted.<br/>Defaults to `[]`.
* `commandOnAllFiles.excludeFolders`: These folders will be skipped when looking for files to format.<br/>Defaults to `["node_modules", "out", ".vscode-test", "media", ".git"]`
* `commandOnAllFiles.commands`: Here we describe the command to apply together with possible overrides of `includeFileExtensions` and `excludeFolders`. The key of a command is its description and the properties of its value are:
    * `command`: the command to apply
    * `includeFileExtensions`: override `commandOnAllFiles.includeFileExtensions` if defined
    * `excludeFolders`: override `commandOnAllFiles.excludeFolders` if defined
    * `label`, `description`, `detail`: when `applyOnWorkspace` is called from the command palette it shows a QuickPick list. These 3 properties (`strings`) are used in the construction of the [QuickPickItem](https://code.visualstudio.com/api/references/vscode-api#QuickPickItem). The default value for `label` is the key name of the command. In the 3 properties you can [use icons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) with the `$(<name>)`-syntax.

No matter what the value of `commandOnAllFiles.excludeFolders` is the `".git"` entry will always be added. This to prevent that if you make a mistake in the configuration you could corrupt your Source Control Repository.

# Example

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

* Allow the command (`applyOnWorkspace`) to be called from the Command Palette and pick the command to apply from a list
* Find a way to get a list of file URI's that have a tab so only close files not currently open
