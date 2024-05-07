// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, ProgressLocation, TextEditor, DecorationOptions, Range, Position, ExtensionContext, commands, workspace } from 'vscode';
import * as vscode from 'vscode';
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI('AIzaSyAOngD397BvuK7KF-hEPEoKxtgroR_CM4A');

async function analize(editor: TextEditor, sourceCode: string) {
    const sourceCodeArr = sourceCode.split('\n');
	let code = '';
    sourceCodeArr.forEach((line, index) => {
        let lowerCaseLine = line.toLowerCase();
		code += index+1+'-'+line+'\n';
        });
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Crie o prompt para o Gemini. Inclua o código e solicite sugestões de melhorias.
    const prompt = `Analise o seguinte código:\n${code}\nCom base na análise do código, sugira possíveis melhorias e seus respectivos raciocínios para cada sugestão. Além disso, inclua os números das linhas onde estas melhorias podem ser aplicadas.\n**Estruture a resposta como um relatório HTML no seguinte formato:**<br><p><b>Número da Linha:</b> (Número da linha da sugestão)</p><br><p><b>Problema:</b> (Breve descrição do problema encontrado) </p><br><p><b>Raciocínio:</b> (Explicação de por que isso é um problema)</p> <br><p><b>Sugestão:</b> (Melhoria recomendada para o código)</p>.\n siga rigorosamente o formato pedido`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text);
        // Analise o texto da resposta para extrair sugestões como relatório HTML
        const report = parseGeminiResponse(text);

        // Exiba o relatório no webview
        const panel = vscode.window.createWebviewPanel(
            'geminiSuggestions',
            'Sugestões Gemini',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        panel.webview.html = report;
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        window.showErrorMessage("Falha ao gerar relatório de melhoria de código.");
    }
}

// Função auxiliar para analisar a resposta do Gemini e formatá-la como um relatório HTML (implementação não fornecida)
function parseGeminiResponse(text: string): string {
    const lines = text.split('\n');
    let report = '<!DOCTYPE html><html><body><h1>Relatório de Melhoria de Código</h1>';

    /* for (const line of lines) {
        // Look for lines starting with "* Suggestion:" (case-insensitive)
        if (line.toLowerCase().startsWith("* suggestion:")) {
            const parts = line.split(':');
            const suggestion = parts[1].trim();

            // Search backwards for the previous line that starts with "* Line Number:"
            let lineNumber = -1;
            let issue = "";
            let reasoning = "";
            for (let i = lines.indexOf(line) - 1; i >= 0; i--) {
                if (lines[i].toLowerCase().startsWith("* line number:")) {
                    lineNumber = parseInt(lines[i].split(':')[1].trim());
                    break;
                } else if (lines[i].toLowerCase().startsWith("* issue:")) {
                    issue = lines[i].split(':')[1].trim();
                } else if (lines[i].toLowerCase().startsWith("* reasoning:")) {
                    reasoning = lines[i].split(':')[1].trim();
                }
            }

            // Add suggestion details to the report if all information is found
            if (lineNumber > -1 && issue && reasoning) {
                report += `<p>Linha Número: ${lineNumber}, Problema: ${issue}, Raciocínio: ${reasoning}, Sugestão: ${suggestion}</p>`;
            }
        }
    } */

    report += '<body>'+text+'</body></html>';
    return report;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let openEditor = window.visibleTextEditors.filter(editor => editor.document.uri)[0];
    let sourceCode = openEditor.document.getText();

	let disposable = vscode.commands.registerCommand('gemini-suggestions.helloWorld', () => {
		window.withProgress({
			location: ProgressLocation.Window,
			title: "Running Gemini!",
			cancellable: false
		}, _ => {
			const p = new Promise(resolve => {
				try {
					analize(openEditor, sourceCode);
				} catch (e) {
					window.showErrorMessage("Erro de leitura!");
					console.error(e);
				}
				setTimeout(_ => resolve(null), 3000);
			});
			return p;
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
