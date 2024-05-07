import { window, ProgressLocation, TextEditor } from 'vscode';
import * as vscode from 'vscode';
import * as showdown from 'showdown';

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI('AIzaSyAOngD397BvuK7KF-hEPEoKxtgroR_CM4A');

async function analize(sourceCode: string) {
	const sourceCodeArr = sourceCode.split('\n');
	let codeAnalize = '';
	sourceCodeArr.forEach((line, index) => {
		codeAnalize += index + 1 + '-' + line + '\n';
	});
	const model = genAI.getGenerativeModel({ model: "gemini-pro" });

	const prompt = `${codeAnalize}
	Com base no código acima, analise-o e descreva possíveis melhorias de forma clara.
O relatório deve ser gerado no seguinte formato:
Linha Nº (Aqui você adiciona a linha onde o trecho de código foi encontrado)\n
Problema: (Adiciona o que foi encontrado)\n
Possível solução:(Aqui você adiciona sua sugestão de melhoria)\n`;

	try {
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
		console.log(text);
		const report = parseGeminiResponse(text);

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


function parseGeminiResponse(text: string): string {
	const converter = new showdown.Converter();
	const htmlContent = converter.makeHtml(text);
	let report = '<!DOCTYPE html>';
	report += '<html lang="en">';
	report += '<head>';
	report += '<meta charset="UTF-8">';
	report += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
	report += '<title>Relatório de Melhoria de Código</title>';
	report += '</head>';
	report += '<body>';
	report += '<h1>Relatório de Melhoria de Código</h1>';
	report += htmlContent;
	report += '</body>';
	report += '</html>';

	return report;
}


export function activate(context: vscode.ExtensionContext) {
	let openEditor = window.visibleTextEditors.filter(editor => editor.document.uri)[0];
	let sourceCode = openEditor.document.getText();

	let disposable = vscode.commands.registerCommand('gemini-suggestions.suggestions', () => {
		window.withProgress({
			location: ProgressLocation.Window,
			title: "Running Gemini!",
			cancellable: false
		}, _ => {
			const p = new Promise(resolve => {
				try {
					analize(sourceCode);
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

export function deactivate() { }
