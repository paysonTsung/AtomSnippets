# Atom Snippets

Code snippets for Atom in order to let you develop faster. 

为Atom/NextPage开发提供snippets功能

Atom Snippets的使用需要配合Mota插件提供的语言定义，所以使用前请确保安装并启动了Mota插件

## Features

- 提供Atom模板常用组件的Snippets功能
- 快捷键（⌘+.）或右键文本中菜单栏Soy跳转到索引平台

## Snippets available

### Atom
提供开发模板

prefix:

- ll 开发模板: template/script/style标签组
- lconfig
- lscript
- lstyle


### Atom组件
目前支持c-aladdin等47个atom组件

prefix:

- ll
    - {{ }} 文本插值
- component
- template
- caladdin
- ctitle
- cline
- cline2
- cimgcontent
- cimgcontents
- ...

### 常用属性
prefix:

- url
- params
- title
- data-module

### 注释
prefix:

- htmlcs-disable
- htmlcs-enable

### filter
支持filter拼sf/mip..

prefix:

- |sf
- |mip
- |vsearch

### Smarty
支持Ala全部Smarty API，常用Smarty语法及变量、代码块

prefix:

- ll
    - {% %} 定界符
- data
    - $tplData
- cprint
    - 打印数据
- cif
- cifelse
- cforeach
- ifempty
- ifisset
- empty
- isset
- tclink
- sflink
- miplink
- vsearchlink
- timglink
- tplinfo
- formatdate
- timespan
- highlight
- httpshost

### PHP
支持Ala全部PHP API，常用PHP语法及变量、代码块

prefix:

- data
    - $tplData
- datall
    - $tplData[' ']
- ll
    - [' ']
- cprint
    - 打印数据
- cif
- cifelse
- cforeach
- ifempty
- ifisset
- tclink
- sflink
- miplink
- vsearchlink
- timglink
- httpshost
- highlight
- tplinfo
- searchlink
- formatdate
- timespan
- templatevars

### JS
支持少量js语法

prefix:

- clog
    - console.log
- cif
- cifelse
- cfunction
- cswitch

## Plans

- 对全部Atom组件的snippets功能支持
- 鼠标悬停+快捷键等显示基本用法or跳转文档
- 底部状态栏提供按钮调终端一键同步到测试机
- nextpage引用组件文件跳转
- prop/data数据模板内sinppets
- 引用组件/数据模板内未使用的提示处理
- 模板内使用组件未引用等提示处理