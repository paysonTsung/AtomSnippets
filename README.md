# Atom Snippets

Code snippets for Atom in order to let you develop faster. 

为以下开发提供代码片段自补全功能:

- [Atom](http://atom.baidu-int.com/atom-web)
- [AtomEngine](http://atom.baidu-int.com/atom-native)
- [NextPage](http://superframe.baidu.com/support/next-page/)

(新版本提供了语言定义, Snippets功能不再依赖Mota插件)

默认Tab/Enter键触发补全

## Features

- 支持Atom、Smarty语法高亮
- 提供Atom常用组件、属性等Snippets功能
- 提供smarty、php预处理文件Ala全部API的Snippets功能
- 提供this./this.$refs./引入模块/声明变量等的代码智能提示
- 提供AtomEngine全部组件、通用属性、通用事件、生命周期等Snippets功能
- 底部状态栏提供按钮调起终端及快速同步到测试机/启动调试并输出日志(Atom/log)
    - atom执行 ala sync [template] -w
    - nextpage执行 make watch
    - atom-engine执行 atom-engine build -d
- 文件引用处(⌘+鼠标左键)跳转到对应文件(需要本地路径与远程一致)
    - atom组件引用跳转到search-ui下对应组件readme
    - nextpage组件跳转到app_components下对应文件
    - 其他跳转到对应文件
- 函数/组件跳转定义
- 快捷键（⌘+.）或右键文本中菜单栏Soy跳转到索引平台(暂定)

### Demo-atom补全
<!-- ![demo_a](images/demo_a.gif) -->
<img src="https://raw.githubusercontent.com/paysonTsung/AtomSnippets/master/images/demo_a.gif" width="400"/>

### Demo-php补全
<!-- ![demo_b](images/demo_b.gif) -->
<img src="https://raw.githubusercontent.com/paysonTsung/AtomSnippets/master/images/demo_b.gif" width="480"/>

## Snippets available

### Atom
提供开发模板

prefix:

- `ll`
    - 开发模板: template/script/style标签组
- `lconfig`
- `lscript`
- `lstyle`
- `lstyle-less`


### Atom组件
目前支持c-aladdin等47个atom组件

atom/prefix:

- `ll`
    - {{ }} 文本插值
- `component`
- `template`
- `c-aladdin`
- `c-title`
- `c-line`
- `c-line-2`
- `c-img-content`
- `c-img-content-s`
- ......

atom-engine/prefix:

- `view`
- `text`
- `image`
- `webview`
- `viewpager`
- `scrollview`
- `h-scrollview`
- `photo`
- `video`
- `@click`
- `@tap`
- `@focus`
- `@touchstart`
- `@touchend`
- `@touchmove`
- `@scroll`

### 常用属性
prefix:

- `ref`
- `class`
- `style`
- `url`
- `params`
- `title`
- `data-module`

### 指令
prefix:

- `a-once`
- `a-if`
- `a-else-if`
- `a-else`
- `a-for`
- `a-for-i`
- `a-model`
- `a-pre`
- `a-nossr`

### 常用class
prefix:

- `c-container`
- `c-container-tight`
- `c-color`
- `c-gap-top`
- `WA_LOG_TAB`
- ......


### 注释
prefix:

- `htmlcs-disable`
- `htmlcs-enable`

### filter
支持filter拼sf/mip..

prefix:

- `|sf`
- `|mip`
- `|vsearch`

### config
支持目前所有atom组件引用

prefix:

- `c-aladdin`
- `c-title`
- `c-line`
- ......

### Smarty
支持Ala全部Smarty API，常用Smarty语法及变量、代码块

prefix:

- `ll`
    - {% %} 定界符
- `data`
    - $tplData
- `cprint`
    - 打印数据, 用于文件末
- `if`
- `ifelse`
- `foreach`
- `break`
- `ifempty`
- `ifisset`
- `empty`
- `isset`
- `tclink`
- `sflink`
- `miplink`
- `vsearchlink`
- `timglink`
- `tplinfo`
- `formatdate`
- `timespan`
- `highlight`
- `httpshost`

### PHP
支持Ala全部PHP API，常用PHP变量、代码块

p.s. 删除了部分语法, 建议使用内置vscode-php代码补充

prefix:

- `data`
    - $tplData
- `datall`
    - $tplData[' ']
- `ll`
    - [' ']
- `cprint`
    - 打印数据, 用于文件末
- `ifempty`
- `ifisset`
- `tclink`
- `sflink`
- `miplink`
- `vsearchlink`
- `timglink`
- `httpshost`
- `highlight`
- `tplinfo`
- `searchlink`
- `formatdate`
- `timespan`
- `templatevars`

### JS
支持少量js语法、生命周期函数、库引用

p.s. 删除了部分语法, 建议使用内置vscode-javascript代码补充

prefix:

- `clog`
- `cfunc`
- `computed`
- `beforeCreate`
- `created`
- `beforeMount`
- `preMounted`
- `mounted`
- `beforeUpdated`
- `updated`
- `beforeDestroy`
- `destroyed`
- `import alaUtil`
- `require swan`
- `require atomengine`

## Plans

- 补全优化
- 组件跳转定义
- 迁入语言服务器
- Atom所有组件片段补全
- PSMD常用class智能提示
- 组件补全后自动向config中添加组件引用
- 模板内使用组件未引用/引入组件未使用等提示处理

## Common Issues
配置修改setting.json用户设置

- atom中无法使用vscode内置插件emmet语法

    修改emmet语言映射

    ```json
    "emmet.includeLanguages": {
        "atom-html": "html",
        "atom": "html"
    }
    ```

- nextpage 代码自补全功能不生效

    配置语言文件关联

    ```json
    "files.associations": {
        "*.atom.html": "atom"
    }
    ```

- vscode自带单词提示优先级高于sinppets

    <img src="https://raw.githubusercontent.com/paysonTsung/AtomSnippets/master/images/set_priority.png" width="200"/>
    <!-- ![set_priority](images/set_priority.png) -->

    设置取消文本提示, 或将snippets优先级设置最高

    ```json
    "editor.wordBasedSuggestions": false,
    "editor.snippetSuggestions": "top"  // 该行配置不建议使用
    ```

- 双击组件无法选中组件整体

    设置编辑器单词导航分隔符

    ```json
    "editor.wordSeparators": "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?"
    ```

- 字符串内无法使用自动补全功能

    设置编辑器键入

    ```json
    "editor.quickSuggestions": {
        "other": true,
        "comments": false,
        "strings": true
    }
    ```