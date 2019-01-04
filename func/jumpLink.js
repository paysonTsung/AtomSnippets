/**
 * @description 跳转外链
 * @exports jumpSoy 跳转索引平台
 * @author congpeisen
 */

let vscode = require('vscode');
let exec   = require('child_process').exec;
let {
    window,
    commands,
} = vscode;

exports.jumpSoy = commands.registerCommand('extension.soy', function () {
    window
        .showInformationMessage('前往索引平台？', '是', '否')
        .then((select) => {
            if (select === '是') {
                exec(`open 'http://soy.baidu-int.com/component'`);
            }
            else {
                window.setStatusBarMessage('???', 3000);
            }
        });
})