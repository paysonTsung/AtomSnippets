let vscode = require('vscode');
let path = require('path');
let fs = require('fs');
let exec = require('child_process').exec;
let {
    window,
    commands,
    // workspace,
    languages,
    Location,
    Position,
    Uri,
} = vscode;
function activate(context) {
    console.log('"Atom Snippets" is now active');

    let getCurTime = () => new Date().toLocaleString().replace(/\//g, '-');
    let getCurTemplate = (curFile) => {
        let res = /app\/((\w|_)+)(?=\/|$)/.exec(curFile);
        if (res && res[0]) {
            return res[0];
        }
    }
    let curFile = window.activeTextEditor.document.fileName;
    let sub = context.subscriptions;
    let rightPosBar = vscode.StatusBarAlignment.Right;
    let termBtn = window.createStatusBarItem(rightPosBar, 200);
    let syncBtn = window.createStatusBarItem(rightPosBar, 201);
    let terminal = window.createTerminal({name: 'Atom'});
    let log = window.createOutputChannel('atom/log');
    let curTemplate = getCurTemplate(curFile);
    window.onDidChangeActiveTextEditor(e => {
        curFile = e.document.fileName;
        curTemplate = getCurTemplate(curFile);
    });
    let devType = {
        'atom': {
            patt: /aladdin-atom\/src\/app/,
            logText: `[${getCurTime()}] 模板${curTemplate}同步至测试机`,
            termText: `ala sync ${curTemplate} -w`,
            handle(term, log) {
                if (curTemplate) {
                    log.appendLine(this.logText);
                    term.sendText(this.termText);
                }
            }
        },
        'atom-engine': {
            patt: /fe-duer-swan/,
            logText: `[${getCurTime()}] atom-engine启动调试`,
            termText: 'atom-engine build -d',
            handle(term, log) {
                log.appendLine(this.logText);
                term.sendText(this.termText);
            }
        },
        'next-page': {
            patt: /next-page\/src\/products/,
            logText: `[${getCurTime()}] nextpage同步至测试机`,
            termText: 'make watch',
            handle(term, log) {
                log.appendLine(this.logText);
                term.sendText(this.termText);
            }
        }
    };
    let Btns = new Map([
        [
            termBtn,
            {
                command: 'extension.terminal',
                text: `$(terminal)`,
                tooltip: 'terminal'
            }
        ],
        [
            syncBtn,
            {
                command: 'extension.sync',
                text: `$(zap)`,
                tooltip: 'sync'
            }
        ]
    ]);

    let Func = {
        jumpSoy: commands.registerCommand('extension.soy', function () {
            window.showInformationMessage('前往索引平台？', '是', '否').then((select) => {
                if (select === '是') {
                    exec(`open 'http://soy.baidu-int.com/component'`);
                }
                else {
                    window.setStatusBarMessage('(ノ=Д=)ノ┻━━┻', 3000);
                }
            });
        }),
        showTerminal: commands.registerCommand('extension.terminal', function () {
            terminal.show(true);
        }),
        syncMachine: commands.registerCommand('extension.sync', function () {
            Object.keys(devType).forEach((key) => {
                let cur = devType[key];
                if (cur.patt.test(curFile)) {
                    cur.handle(terminal, log);
                    return;
                }
            });
            // log.show();
            terminal.show(true);
        }),
        jumpDefination: languages.registerDefinitionProvider(['atom'], {
            provideDefinition: (document, position) => {
                let word = document.getText(
                    document.getWordRangeAtPosition(position, /[\w-/]+/)
                );
                let fileName = document.fileName;
                let extName = [
                    '',
                    '.atom',
                    '.atom.html'
                ]
                // let workRootPath = workspace.rootPath;
                // let line = document.lineAt(position);
                
                let wordArr = word.split('/');
                let headWord = wordArr.shift();
                let tailWord = wordArr.join('/');
                let npRootPathArr = fileName.match(/\S*next-page\/src\/products\//);
                let parentWorkPathArr = fileName.match(/\S*ps-se-fe-tpl\//);
                let jumpPath;
                let npRootPath;
                let npPdPath;
                let parentWorkPath;
                let jumpTo = (path) => {
                    return new Location(Uri.file(path), new Position(0, 0));
                };

                npRootPathArr && (npRootPath = npRootPathArr[0]);
                npPdPath = `${npRootPath}${headWord}`;
                parentWorkPathArr && (parentWorkPath = parentWorkPathArr[0]);

                for (let i = 0, len = extName.length; i < len; i++) {
                    jumpPath = path.join(fileName, '..', `${word}${extName[i]}`)
                    if (fs.existsSync(jumpPath)) {
                        return jumpTo(jumpPath);
                    }
                }

                if (fs.existsSync(jumpPath = `${npPdPath}/views/${tailWord}.atom.html`)) {
                    // nextpage
                    return jumpTo(jumpPath);
                } else if(fs.existsSync(jumpPath = path.join(parentWorkPath, headWord, '/src', tailWord, '..', 'readme.md'))) {
                    // search-ui
                    return jumpTo(jumpPath);
                }
            }
        })
    }

    Btns.forEach((btnObj, btn) => {
        Object.keys(btnObj).forEach((item) => {
            btn[item] = btnObj[item];
            btn.show();
        });
    });
    Object.keys(Func).forEach((item) => {
        sub.push(Func[item]);
    });
}
function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;