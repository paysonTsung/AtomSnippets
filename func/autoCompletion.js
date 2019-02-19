/**
 * @description 智能提示
 * @author congpeisen
 * @todo 文件待拆分
 * @todo 待抽象函数、缓存等优化
 * @todo 组件prop补全: 匹配组件模式,提供不同prop补全
 */

let vscode = require('vscode');
let fs = require('fs');
let path = require('path');
let languages = vscode.languages;

const UI_CLASS_PATH = 'snippets-diy/ui-class.json';
const ATOM_COM_PATH = 'snippets-diy/atom-components.json';
const ATOM_REF_PATH = 'snippets-diy/atom-reference.json';
const ATOM_PROP_PATH = 'snippets-diy/atom-props.json';
const ATOM_EVENT_PATH = 'snippets-diy/atom-events.json';
const ATOM_INST_PATH = 'snippets-diy/atom-instructions.json';

// 数组去重
let uniqueArr = (arr) => [...new Set(arr)];

// 获取文件json数据
let getFileData = (filePath) =>
    JSON.parse(
        fs.readFileSync(
            path.join(__dirname, filePath), 'utf8'
        )
    );

// 检查是否是template内部
let checkIfTemplate = (document, position) =>
    document.getText(
        new vscode.Range(
            position,
            new vscode.Position(document.lineCount, 0)
        )
    ).includes('</template>');

// 正则匹配行模式
let checkLinePrefix = (document, position, reg) => {
    let prefixLine = document.lineAt(position).text.substr(0, position.character);
    if (reg.test(prefixLine)) {
        return prefixLine;
    }
    return '';
}
// 正则匹配是否为组件头内部并获取组件
let checkComponentHead = (document, position) => {
    let matchArr = [];
    let matchComponent = '';
    let curLineNum = -1;
    let curLineStr = '';
    let focusLineStr = document.lineAt(position).text;
    let focusLineNum = document.lineAt(position).lineNumber;
    let posLeftLine = focusLineStr.substr(0, position.character);
    let posRightLine = focusLineStr.substr(position.character);

    if (posLeftLine.includes('>') || posRightLine.includes('<')) return '';

    curLineNum = focusLineNum - 1;
    while (curLineNum > 0) {
        curLineStr = document.lineAt(curLineNum).text;
        if (curLineStr.includes('>')) return '';
        if (/\s*<\w*/.test(curLineStr)) {
            matchComponent = curLineStr.match(/\s*<(?=([\w-]*\b))/)[1];
            break;
        }
        curLineNum--;
    }
    
    curLineNum = focusLineNum + 1;
    while (curLineNum < document.lineCount - 1) {
        curLineStr = document.lineAt(curLineNum).text;
        if (curLineStr.includes('<')) return '';
        if (/\s*>/.test(curLineStr) && matchComponent) {
            return matchComponent;
        }
        curLineNum++;
    }

    return '';
}

// this.xx / this.$refs.xx / AlaUtil.xx
languages.registerCompletionItemProvider(['atom'], {
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
            let dataPartArr = doc.match(/(props|data):\s*\{[^\{\}]*(\{[^\{\}]*\}[^\{\}]+)*[^\}]+\}/g) || [];
            let resArr      = [];
            let extraArr    = [
                '$refs',
                '$emit',
                '$slots'
            ];
            resArr = [...extraArr];
            dataPartArr.forEach((dataObj) => {
                let dataArr = dataObj.match(/\b\w+(?=:)/g);
                dataArr.shift();
                resArr = resArr.concat(...dataArr);
            });
            resArr = uniqueArr(resArr);

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
            if (!methodsPartArr) return [];
            let resArr = [];
            // resArr = methodsPartArr[0].match(/\w+(?=\([^\)]*\)\s*\{)/g);
            resArr = methodsPartArr[0].match(/\w+(?=\([\w\s,]*\)\s*\{)/g);
            if (!resArr) return [];
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
        return item;
    }
}, '.');

