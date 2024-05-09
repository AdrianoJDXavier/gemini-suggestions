import { window, ProgressLocation } from 'vscode';
import * as vscode from 'vscode';
import * as showdown from 'showdown';
import { GoogleGenerativeAI } from "@google/generative-ai";
const SUA_API_KEY ='';
const genAI = new GoogleGenerativeAI(SUA_API_KEY);


async function analize(sourceCode: string) {
	const sourceCodeArr = sourceCode.split('\n');
	let codeAnalize = '';
	let prompt = '';
	sourceCodeArr.forEach((line, index) => {
		codeAnalize += index + 1 + '-' + line + '\n';
	});
	const model = genAI.getGenerativeModel({ model: "gemini-pro" });

	prompt = `Aja como uma analista de sistemas.
	1 - Ignore todas as análises realizadas até agora.
2 - Analise somente o código-fonte abaixo:
${codeAnalize}
3 - Crie um relatório descrevendo possíveis melhorias de forma clara e objetiva, se necessário compartilhe sua sugestão de melhoria do código.
4- O relatório deve ser gerado no seguinte formato:
Linha Nº (Aqui você adiciona a linha onde o trecho de código foi encontrado)
Problema: (Adiciona o que foi encontrado)
Possível solução: (Aqui você adiciona sua sugestão de melhoria)`;

	try {
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
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
