# VSCode Elixir
I created this to have the same functionality I had in Atom. You probably don't want to use this extension.

## Setup
```
npm install -g @vscode/vsce
git clone --recurse-submodules git@github.com:amatalai/vscode-elixir.git
cd vscode-elixir
vsce package
code --install-extension vscode-elixir-0.0.1.vsix
```