// 引用模块/声明变量  import xx / let xxx
languages.registerCompletionItemProvider('atom', {
    provideCompletionItems: (document, position) => {
        let doc = document.getText();
        let beforeCursorDoc = document.getText(
            new vscode.Range(new vscode.Position(0, 0), position)
        );
        if (!/(module\.exports\s*\=|export\s+default\s*)/g.test(beforeCursorDoc)) {
            return null;
        }
        let getQuoteArr = () => {
            let quoteTextArr = doc.match(/(\{[\w\s,]+\}|\w+)(?=\s+from)/g) || [];
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
            let varTextArr = doc.match(/(var|let|const)\s+\w+\b/g) || [];
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
});

// PSMD-UI
languages.registerCompletionItemProvider('atom', {
    provideCompletionItems: (document, position) => {
        let matchPos = document.getWordRangeAtPosition(position, /class="[\w\s-_]*"/);
        if (!matchPos) return null;

        let configData = getFileData(UI_CLASS_PATH);

        return Object.keys(configData).map((data) => {
            let item = new vscode.CompletionItem(
                data,
                vscode.CompletionItemKind.Field
            )
            item.detail = `${configData[data].description}\n(Atom Snippets)`;
            return item;
        });
    },
    resolveCompletionItem: (item) => {
        return item;
    }
});

// Atom组件模板自动补全
languages.registerCompletionItemProvider('atom', {
    provideCompletionItems: (document, position) => {
        // 补全校验
        if (
            checkIfTemplate(document, position)
            && checkLinePrefix(document, position, /^\s*\w*$/)
            && !checkComponentHead(document, position)
        ) {
            let atomComponents = getFileData(ATOM_COM_PATH);

            return Object.keys(atomComponents).map((item) => {
                let itemObj = atomComponents[item];
                let sniItem = new vscode.CompletionItem(
                    itemObj.prefix,
                    vscode.CompletionItemKind.Struct
                )
                sniItem.insertText = new vscode.SnippetString(itemObj.body.join('\n'));
                sniItem.detail = `${itemObj.description}\n(Atom Snippets)`;
                sniItem.command = {
                    title: 'autoAddComponent',
                    command: 'extension.autoAddComponent',
                    arguments: [sniItem.label]
                };
                return sniItem;
            });
        }
    },
    resolveCompletionItem: (item) => {
        return item;
    }
});

// Atom组件引用自动补全
vscode.commands.registerCommand('extension.autoAddComponent', function (label) {
    // 检查用户配置
    let switchConfig = vscode.workspace.getConfiguration().get('AtomSnippets.autoAddRef');
    if (!switchConfig) return;

    // 处理 c-line-2/c-img-content-s 等自定义情况
    if (/-[\w\n]$/.test(label)) {
        label = label.slice(0, -2);
    }

    let refObj = getFileData(ATOM_REF_PATH)[label];
    if (!refObj) return;

    let textEditor = vscode.window.activeTextEditor;
    let componentText = '';
    let componentArr = [];
    let document = textEditor.document; // 当前活动文档实例
    let doc = document.getText(); // 文档字符串

    let comWrapperArr = doc.match(/components\s*:\s*\{[^\}]*\}/);
    let isFirstRef = false;
    // 匹配components行
    if (comWrapperArr) {
        componentText = comWrapperArr[0];
        componentArr = componentText.match(/[\w-_]+(?='\s*:)/g);
        if (componentArr) {
            // 检查引用组件是否已存在
            for (let i = 0, item; item = componentArr[i++];) {
                if (item === label) return;
            }
        } else {
            isFirstRef = true;
        }

        let curLineNum = 0;
        let curLineText = '';
        let targetLine = 0;

        // 获取components所在行
        do {
            curLineText = document.lineAt(curLineNum++).text;
            if (/components\s*:\s*\{/.test(curLineText)) {
                targetLine = curLineNum - 1;
                break;
            }
        } while(curLineNum < document.lineCount);

        if (targetLine) {
            // 获取components所在行前空格数量
            let blankArr = curLineText.match(/\s(?=\s*components)/g) || [];
            let tabNum = Math.ceil(blankArr.length / 4 + 1);
            // let tabStr = new Array(tabNum).fill('\t').join('');
            let blankStr = new Array(tabNum*4).fill(' ').join('');

            // 操作文档
            textEditor.edit(editBuilder => {
                // 删除多余空行
                if (document.lineAt(targetLine + 1).text.replace(/\s*/, '') === '') {
                    editBuilder.delete(
                        new vscode.Range(
                            new vscode.Position(targetLine + 1, 0),
                            new vscode.Position(targetLine + 2, 0)
                        )
                    );
                }

                // 插入引用
                let insertLine = refObj.body.join(`\n${blankStr}`); // 生成引用字符串
                let lineTail = document.lineAt(targetLine).text.length; // 行字符串长度为行尾位置
                editBuilder.insert(
                    new vscode.Position(targetLine, lineTail),
                    `\n${blankStr}${insertLine}${isFirstRef ? '' : ','}`
                );
            });
        }
    }
})

// Atom组件props自动补全
languages.registerCompletionItemProvider('atom', {
    provideCompletionItems: (document, position) => {
        let matchComponent = '';
        let prefixLine = '';
        let snippetsArr = [];
        // 补全校验
        if(
            checkIfTemplate(document, position)
            && (prefixLine = checkLinePrefix(document, position, /^\s*(\:|@)?\w*$/))
            && (matchComponent = checkComponentHead(document, position))
        ) {
            if (/^\s*@/.test(prefixLine)) {
                // + events
                let atomEvents = getFileData(ATOM_EVENT_PATH);
                let atomEventsArr = atomEvents[matchComponent];
                if (atomEventsArr) {
                    return atomEventsArr.map((item) => {
                        let sniItem = new vscode.CompletionItem(
                            item.prefix,
                            vscode.CompletionItemKind.Event
                        )
                        sniItem.insertText = new vscode.SnippetString(item.body.join('\n'));
                        sniItem.detail = `${item.description}\n(Atom Snippets)`;
                        return sniItem;
                    });
                }
            } else {
                if (/^\s*\w/.test(prefixLine)) {
                    // + class等
                    let atomInstObj = getFileData(ATOM_INST_PATH);

                    snippetsArr = [
                        ...snippetsArr,
                        ...Object.keys(atomInstObj).map((item) => {
                            let itemObj = atomInstObj[item];
                            let sniItem = new vscode.CompletionItem(
                                itemObj.prefix,
                                vscode.CompletionItemKind.Enum
                            )
                            sniItem.insertText = new vscode.SnippetString(itemObj.body.join('\n'));
                            sniItem.detail = `${itemObj.description}\n(Atom Snippets)`;
                            return sniItem;
                        })
                    ];
                }
                // + props
                let atomProps = getFileData(ATOM_PROP_PATH);
                let atomPropArr = atomProps[matchComponent];
                if (atomPropArr) {
                    snippetsArr = [
                        ...snippetsArr,
                        ...atomPropArr.map((item) => {
                            let sniItem = new vscode.CompletionItem(
                                item.prefix,
                                vscode.CompletionItemKind.Property
                            )
                            sniItem.insertText = new vscode.SnippetString(item.body.join('\n'));
                            sniItem.detail = `${item.description}\n(Atom Snippets)`;
                            return sniItem;
                        })
                    ];
                }
                return snippetsArr;
            }
            return null;
        }
    },
    resolveCompletionItem: (item) => {
        return item;
    }
});