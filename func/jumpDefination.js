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

let getSelectWord = (doc, pos) =>
    doc.getText(
        doc.getWordRangeAtPosition(pos, /[\w-/]+/)
    );
let jumpTo = (path, line = 0) => 
    new vscode.Location(
        vscode.Uri.file(path),
        new vscode.Position(line, 0)
    );
let getLine = (doc, line) =>
    doc.getText(
        new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line + 1, 0)
        )
    );

exports.jumpFolder = languages.registerDefinitionProvider(['atom'], {
    provideDefinition: (document, position) => {
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
})

exports.jumpComponent = languages.registerDefinitionProvider(['atom'], {
    provideDefinition: (document, position) => {
        let word = getSelectWord(document, position);
        let curPath = vscode.window.activeTextEditor.document.uri.path;
        let curLineText;
        let curLine = 0;
        if (/^c-/.test(word)) {
            do {
                curLineText = getLine(document, curLine++);
                if (curLineText.includes(`<${word}`)) {
                    return jumpTo(curPath, curLine - 1);
                }
            } while (curLineText && !curLineText.includes('<script'));
        }
    }
})