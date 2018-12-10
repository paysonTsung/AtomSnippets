let vscode = require('vscode');
let exec = require('child_process').exec;
function activate(context) {
    console.log('Extension "Atom Snippets" is now active');

    let {window, commands} = vscode;
    let sub = context.subscriptions;
    let rightPosBar = vscode.StatusBarAlignment.Right;
    let termBtn = window.createStatusBarItem(rightPosBar, 200);
    let syncBtn = window.createStatusBarItem(rightPosBar, 201);
    let terminal = window.createTerminal({name: "Atom"});

    // window.terminals[0].dispose();

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
        let curPath = __filename;
        let devType = {
            at: {
                patt: /aladdin-atom\/src\/app/,
                handle(t) {
                    let res = /app\/((\w|_)+)(?=\/|$)/.exec(curPath);
                    if (res && res[1]) {
                        t.sendText(`ala sync ${res[1]} -w`);
                    }
                }
            },
            np: {
                patt: /next-page\/src\/products/,
                handle(t) {
                    t.sendText("make watch");
                }
            }
        }
        Object.keys(devType).forEach((key) => {
            let cur = devType[key];
            if (cur.patt.test(curPath)) {
                cur.handle(terminal);
                return;
            }
        });
        terminal.show(true);
    });
    
    sub.push(jumpSoy);
    sub.push(showTerminal);
    sub.push(syncMachine);
}
function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;