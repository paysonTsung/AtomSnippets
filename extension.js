let vscode = require('vscode');
let exec = require('child_process').exec;
function activate(context) {
    console.log('Extension "Atom Snippets" is now active');

    let {window, commands, workspace, languages, Hover} = vscode;
    // let curFile = workspace.textDocuments[0].fileName;
    let curTime;
    let curFile = window.activeTextEditor.document.fileName;
    let sub = context.subscriptions;
    let rightPosBar = vscode.StatusBarAlignment.Right;
    let termBtn = window.createStatusBarItem(rightPosBar, 200);
    let syncBtn = window.createStatusBarItem(rightPosBar, 201);
    let terminal = window.createTerminal({name: "Atom"});
    let log = window.createOutputChannel("atom/log");
    let getCurTime = () => new Date().toLocaleString().replace(/\//g,"-");
    let devType = {
        "atom": {
            patt: /aladdin-atom\/src\/app/,
            handle(term, log) {
                let res = /app\/((\w|_)+)(?=\/|$)/.exec(curFile);
                if (res && res[1]) {
                    curTime = getCurTime();
                    log.appendLine(`[${curTime}] 模板${res[1]}同步至测试机`);
                    term.sendText(`ala sync ${res[1]} -w`);
                }
            }
        },
        "atom-engine": {
            patt: /atom-engine-demo\/src/,
            handle(term, log) {
                curTime = getCurTime();
                log.appendLine(`[${curTime}] atom-engine启动调试`);
                term.sendText("atom-engine build -d");
            }
        },
        "next-page": {
            patt: /next-page\/src\/products/,
            handle(term, log) {
                curTime = getCurTime();
                log.appendLine(`[${curTime}] nextpage同步至测试机`);
                term.sendText("make watch");
            }
        }
    }

    // let hoverProvider = languages.registerHoverProvider({ scheme: 'file', language: 'atom' }, {
    //     provideHover(document, position, token) {
    //         let word = document.getText(document.getWordRangeAtPosition(position));
    //         console.log(word);
    //         if (word === 'c-line') {
    //             return new Hover('Line');
    //         }
    //     }
    // });

    // if (window.terminals[0].name === 'bash') {
    //     window.terminals[0].dispose();
    // }
    window.onDidChangeActiveTextEditor(e => curFile = e.document.fileName);

    termBtn.command = 'extension.terminal';
    termBtn.text = `$(terminal)`;
    termBtn.tooltip = "terminal";
    termBtn.show();

    syncBtn.command = 'extension.sync';
    syncBtn.text = `$(zap)`;
    syncBtn.tooltip = "sync";
    syncBtn.show();

    let jumpSoy = commands.registerCommand('extension.soy', function () {
        window.showInformationMessage('是否前往索引平台？', '是', '否').then((select) => {
            if (select === '是') {
                exec(`open 'http://soy.baidu-int.com/component'`);
            }
            else {
                window.setStatusBarMessage('(ノ=Д=)ノ┻━━┻', 3000);
            }
        });
    });
    
    let showTerminal = commands.registerCommand('extension.terminal', function () {
        terminal.show(true);
    });

    let syncMachine = commands.registerCommand('extension.sync', function () {
        Object.keys(devType).forEach((key) => {
            let cur = devType[key];
            if (cur.patt.test(curFile)) {
                cur.handle(terminal, log);
                return;
            }
        });
        // log.show();
        terminal.show(true);
    });
    
    // sub.push(hoverProvider);
    sub.push(jumpSoy);
    sub.push(showTerminal);
    sub.push(syncMachine);
}
function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;