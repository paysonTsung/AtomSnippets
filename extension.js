/**
 * @model        Core
 * @description  扩展主入口
 * @version      0.3.9
 * @author       congpeisen
 */

let vscode = require('vscode');

let {jumpSoy}                       = require('./func/jumpLink');
let {jumpFolder, jumpComponent}     = require('./func/jumpDefination');
let {showTerminal, syncMachine}     = require('./func/terminal');
let {dataCompletion, refCompletion} = require('./func/autoCompletion');

function activate(context) {
    console.log('"Atom Snippets" is now active');

    let createBtn = vscode.window.createStatusBarItem;
    let rightPos  = vscode.StatusBarAlignment.Right;
    let termBtn   = createBtn(rightPos, 200);
    let syncBtn   = createBtn(rightPos, 201);
    let Func = {
        jumpSoy,
        showTerminal,
        syncMachine,
        jumpFolder,
        jumpComponent,
        dataCompletion,
        refCompletion
    }
    let Btns = new Map([
        [
            termBtn, {
                command: 'extension.terminal',
                text: `$(terminal)`,
                tooltip: '终端'
            }
        ],
        [
            syncBtn, {
                command: 'extension.sync',
                text: `$(zap)`,
                tooltip: '同步至测试机'
            }
        ]
    ]); 

    // 初始化状态栏按钮
    Btns.forEach((btnObj, btn) => {
        Object.keys(btnObj)
            .forEach((item) => {
                btn[item] = btnObj[item];
                btn.show();
            });
    });

    // 注入功能方法
    Object.keys(Func)
        .forEach((item) => {
            context.subscriptions.push(Func[item]);
        });
}

exports.activate = activate;