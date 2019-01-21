/**
 * @description 智能提示
 * @exports dataCompletion this.xx / this.$refs.xx / AlaUtil.xx
 * @exports refCompletion 引用模块/声明变量  import xx / let xxx
 * @author congpeisen
 */

let vscode = require('vscode');
let fs = require('fs');
let path = require('path')
let languages = vscode.languages;

let uniqueArr = (arr) => {
    let x = new Set(arr);
    return [...x];
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
            resArr.push('$refs');
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
        // item.insertText = 'xxx';
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

        let configData = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'snippets-diy/ui-class.json'), 'utf8'
            )
        );
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