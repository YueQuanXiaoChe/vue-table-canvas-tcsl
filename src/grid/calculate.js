export default {
  data () {
    let dpr = window.devicePixelRatio || 1;
    const rowHeight = 30 * dpr;
    const serialWidth = 0;
    const scrollerWidth = 8 * dpr;
    const height = 0;
    let originPointX = serialWidth;
    const toolbarHeight = 0;
    return {
      dpr: window.devicePixelRatio || 1,
      width: 0,
      height,
      rowHeight,
      scrollerWidth,
      fixedWidth: 0,
      fixedColumnsWidth: 0,
      bodyWidth: 0,
      bodyHeight: 0,
      serialWidth,
      fillWidth: 0,
      toolbarHeight,

      allCells: [],
      displayCells: [],
      allRows: [],
      displayRows: [],
      allColumns: [],
      displayColumns: [],
      displayLayeredColumns: [],
      allFixedCells: [],
      displayallFixedCells: [],
      fixedColumns: [],

      Hierarchy: 0,
      offset: {
        x: 0,
        y: 0
      },
      originPoint: {
        x: originPointX,
        y: rowHeight
      },
      maxPoint: {
        x: 0,
        y: height - scrollerWidth
      },
      tempTargetName: ''
    };
  },
  methods: {
    // 计算每列的宽度
    calculationWidth (arr) {
      let {ctx} = this;
      return arr.map((v) => {
        if (typeof v === 'string') {
          // measureText 在画布上输出文本之前，检查字体的宽度
          return this.i((ctx.measureText(v).width)) + (100 * this.dpr);
        }
        return 100 * this.dpr;
      }).sort((a, b) => b - a)[0] || 100;
    },
    // 计算 body 的宽度
    setbodyWidth () {
      if (!this.$refs.grid) return;

      if (this.platform === 'APP') {
        this.width = ((this.$refs.grid.offsetWidth || this.defaultWidth - 20) - 2) * this.dpr;
        this.height = ((this.$refs.grid.offsetHeight || this.defaultHeight - 20) - 2) * this.dpr;
      } else if (this.platform === 'PC') {
        this.width = (this.$refs.grid.offsetWidth - 2) * this.dpr;
        this.height = (this.$refs.grid.offsetHeight - 2) * this.dpr;
      }

      this.maxPoint.y = this.height - this.scrollerWidth;

      this.bodyWidth = this.originPoint.x;
      for (const column of this.columns) {
        this.bodyWidth += this.calculationWidth(column.compare_names);
      }
      this.fillWidth = 0;
      if (this.bodyWidth < this.width - this.scrollerWidth) {
        this.fillWidth = this.columns.length ? (this.width - this.bodyWidth - this.scrollerWidth) / this.columns.length : 0;
        this.bodyWidth = this.width - this.scrollerWidth;
      }
    },
    // 清除所有单元格数据
    clearAllCells () {
      this.data = [];
      this.allCells = [];
      this.allRows = [];
      this.allColumns = [];
      this.allFixedCells = [];
      this.fixedColumns = [];
    },
    // 获取所有单元格
    getAllCellsPC (value, columns, startIndex) {
      this.fixedWidth = 0;
      const {rowHeight, ctx, getTextLine, allRows, allCells, allColumns, fixedColumns} = this;
      let rowIndex = startIndex;
      let targetName = '';
      for (let i = startIndex; i < value.length; i += 1) {
        let item = value[i];
        for (let ii of Object.keys(item)) {
          if (ii.indexOf('lishide') === -1) {
            if (item[ii] !== 'dontPaintX') targetName = item[ii];
            break;
          }
        }
        let maxHeight = rowHeight;
        let cellIndex = 0;
        const cellTemp = [];
        let startX = 0;
        let rainbow = columns.findIndex((e) => e.key === value[i].stripe);
        // for (const column of columns) {
        columns.forEach((column, index) => {
          if (rowIndex === 0) {
            if (column.fixed) {
              fixedColumns.push({
                cellIndex,
                ...column,
                x: startX,
                checked: true,
                canJump: column.canJump,
                fieldId: column.fieldId
              });
              allColumns.push({
                height: rowHeight,
                cellIndex,
                ...column,
                checked: true,
                fieldId: column.fieldId,
                canJump: column.canJump
              });
              startX += column.width;
            } else {
              allColumns.push({
                height: rowHeight,
                cellIndex,
                ...column,
                checked: true,
                canJump: column.canJump,
                fieldId: column.fieldId
              });
            }
          }
          let text = item[column.key];
          let textLine;
          if (text || text === 0 || text === '') {
            if (!this.oneOption.rowColSwap) {
              textLine = getTextLine(ctx, text, column.width, column);
            } else {
              let obj = {isX: column.isX, pres: null};
              // 设置数值显示的格式化信息
              this.indexCondition.forEach((x) => {
                let val;
                if (x.fieldGroup === 6 && !x.aggregatorFlag) {
                  val = `${x.aliasName}`;
                } else {
                  val = `${x.aliasName}(${x.aggregatorName})`;
                }
                if (targetName) {
                  if (targetName.indexOf(val) >= 0) {
                    this.tempTargetName = targetName;
                    // if (Number(text) || text === 0 || text === '0' || text === '0.0') obj.pres = x.numDisplayed;
                    if (Number(text) || parseFloat(text) === 0) obj.pres = x.numDisplayed;
                  }
                } else {
                  // if (Number(text) || text === 0 || text === '0' || text === '0.0') obj.pres = x.numDisplayed;
                  if (this.tempTargetName.indexOf(val) >= 0) {
                    if (Number(text) || parseFloat(text) === 0) obj.pres = x.numDisplayed;
                  }
                }
              });
              if (this.dimensionCondition.length > 0) {
                let isInDim = false;
                for (let dim of this.dimensionCondition) {
                  if (dim.aliasName === column.title || dim.fieldDescription === column.title) {
                    isInDim = true;
                    break;
                  }
                }
                textLine = getTextLine(ctx, text, column.width, obj, isInDim);
              } else {
                if (this.indexCondition.length > 0) {
                  let isInIndex = true;
                  for (let ind of this.indexCondition) {
                    if (columns[0].title.indexOf(ind.aliasName) === -1 && columns[0].title.indexOf(ind.fieldDescription) === -1) {
                    // if (ind.aliasName !== column.title && ind.fieldDescription !== column.title) {
                      isInIndex = false;
                      break;
                    }
                  }
                  if (index >= (columns.length - this.indexCondition.length)) isInIndex = false;
                  textLine = getTextLine(ctx, text, column.width, obj, isInIndex);
                }
              }
            }

            let textLineCount = 0;
            if (textLine) {
              textLineCount = textLine.length;
            }
            if (textLineCount > 1) {
              if (maxHeight < rowHeight + ((textLineCount - 1) * 18 * this.dpr)) {
                maxHeight = rowHeight + ((textLineCount - 1) * 18 * this.dpr);
              }
            }
          }

          cellTemp.push({
            width: column.width,
            content: item[column.key],
            key: column.key,
            rowIndex,
            cellIndex,
            rainbow,
            paintText: textLine,
            fixed: column.fixed === true,
            renderText: column.renderText,
            rowData: item,
            pres: column.pres,
            type: column.type,
            isX: column.isX,
            isChangeBgFontColor: true,
            isZongJi: item[column.key].toString().indexOf('总计') >= 0
          });

          cellIndex += 1;
        });
        this.Hierarchy = Math.max(...allColumns.map(v => v.compare_names.length)) - 1;
        if (cellTemp[0].content !== 'swapNull') {
          allCells.push(cellTemp);
          allRows.push({
            height: maxHeight,
            rowIndex
          });
          rowIndex += 1;
        }
      }

      for (let item of allCells) {
        let isChangeBgFontColor = true;
        for (let child of item) {
          if (child.content === '小计' || child.content === '列总计') {
            isChangeBgFontColor = false;
            break;
          }
        }
        for (let child of item) {
          child.isChangeBgFontColor = isChangeBgFontColor;
        }
      }
      this.originPoint.y = ((Math.max(...allColumns.map(v => v.compare_names.length))) * rowHeight);
      this.allFixedCells = [];
      if (this.allFixedCells.length === 0) {
        for (const item of fixedColumns) {
          const temp = [];
          let index = 0;
          for (const row of allCells) {
            const cell = row[item.cellIndex];
            temp.push({
              ...cell,
              height: allRows[index].height,
              canJump: item.canJump,
              x: item.x,
              uniqueId: item.uniqueId
            });
            index += 1;
          }
          this.allFixedCells.push(temp);
        }
      }
      this.fixedColumnsWidth = this.getHeaderTree(JSON.parse(JSON.stringify(fixedColumns))).reduce((p, e) => p + e.width, 0);
    },
    // 获取所有单元格
    getAllCellsAPP (value, columns, startIndex) {
      this.fixedWidth = 0;
      const {rowHeight, ctx, getTextLine, allRows, allCells, allColumns} = this;
      let rowIndex = startIndex;
      let targetName = '';
      for (let i = startIndex; i < value.length; i += 1) {
        let item = value[i];
        for (let ii of Object.keys(item)) {
          if (ii.indexOf('lishide') === -1) {
            if (item[ii] !== 'dontPaintX') targetName = item[ii];
            break;
          }
        }
        let maxHeight = rowHeight;
        let cellIndex = 0;
        const cellTemp = [];
        // for (const column of columns) {
        columns.forEach((column, index) => {
          if (rowIndex === 0) {
            allColumns.push({
              height: rowHeight,
              cellIndex,
              ...column,
              checked: true,
              canJump: column.canJump,
              fieldId: column.fieldId
            });
          }
          let text = item[column.key];
          let textLine;
          if (text || text === 0 || text === '') {
            if (!this.oneOption.rowColSwap) {
              textLine = getTextLine(ctx, text, column.width, column);
            } else {
              let obj = {isX: column.isX, pres: null};
              // 设置数值显示的格式化信息
              this.indexCondition.forEach((x) => {
                let val;
                if (x.fieldGroup === 6 && !x.aggregatorFlag) {
                  val = `${x.aliasName}`;
                } else {
                  val = `${x.aliasName}(${x.aggregatorName})`;
                }
                if (targetName) {
                  if (targetName.indexOf(val) >= 0) {
                    // if (Number(text) || text === 0 || text === '0' || text === '0.0') obj.pres = x.numDisplayed;
                    if (Number(text) || parseFloat(text) === 0) obj.pres = x.numDisplayed;
                  }
                } else {
                  // if (Number(text) || text === 0 || text === '0' || text === '0.0') obj.pres = x.numDisplayed;
                  if (Number(text) || parseFloat(text) === 0) obj.pres = x.numDisplayed;
                }
              });
              if (this.dimensionCondition.length > 0) {
                let isInDim = false;
                for (let dim of this.dimensionCondition) {
                  if (dim.aliasName === column.title || dim.fieldDescription === column.title) {
                    isInDim = true;
                    break;
                  }
                }
                textLine = getTextLine(ctx, text, column.width, obj, isInDim);
              } else {
                if (this.indexCondition.length > 0) {
                  let isInIndex = true;
                  for (let ind of this.indexCondition) {
                    if (columns[0].title.indexOf(ind.aliasName) === -1 && columns[0].title.indexOf(ind.fieldDescription) === -1) {
                    // if (ind.aliasName !== column.title && ind.fieldDescription !== column.title) {
                      isInIndex = false;
                      break;
                    }
                  }
                  if (index >= (columns.length - this.indexCondition.length)) isInIndex = false;
                  textLine = getTextLine(ctx, text, column.width, obj, isInIndex);
                }
              }
            }

            let textLineCount = 0;
            if (textLine) {
              textLineCount = textLine.length;
            }
            if (textLineCount > 1) {
              if (maxHeight < rowHeight + ((textLineCount - 1) * 18 * this.dpr)) {
                maxHeight = rowHeight + ((textLineCount - 1) * 18 * this.dpr);
              }
            }
          }

          cellTemp.push({
            width: column.width,
            content: item[column.key],
            key: column.key,
            rowIndex,
            cellIndex,
            paintText: textLine,
            fixed: column.fixed === true,
            renderText: column.renderText,
            rowData: item,
            pres: column.pres,
            type: column.type,
            isX: column.isX,
            isChangeBgFontColor: true,
            isZongJi: item[column.key].toString().indexOf('总计') >= 0
          });

          cellIndex += 1;
        });
        this.Hierarchy = Math.max(...allColumns.map(v => v.compare_names.length)) - 1;
        allCells.push(cellTemp);
        allRows.push({
          height: maxHeight,
          rowIndex
        });
        rowIndex += 1;
      }
      for (let item of allCells) {
        let isChangeBgFontColor = true;
        for (let child of item) {
          if (child.content === '小计' || child.content === '列总计') {
            isChangeBgFontColor = false;
            break;
          }
        }
        for (let child of item) {
          child.isChangeBgFontColor = isChangeBgFontColor;
        }
      }
      this.originPoint.y = ((Math.max(...allColumns.map(v => v.compare_names.length))) * rowHeight);
    },
    initSize () {
      if (this.$refs.grid) {
        if (this.platform === 'APP') {
          this.width = ((this.$refs.grid.offsetWidth || this.defaultWidth - 20) - 2) * this.dpr;
          this.height = ((this.$refs.grid.offsetHeight || this.defaultHeight - 20) - 2) * this.dpr;
        } else if (this.platform === 'PC') {
          this.width = (this.$refs.grid.offsetWidth - 2) * this.dpr;
          this.height = (this.$refs.grid.offsetHeight - 2) * this.dpr;
        }

        this.originPoint.x = this.serialWidth;

        this.bodyWidth = this.originPoint.x;
        let columnCount = 0;
        for (const column of this.allColumns) {
          this.bodyWidth += this.calculationWidth(column.compare_names);
          columnCount += 1;
        }
        // 填充宽度
        this.fillWidth = 0;
        if (this.bodyWidth < this.width - this.scrollerWidth) {
          this.fillWidth = columnCount ? (this.width - this.bodyWidth - this.scrollerWidth) / columnCount : 0;
          this.bodyWidth = this.width - this.scrollerWidth;
        }
        this.setBodyHeight(this.allRows, this.originPoint);
        this.setMaxpoint(this.width, this.height, this.scrollerWidth);
        this.resetScrollBar(this.maxPoint, this.bodyWidth, this.bodyHeight, this.fixedWidth);
        window.requestAnimationFrame(this.rePainted);
      }
    },
    // 计算 body 的高度
    setBodyHeight (allRows, {y}) {
      this.bodyHeight = y + this.toolbarHeight;
      for (const row of allRows) {
        this.bodyHeight += row.height;
      }
    },
    setMaxpoint (width, height, scrollerWidth) {
      this.maxPoint.x = width - scrollerWidth;
      this.maxPoint.y = height - scrollerWidth;
    },
    // 设置所有单元格
    setAllCells (startIndex, first = false) {
      let loadNum = 40;
      let maxCeLL = this.allData[0] ? Object.keys(this.allData[0]).length : 0;

      if (this.allData.length > 200 && maxCeLL < 500 && !first) {
        loadNum = 25;
      } else if (maxCeLL > 500 && !first) {
        loadNum = 10;
      }

      let maxIndex = startIndex + loadNum > this.allData.length ? this.allData.length : startIndex + loadNum;

      for (let i = startIndex; i < maxIndex; i += 1) {
        let item = this.allData[i];
        this.data.push(item);
      }
      if (first) {
        this.columns.forEach((v) => {
          v.width = this.calculationWidth(v.compare_names);
        });
      }

      if (this.platform === 'APP') {
        this.getAllCellsAPP(this.data, this.columns, startIndex);
      } else if (this.platform === 'PC') {
        this.getAllCellsPC(this.data, this.columns, startIndex);
      }
      this.setBodyHeight(this.allRows, this.originPoint);
      this.resetScrollBar(this.maxPoint, this.bodyWidth, this.bodyHeight, this.fixedWidth);
    },
    getHeaderTree (arr, option = {fixed: true}) {
      // 这个方法优化的地方是把递归放入内层   把现有递归里面的判断提取出来
      // 这点地方看的懂看不懂就看缘分吧    也别强行琢磨   我也不太懂
      // 反正就是交叉表表头部分
      if (!this.Hierarchy) {
        return arr.map((v) => {
          v.i = this.Hierarchy;
          return v;
        });
      }
      const headerTree = [];
      const headerTreeIsX = [];
      if (!option.fixed) {
        arr = arr.filter(v => !v.fixed);
      }
      if (arr) {
        arr.forEach((v, i) => {
          v.i = this.Hierarchy;
          let isFirst = true;
          let num = headerTree.length;
          if (v.isX) {
            v.child = [];
            headerTreeIsX.push(v);
            return;
          }
          for (const ii in headerTree) {
            if (headerTree[ii] && headerTree[ii].title === v.compare_names[0] && !headerTree[ii].isX && (headerTree[ii].index + 1 === i)) {
              isFirst = false;
              num = ii;
            }
          }
          if (!isFirst) {
            headerTree[num].width += v.width;
            v.compare_names = v.compare_names.slice(1);
            headerTree[num].i = this.Hierarchy - v.compare_names.length;
            headerTree[num].y = (this.Hierarchy - v.compare_names.length) * this.rowHeight;
            headerTree[num].height = this.rowHeight;
            const obj = {
              width: v.width,
              x: v.x,
              child: [],
              compare_names: v.compare_names,
              i: this.Hierarchy,
              ...v
            };
            headerTree[num].child.push(obj);
            headerTree[num].index = i;
          } else {
            headerTree[num] = {
              width: v.width,
              x: v.x,
              child: [],
              title: v.compare_names[0],
              compare_names: v.compare_names,
              i: (this.Hierarchy - v.compare_names.length) + 1,
              y: ((this.Hierarchy - v.compare_names.length) + 1) * this.rowHeight,
              height: this.rowHeight,
              index: i
            };

            if (v.compare_names.slice(1).length >= 1) {
              headerTree[num].child = [v];
              headerTree[num].child[0].compare_names = v.compare_names.slice(1);
            }
          }
        });
      }

      headerTree.forEach((e) => {
        if (e.child[0] && e.child[0].compare_names.length > 1) {
          e.child = this.getHeaderTree(e.child);
        }
      });
      return [...headerTreeIsX, ...headerTree];
    },
    // 初始化显示行列
    initDisplayItems () {
      const displayColumns = this.getDisplayColumns();
      const displayRows = this.getDisplayRows();
      const displayCells = this.getDisplayCells(displayRows, displayColumns);
      let displayFixedCells = null;
      if (this.platform === 'PC') {
        displayFixedCells = this.getDisplayFixedCells(displayRows);
      }
      const displayLayeredColumns = this.getHeaderTree(JSON.parse(JSON.stringify(displayColumns)));
      return {displayColumns, displayRows, displayCells, displayFixedCells, displayLayeredColumns};
    },
    getDisplayColumns () {
      const {offset: {x}, originPoint, maxPoint, allColumns, fillWidth, getHeaderTree} = this;
      const temp = [];
      let startX = originPoint.x + x;
      for (const column of allColumns) {
        if (column.checked) {
          const width = column.width + fillWidth;
          if (width + startX > originPoint.x && startX < maxPoint.x) {
            const columnClone = Object.assign({}, column, {x: startX, width});
            temp.push(columnClone);
          }
          startX += width;
        }
      }
      setTimeout(() => {
        this.displayColumns = [...temp];
      }, 0);
      this.displayLayeredColumns = getHeaderTree(JSON.parse(JSON.stringify(this.displayColumns)));
      return temp;
    },
    getDisplayRows () {
      const {offset: {y}, originPoint, maxPoint, allRows, toolbarHeight} = this;
      const temp = [];
      let startY = originPoint.y + y + toolbarHeight;
      for (const row of allRows) {
        if (startY + row.height > originPoint.y + toolbarHeight && startY < maxPoint.y) {
          const rowClone = Object.assign({}, row, {y: startY});
          temp.push(rowClone);
        } else if (startY >= maxPoint.y) {
          break;
        }
        startY += row.height;
      }
      setTimeout(() => {
        this.displayRows = [...temp];
      }, 0);
      return temp;
    },
    getDisplayCells (displayRows, displayColumns) {
      const temp = [];
      const {allCells, fillWidth} = this;
      for (const row of displayRows) {
        const cellTemp = [];
        for (const column of displayColumns) {
          let cell = allCells[row.rowIndex][column.cellIndex];
          const cellClone = Object.assign({}, cell, {
            x: column.x,
            y: row.y,
            width: cell.width + fillWidth,
            height: row.height,
            canJump: column.canJump,
            fieldId: column.fieldId,
            uniqueId: column.uniqueId,
            cellBgColor: '',
            cellFontColor: '',
            isZongJi: allCells[row.rowIndex][0].isZongJi
          });//eslint-disable-line
          if (cellClone.content === '小计' || cellClone.content === '列总计' || cellClone.content === 'dontPaintX' || cellClone.content === 'dontPaintY') {
            cellClone.canJump = false;
          }
          if (cellClone.isChangeBgFontColor && !this.oneOption.rowColSwap) this.dealColorOption(cellClone, this.twoOption, column.compare_values);
          cellTemp.push(cellClone);
        }
        if (cellTemp[0] && cellTemp[0].content !== 'swapNull' && cellTemp[0].content !== 'NaN') {
          temp.push(cellTemp);
        }
      }
      setTimeout(() => {
        this.displayCells = [...temp];
      }, 0);
      return temp;
    },
    getDisplayFixedCells (displayRows) {
      const temp = [];
      const {allFixedCells, fillWidth, displayColumns} = this;
      for (const fixedCell of allFixedCells) {
        const fixedCellTemp = [];
        for (const row of displayRows) {
          const fixed = fixedCell[row.rowIndex];
          const fixedCellClone = Object.assign({}, fixed, {
            y: row.y,
            x: fixed.x,
            width: fixed.width + fillWidth,
            height: row.height,
            canJump: fixed.canJump,
            uniqueId: fixedCell[row.rowIndex].uniqueId,
            cellBgColor: '',
            cellFontColor: ''
          });
          if (fixedCellClone.content === '小计' || fixedCellClone.content === '列总计' || fixedCellClone.content === 'dontPaintX' || fixedCellClone.content === 'dontPaintY') {
            fixedCellClone.canJump = false;
          }
          let name = '';
          let index = 0;
          for (let item of displayColumns) {
            if (item.uniqueId === fixedCellClone.uniqueId) {
              index++;
              if (index === fixedCellClone.cellIndex) {
                name = item.compare_values;
                break;
              }
            }
          }
          if (fixedCellClone.isChangeBgFontColor && !this.oneOption.rowColSwap) this.dealColorOption(fixedCellClone, this.twoOption, name);
          fixedCellTemp.push(fixedCellClone);
        }
        temp.push(fixedCellTemp);
      }
      setTimeout(() => {
        this.displayallFixedCells = [...temp];
      }, 0);
      return temp;
    }
  },
  destroyed () {
    this.allCells = null;
    this.allColumns = null;
    this.allRows = null;
    this.displayCells = null;
    this.displayRows = null;
    this.displayColumns = null;
    this.displayLayeredColumns = null;
    this.allFixedCells = null;
    this.displayallFixedCells = null;
    this.fixedColumns = null;
  }
};
