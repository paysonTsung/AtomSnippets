/**
 * @description 智能提示
 * @exports dataCompletion this.xx / this.$refs.xx / AlaUtil.xx
 * @exports refCompletion 引用模块/声明变量  import xx / let xxx
 * @author congpeisen
 */

let vscode = require('vscode');
let fs = require('fs');
let path = require('path');
let languages = vscode.languages;

const UI_CLASS_PATH = 'snippets-diy/ui-class.json';
const ATOM_COM_PATH = 'snippets-diy/atom-components.json';
const ATOM_REF_PATH = 'snippets-diy/atom-reference.json';

// 数组去重
let uniqueArr = (arr) => {
    let x = new Set(arr);
    return [...x];
}

//获取json数据
let getFileData = (filePath) => {
    return JSON.parse(
        fs.readFileSync(
            path.join(__dirname, filePath), 'utf8'
        )
    );
}

exports.dataCompletion = languages.registerCompletionItemProvider(['atom'], {
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
            let methodsPartArr = doc.match(/methods:\s*\{[\s\S]*\};/) || [];
            if (!methodsPartArr.length) return [];
            let resArr = [];
            // resArr = methodsPartArr[0].match(/\w+(?=\([^\)]*\)\s*\{)/g);
            resArr = methodsPartArr[0].match(/\w+(?=\([\w\s,]*\)\s*\{)/g);
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

exports.refCompletion = languages.registerCompletionItemProvider('atom', {
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
            item.detail = `${configData[data].description} (Atom Snippets)`;
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
        if(
            !document.getText(
                new vscode.Range(
                    position,
                    new vscode.Position(document.lineCount, 0)
                )
            ).includes('</template>')  //非template模板内部不触发
            || !/^\s*\w*$/.test(
                document.lineAt(position).text.substr(0, position.character)
            )  // 非空行不触发
        ) return;

        let atomComponents = getFileData(ATOM_COM_PATH);

        return Object.keys(atomComponents).map((item) => {
            let itemObj = atomComponents[item];
            let sniItem = new vscode.CompletionItem(
                itemObj.prefix,
                vscode.CompletionItemKind.Struct
            )
            sniItem.insertText = new vscode.SnippetString(itemObj.body.join('\n'));
            sniItem.detail = `${itemObj.description} (Atom Snippets)`;
            sniItem.command = {
                title: 'autoAddComponent',
                command: 'extension.autoAddComponent',
                arguments: [sniItem.label]
            };
            return sniItem;
        });
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