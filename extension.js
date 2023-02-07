const vscode = require("vscode");
const path = require("path");
const os = require("os");
const fs = require("fs");
const child_process = require("child_process");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let formatting = vscode.languages.registerDocumentFormattingEditProvider({ pattern: "**/*.{ex,exs}" }, {
		provideDocumentFormattingEdits: (document) => {
			return vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Mix Formatter: work in progress",
			}, () => {
				return new Promise((resolve, reject) => {
					let tempFilePath = prepareTempFile(document);
					let { status, stderr } = runFormat(document, tempFilePath);

					if (status == 0) {
						let range = new vscode.Range(0, 0, document.lineCount, 0);
						let formatted = fs.readFileSync(tempFilePath, "utf-8");
						resolve([vscode.TextEdit.replace(range, formatted)]);
					} else {
						let errorMessage = stderr.toString().replaceAll(tempFilePath, document.fileName);
						vscode.window.showErrorMessage("Mix Formatter: " + errorMessage);
						reject();
					}
				});
			});
		}
	});

	context.subscriptions.push(formatting);
}

/**
 * @param {vscode.TextDocument} document
 */
function prepareTempFile(document) {
	let filePath = document.fileName;

	let tmpDir = os.tmpdir() + "/" + "vscode-elixir";

	if (!fs.existsSync(tmpDir)) {
		fs.mkdirSync(tmpDir);
	}

	let tmpFileName = tmpDir + "/" + filePath.replaceAll("/", "_");

	fs.writeFileSync(tmpFileName, document.getText());

	return tmpFileName;
}

/**
 * @param {vscode.TextDocument} document
 * @param {string} tempFilePath
 */
function runFormat(document, tempFilePath) {
	let filePath = document.fileName;
	let command = "mix";
	let args = ["format"];

	let projectDir = vscode.workspace.getWorkspaceFolder(document.uri).uri.path
	let formatterConfigPath = findFormatterConfig(filePath, projectDir);

	if (formatterConfigPath) {
		args.push("--dot-formatter", formatterConfigPath);
	}

	args.push(tempFilePath);

	return child_process.spawnSync(command, args, { cwd: projectDir });
}

/**
 * @param {string} targetPath
 * @param {string} projectDir
 */
function findFormatterConfig(targetPath, projectDir) {
	let currentPath = targetPath;

	while (currentPath != projectDir) {
		formatterPath = path.join(currentPath, ".formatter.exs");
		if (fs.existsSync(formatterPath)) {
			return formatterPath;
		}
		currentPath = path.dirname(currentPath);
	}

	return null;
}

exports.activate = activate;
