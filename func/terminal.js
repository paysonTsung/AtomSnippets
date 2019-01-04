/**
 * @description 终端相关命令注册
 * @exports showTerminal 调起集成终端
 * @exports syncMachine 同步测试机/启动调试
 * @author congpeisen
 */

let vscode = require('vscode');
let {
    window,
    commands
} = vscode;

let terminal = window.createTerminal({name: 'Atom'});
let output   = window.createOutputChannel('Atom/log');

let getCurTime = () => 
    new Date()
        .toLocaleString()
        .replace(/\//g, '-');

let getCurTemplate = (curFilePath) => {
    let res = /app\/((?:\w|_)+)(?=\/|$)/.exec(curFilePath);
    if (res && res[1]) {
        return res[1];
    }
}

window.onDidChangeActiveTextEditor(e => {
    curFile     = e.document.fileName;
    curTemplate = getCurTemplate(curFile);
});

let curFile     = window.activeTextEditor.document.fileName;
let curTemplate = getCurTemplate(curFile);
let devType = {
    'Atom': {
        patt: /aladdin-atom\/src\/app/,
        getLog() {
            return `[${getCurTime()}] 模板${curTemplate}同步至测试机`;
        },
        getSyncCmd() {
            return `ala sync ${curTemplate} -w`;
        },
        init(terminal, output) {
            if (curTemplate) {
                output.appendLine(this.getLog());
                terminal.sendText(this.getSyncCmd());
            }
        }
    },
    'Atom-Engine': {
        patt: /fe-duer-swan/,
        getLog(){
            return `[${getCurTime()}] atom-engine启动调试`;
        },
        getSyncCmd(){
            return 'atom-engine build -d';
        },
        init(terminal, output) {
            output.appendLine(this.getLog());
            terminal.sendText(this.getSyncCmd());
        }
    },
    'Next-Page': {
        patt: /next-page\/src\/products/,
        getLog() {
            return `[${getCurTime()}] nextpage同步至测试机`;
        },
        getSyncCmd() {
            return 'make watch';
        },
        init(terminal, output) {
            output.appendLine(this.getLog());
            terminal.sendText(this.getSyncCmd());
        }
    }
};

exports.showTerminal = commands.registerCommand('extension.terminal', function () {
    terminal.show(true);
});

exports.syncMachine = commands.registerCommand('extension.sync', function () {
    Object
        .keys(devType)
        .forEach((key) => {
            let cur = devType[key];
            if (cur.patt.test(curFile)) {
                cur.init(terminal, output);
                return;
            }
        });
    // output.show();
    terminal.show(true);
});
