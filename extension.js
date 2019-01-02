/**
 * 插件入口
 * TODO: 待拆分文件, 待优化
 */

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
        let res = /app\/((?:\w|_)+)(?=\/|$)/.exec(curFile);
        if (res && res[1]) {
            return res[1];
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
            logText() {
                return `[${getCurTime()}] 模板${curTemplate}同步至测试机`;
            },
            termText() {
                return `ala sync ${curTemplate} -w`;
            },
            handle(term, log) {
                if (curTemplate) {
                    log.appendLine(this.logText());
                    term.sendText(this.termText());
                }
            }
        },
        'atom-engine': {
            patt: /fe-duer-swan/,
            logText(){
                return `[${getCurTime()}] atom-engine启动调试`;
            },
            termText(){
                return 'atom-engine build -d';
            },
            handle(term, log) {
                log.appendLine(this.logText());
                term.sendText(this.termText());
            }
        },
        'next-page': {
            patt: /next-page\/src\/products/,
            logText() {
                return `[${getCurTime()}] nextpage同步至测试机`;
            },
            termText() {
                return 'make watch';
            },
            handle(term, log) {
                log.appendLine(this.logText());
                term.sendText(this.termText());
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
        }),
        autoCompletion: languages.registerCompletionItemProvider(['atom'], {
            // TODO 代码待优化
            provideCompletionItems: (document, position) => {
                let doc = document.getText();
                let line  = document.lineAt(position);
                let lineText = line.text.substr(0, position.character); 
                let alaUtilTextArr = doc.match(/\w+(?=\sfrom\s[\'\"]@baidu\/ala-util\/ala[\'\"])/);
                let alaUtilText = alaUtilTextArr ? alaUtilTextArr[0] : null;
                let reg = {
                    props: /this\.[^\s\.]*$/,
                    refs: /this\.\$refs\.[^\s\.]*$/,
                    alaUtil: alaUtilText ? new RegExp(`${alaUtilText}\\.[^\\s\\.]*$`) : null,
                }
                let getPropArr = () => {
                    let dataPartArr = doc.match(/(props|data):\s*\{[^\{\}]+(\{[^\{\}]+\}[^\{\}]+)*[^\}]+\}/g);
                    let resArr = [];
                    resArr.push('$refs');
                    dataPartArr.forEach((dataObj) => {
                        let dataArr = dataObj.match(/\b\w+(?=:)/g);
                        dataArr.shift();
                        resArr = resArr.concat(...dataArr);
                    });
                    return resArr.filter((opt) => {
                        if (opt === 'default' || opt === 'type') {
                            return false;
                        }
                        return opt;
                    }).map((opt) => {
                        return new vscode.CompletionItem(opt, vscode.CompletionItemKind.Field);
                    });
                };
                let getFuncArr = () => {
                    let methodsPartArr = doc.match(/methods:\s*\{[\s\S]*\};/);
                    let resArr = [];
                    resArr = methodsPartArr[0].match(/\w+(?=\([^\)]*\)\s*\{)/g);
                    return resArr.map((opt) => {
                        return new vscode.CompletionItem(opt, vscode.CompletionItemKind.Method);
                    });
                };
                let getRefsArr = () => {
                    let refsPartArr = doc.match(/\bref\=\"(\w+)\"/g);
                    let resArr = [];
                    refsPartArr.forEach((refPart) => {
                        let ref = refPart.match(/\w+(?=\")/);
                        resArr.push(ref[0]);
                    });
                    return resArr.map((opt) => {
                        return new vscode.CompletionItem(opt, vscode.CompletionItemKind.Field);
                    });
                };
                let getAlaUtilArr = () => {
                    let resArr = [
                        'highLight',
                        'getHttpsHost',
                        'makeTcLink',
                        'makeSfLink',
                        'makeMipLink',
                        'makeSearchLink',
                        'makeSearchTcLink',
                        'makeTimg',
                        'sendLog',
                        'setHttpsHost'
                    ];
                    return resArr.map((opt) => {
                        return new vscode.CompletionItem(opt, vscode.CompletionItemKind.Method);
                    });
                }

                if (reg.props.test(lineText)) {
                    let propArr = getPropArr();
                    let funcArr = getFuncArr();
                    return [...propArr, ...funcArr];
                } else if (reg.refs.test(lineText)) {
                    let refsArr = getRefsArr();
                    return refsArr;
                } else if (reg.alaUtil.test(lineText)) {
                    let alaUtilArr = getAlaUtilArr();
                    return alaUtilArr;
                }
            },
            resolveCompletionItem: (item) => {
                // item.insertText = 'xxx';
                return item;
            }
        }, '.')
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