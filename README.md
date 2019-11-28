# vue-table-canvas-tcsl
> 天财商龙公司 -> 技术中心 -> 龙决策项目组 -> 一款用canvas实现的交叉表组件，同时支持PC端和APP端使用

## Install
``` bash
npm install vue-table-canvas-tcsl
```

## Quick Start

### 一、引入
``` bash
import vtct from 'vue-table-canvas-tcsl';
```

### 二、使用
``` bash
mixins: [vtct.utils, vtct.calculate, vtct.painted, vtct.events, vtct.scroller],
```

### 三、说明
文件|说明
:--|:--
index.js|模块入口文件
calculate.js|交叉表计算宽高，计算canvas宽高，计算滚动条大小，计算各种坐标，生成需要绘制的数据，和交叉表窗口内需要绘制的数据
event.js|为交叉表添加mousedown、mousemove、mouseup、resize、mousewheel、click、mousemove等事件
painted.js|交叉表绘制函数，根据calculate生成的数据，按坐标从交叉表背景，头部，主题，文字，渲染，绘制
scroller.js|生成滚动条，和滚动条事件函数
utils.js|处理渲染逻辑的工具方法
tools.js|处理数据结构的工具方法

## Changelog
Detailed changes for each release are documented in the [release notes](https://github.com/tcsl-ljc/vue-table-canvas-tcsl/releases).

## Special Thanks
[ZhangDongliang123](https://github.com/ZhangDongliang123).

[YuMay2009](https://github.com/YuMay2009).

[ashen9](https://github.com/ashen9)
