/**
 * @description 跳转定义
 * @exports jumpFolder 跳转到对应文件
 * @exports jumpComponent 跳转到组件定义
 * @author congpeisen
 */

let vscode    = require('vscode');
let path      = require('path');
let fs        = require('fs');
let languages = vscode.languages;

// 获取选中组件文本
let getSelectWord = (doc, pos) =>
    doc.getText(
        doc.getWordRangeAtPosition(pos, /[\w-/]+/)
    );
// 跳转文件
// let jumpTo = (path, line = 0) => 
//     new vscode.Location(
//         vscode.Uri.file(path),
//         new vscode.Position(line, 0)
//     );

let jumpToPath = (doc, pos, path, lineList, reg) => {
    if (!Array.isArray(lineList)) {
        lineList = [lineList];
    }
    return new Promise(resolve => 
        resolve(lineList.map((line) => {
            return {
                targetUri: vscode.Uri.file(path),
                targetRange: new vscode.Range(
                    new vscode.Position(line, 0),
                    new vscode.Position(line + 1, 0)
                ),
                originSelectionRange: doc.getWordRangeAtPosition(pos, reg)
            }
        }))
    );
}

// 获取特定行
let getLine = (doc, line) =>
    doc.getText(
        new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line + 1, 0)
        )
    );

// 组件文本大写化转换  e.g.  c-img-content -> ImgContent
let capWord = (word) =>
    word
        .slice(2)
        .replace(/-\w/g, (frag) => frag.slice(1).toUpperCase())
        .replace(/^\w/, (frag) => frag.toUpperCase());

// 获取文档中匹配某模式的行数列表
let getEligibleLines = (doc, reg) => {
    let lineList = [];
    let curLineText = '';
    let curLine = 0;
    do {
        curLineText = getLine(doc, curLine++);
        if (reg.test(curLineText)) {
            lineList.push(curLine - 1);
        }
    } while (curLineText);
    return lineList;
}

let jumpType = {
    'component': {
        originRegExp(word) {
            return new RegExp(`['"]?${word}['"]?\\s?:\\s?['"][\\w-/_]+['"]`);
        },
        targetRegExp(word) {
            return new RegExp(`<${word}\\b`);
        }
    },
    'function': {
        originRegExp(word) {
            return new RegExp(`${word}\\([\\w\\s,]*\\)\\s*\\{`);
        },
        targetRegExp(word) {
            return new RegExp(`@[\\w-]+="${word}`);
        }
    }
}

exports.jumpFolder = languages.registerDefinitionProvider(['atom'], {
    provideDefinition: (document, position) => {
        // 引用组件处相关跳转
        let word = getSelectWord(document, position);
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
        
        npRootPathArr && (npRootPath = npRootPathArr[0]);
        npPdPath = `${npRootPath}${headWord}`;
        parentWorkPathArr && (parentWorkPath = parentWorkPathArr[0]);

        // 真实相对路径跳转
        for (let i = 0, len = extName.length; i < len; i++) {
            jumpPath = path.join(fileName, '..', `${word}${extName[i]}`)
            if (fs.existsSync(jumpPath)) {
                // return jumpTo(jumpPath);
                return jumpToPath(document, position, jumpPath, 0, /[\w/-]+/);
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

        // 组件路径跳转文件
        for (let i = 0, type; type = Object.keys(jumpPathStrategy)[i++];) {
            if (fs.existsSync(
                jumpPath = jumpPathStrategy[type]())) {
                // return jumpTo(jumpPath);
                return jumpToPath(document, position, jumpPath, 0, /[\w/-]+/);
            }
        }
    }
})

exports.jumpComponent = languages.registerDefinitionProvider(['atom'], {
    provideDefinition: (document, position) => {
        let word = getSelectWord(document, position);
        let curPath = vscode.window.activeTextEditor.document.uri.path;
        let clickLineText = document.lineAt(position).text;
        let regComponent = new RegExp(`<\\/?${word}`);
        if (regComponent.test(clickLineText)) {
            // 组件标签跳转到组件Readme
            let parentWorkPathArr = document.fileName.match(/\S*ps-se-fe-tpl\//);
            let parentWorkPath;
            parentWorkPathArr && (parentWorkPath = parentWorkPathArr[0]);
            let jumpPath = path.join(
                parentWorkPath, 'search-ui/src', capWord(word), 'readme.md'
            );
            if (fs.existsSync(jumpPath)) {
                // return jumpTo(jumpPath);
                return jumpToPath(document, position, jumpPath, 0, /[\w-]+/);
            }
        }
        else {
            // 文档内函数/组件跳转
            for (let i = 0, type; type = Object.keys(jumpType)[i++];) {
                if (jumpType[type].originRegExp(word).test(clickLineText)) {
                    let lines = getEligibleLines(document, jumpType[type].targetRegExp(word));
                    if (lines.length) {
                        return jumpToPath(document, position, curPath, lines, /[\w/-]+/);
                    }
                } else if(jumpType[type].targetRegExp(word).test(clickLineText)) {
                    let lines = getEligibleLines(document, jumpType[type].originRegExp(word));
                    if (lines.length) {
                        return jumpToPath(document, position, curPath, lines, /[\w/-]+/);
                    }
                }
            }
        }
    }
})