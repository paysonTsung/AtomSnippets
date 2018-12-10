let vscode = require('vscode');
let exec = require('child_process').exec;
function activate(context) {
    console.log('Extension "Atom Snippets" is now active!');
    let gotoSoy = vscode.commands.registerCommand('extension.soy', function () {
        vscode.window.showInformationMessage('是否前往索引平台？', '是', '否').then((select) => {
            if (select === '是') {
                exec(`open 'http://soy.baidu-int.com/component'`);
            }
            else {
                vscode.window.setStatusBarMessage('(ノ=Д=)ノ┻━━┻', 3000);
            }
        });

        // let debugButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
        // debugButton.command = 'extension.build';
        // debugButton.text = `$(zap)`;
        // debugButton.tooltip = "Build";
        // debugButton.show();

        // vscode.window.showInputBox({
        //     placeHolder: '输入查询Atom组件',
        //     prompt: '前往索引平台'
        // }).then(msg => {
        //     if(!msg) return;
        //     if (msg.slice(0, 2) === 'c-') {
        //         msg = msg.slice(2);
        //     }
        //     exec(`open 'http://soy.baidu-int.com/component/${msg}'`);
        // });
    });

    // let build = vscode.commands.registerCommand('extension.build', function () {
    //     let terminal = vscode.window.createTerminal({name: "bash"});
    //     terminal.show(true);
    //     terminal.sendText("make watch");
    // });
    
    context.subscriptions.push(gotoSoy);
    // context.subscriptions.push(build);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;