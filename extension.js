/**
 * @model   Core
 * @version 0.3.7
 * @author  congpeisen
 */

let vscode = require('vscode');
let path   = require('path');
let fs     = require('fs');
let exec   = require('child_process').exec;
let {
    window,
    commands,
    languages
} = vscode;
function activate(context) {
    console.log('"Atom Snippets" is now active');

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

    let sub         = context.subscriptions;
    let rightPosBar = vscode.StatusBarAlignment.Right;
    let curFile     = window.activeTextEditor.document.fileName;
    let termBtn     = window.createStatusBarItem(rightPosBar, 200);
    let syncBtn     = window.createStatusBarItem(rightPosBar, 201);
    let terminal    = window.createTerminal({name: 'Atom'});
    let log         = window.createOutputChannel('Atom/log');
    let curTemplate = getCurTemplate(curFile);

    window.onDidChangeActiveTextEditor(e => {
        curFile     = e.document.fileName;
        curTemplate = getCurTemplate(curFile);
    });

    let devType = {
        'Atom': {
            patt: /aladdin-atom\/src\/app/,
            getLog() {
                return `[${getCurTime()}] 模板${curTemplate}同步至测试机`;
            },
            getSyncCmd() {
                return `ala sync ${curTemplate} -w`;
            },
            init(terminal, log) {
                if (curTemplate) {
                    log.appendLine(this.getLog());
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
            init(terminal, log) {
                log.appendLine(this.getLog());
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
            init(terminal, log) {
                log.appendLine(this.getLog());
                terminal.sendText(this.getSyncCmd());
            }
        }
    };

    let Btns = new Map([
        [
            termBtn,
            {
                command: 'extension.terminal',
                text: `$(terminal)`,
                tooltip: '终端'
            }
        ],
        [
            syncBtn,
            {
                command: 'extension.sync',
                text: `$(zap)`,
                tooltip: '同步至测试机'
            }
        ]
    ]);

    let Func = {
        /**
         * 跳转索引平台
         */
        jumpSoy: commands.registerCommand('extension.soy', function () {
            window
                .showInformationMessage('前往索引平台？', '是', '否')
                .then((select) => {
                    if (select === '是') {
                        exec(`open 'http://soy.baidu-int.com/component'`);
                    }
                    else {
                        window.setStatusBarMessage('(ノ=Д=)ノ┻━━┻', 3000);
                    }
                });
        }),

        /**
         * 显示控制台
         */
        showTerminal: commands.registerCommand('extension.terminal', function () {
            terminal.show(true);
        }),

        /**
         * 同步到测试机/启动调试
         */
        syncMachine: commands.registerCommand('extension.sync', function () {
            Object
                .keys(devType)
                .forEach((key) => {
                    let cur = devType[key];
                    if (cur.patt.test(curFile)) {
                        cur.init(terminal, log);
                        return;
                    }
                });
            // log.show();
            terminal.show(true);
        }),

        /**
         * 跳转定义
         */
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
                ];
                // let workRootPath = workspace.rootPath;
                // let line = document.lineAt(position);
                
                let wordArr           = word.split('/');
                let headWord          = wordArr.shift();
                let tailWord          = wordArr.join('/');
                let npRootPathArr     = fileName.match(/\S*next-page\/src\/products\//);
                let parentWorkPathArr = fileName.match(/\S*ps-se-fe-tpl\//);
                let jumpPath;
                let npRootPath;
                let npPdPath;
                let parentWorkPath;
                let jumpTo = (path) => 
                    new vscode.Location(
                        vscode.Uri.file(path),
                        new vscode.Position(0, 0)
                    );

                npRootPathArr && (npRootPath = npRootPathArr[0]);
                npPdPath = `${npRootPath}${headWord}`;
                parentWorkPathArr && (parentWorkPath = parentWorkPathArr[0]);

                for (let i = 0, len = extName.length; i < len; i++) {
                    jumpPath = path.join(fileName, '..', `${word}${extName[i]}`)
                    if (fs.existsSync(jumpPath)) {
                        return jumpTo(jumpPath);
                    }
                }

                let jumpPathStrategy = {
                    'next-page': () => 
                        `${npPdPath}/views/${tailWord}.atom.html`,
                    'search-ui': () => 
                        path.join(
                            parentWorkPath, headWord, '/src', tailWord,
                            '..', 'readme.md'
                        )
                };
                for (let i = 0, type; type = Object.keys(jumpPathStrategy)[i++];) {
                    if (fs.existsSync(
                        jumpPath = jumpPathStrategy[type]())) {
                        return jumpTo(jumpPath);
                    }
                }
            }
        }),

        /**
         * 智能提示
         * this.xx / this.$refs.xx / AlaUtil.xx
         */
        autoCompletion: languages.registerCompletionItemProvider(['atom'], {
            // TODO 代码待优化
            provideCompletionItems: (document, position) => {
                let doc            = document.getText();
                let line           = document.lineAt(position);
                let lineText       = line.text.substr(0, position.character); 
                let alaUtilTextArr = doc.match(/\w+(?=\sfrom\s[\'\"]@baidu\/ala-util\/ala[\'\"])/);
                let alaUtilText    = alaUtilTextArr ? alaUtilTextArr[0] : null;
                let reg = {
                    props: /this\.[^\s\.]*$/,
                    refs: /this\.\$refs\.[^\s\.]*$/,
                    alaUtil: alaUtilText
                        ? new RegExp(`${alaUtilText}\\.[^\\s\\.]*$`)
                        : null
                };
                let getPropArr = () => {
                    let dataPartArr = doc.match(/(props|data):\s*\{[^\{\}]+(\{[^\{\}]+\}[^\{\}]+)*[^\}]+\}/g);
                    let resArr      = [];
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
                        return new vscode.CompletionItem(
                            opt,
                            vscode.CompletionItemKind.Field
                        );
                    });
                };
                let getFuncArr = () => {
                    let methodsPartArr = doc.match(/methods:\s*\{[\s\S]*\};/);
                    let resArr = [];
                    resArr = methodsPartArr[0].match(/\w+(?=\([^\)]*\)\s*\{)/g);
                    return resArr.map((opt) => {
                        return new vscode.CompletionItem(
                            opt,
                            vscode.CompletionItemKind.Method
                        );
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
                        return new vscode.CompletionItem(
                            opt,
                            vscode.CompletionItemKind.Field
                        );
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
                        return new vscode.CompletionItem(
                            opt,
                            vscode.CompletionItemKind.Method
                        );
                    });
                }

                if (reg.props.test(lineText)) {
                    return [
                        ...getPropArr(),
                        ...getFuncArr()
                    ];
                } else if (reg.refs.test(lineText)) {
                    return getRefsArr();
                } else if (reg.alaUtil.test(lineText)) {
                    return getAlaUtilArr();
                }
            },
            resolveCompletionItem: (item) => {
                // item.insertText = 'xxx';
                return item;
            }
        }, '.'),

        /**
         * 智能提示
         * 引用模块/声明变量  import xx / let xxx
         */
        refCompletion: languages.registerCompletionItemProvider('atom', {
            provideCompletionItems: (document, position) => {
                let doc = document.getText();
                let beforeCursorDoc = document.getText(
                    new vscode.Range(new vscode.Position(0, 0), position)
                );
                if (!/module\.exports\s*\=/g.test(beforeCursorDoc)) {
                    return null;
                }
                let getQuoteArr = () => {
                    let quoteTextArr = doc.match(/(\{[\w\s,]+\}|\w+)(?=\s+from)/g);
                    let quoteGroup = [];
                    quoteTextArr.forEach((quoteText) => {
                        let quoteArr = quoteText.match(/\w+/g);
                        let type = quoteText.includes('{')
                                    ? 'Method'
                                    : 'Reference';
                        quoteArr.forEach((quote) => {
                            quoteGroup.push(new vscode.CompletionItem(
                                quote,
                                vscode.CompletionItemKind[type]
                            ));
                        })
                    });
                    return quoteGroup;
                }
                let getVarArr = () => {
                    let varTextArr = doc.match(/(var|let|const)\s+\w+\b/g);
                    let vars = [];
                    varTextArr.forEach((varText) => {
                        vars.push(varText.match(/\w+/g)[1]);
                    });
                    return vars.map((val) => 
                        new vscode.CompletionItem(
                            val,
                            vscode.CompletionItemKind.Variable
                        )
                    );
                }
                return [
                    ...getQuoteArr(),
                    ...getVarArr()
                ];
            },
            resolveCompletionItem: (item) => {
                return item;
            }
        })
    }

    // 初始化状态栏按钮
    Btns.forEach((btnObj, btn) => {
        Object
            .keys(btnObj)
            .forEach((item) => {
                btn[item] = btnObj[item];
                btn.show();
            });
    });

    // 注入功能方法
    Object
        .keys(Func)
        .forEach((item) => {
            sub.push(Func[item]);
        });
}
function deactivate() {
    
}

exports.activate = activate;
exports.deactivate = deactivate;