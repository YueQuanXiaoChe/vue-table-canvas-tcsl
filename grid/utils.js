/* eslint no-useless-escape: "off" */

export default {
  methods: {
    getTextLine (ctx, text, width, {isX, pres}, isInDim = false) {
      if (pres && !isInDim) {
        if (text !== '- -') {
          text = this.addingUnit(text, pres.state.unit);
          text = this.fmoney(text, pres.state.dec, pres.state.commas);
          text = text + pres.state.unit;
        }
      }
      const chr = `${text}`.split('');
      let temp = '';
      const row = [];
      for (let a = 0; a < chr.length; a += 1) {
        if (ctx.measureText(temp).width >= width - (36 * this.dpr) + this.fillWidth) {
          row.push(temp);
          temp = '';
        }
        temp += chr[a];
      }
      row.push(temp);
      return row;
    },
    addingUnit (val, unit) {
      let nVal = val;
      if (unit === '万') {
        nVal = val / 10000;
      } else if (unit === '亿') {
        nVal = val / 100000000;
      } else if (unit === 'K') {
        nVal = val / 1000;
      } else if (unit === 'M') {
        nVal = val / 1000000;
      } else if (unit === '%') {
        nVal = val * 100;
      }
      return nVal;
      // let arr = (nVal.toString()).split('.');
      // if (arr.length === 1) {
      //   return Number(arr[0] + '.' + '000000');
      // } else if (arr.length === 2) {
      //   arr[1] += '000000';
      //   arr[1] = arr[1].substring(0, 6);
      //   return Number(arr[0] + '.' + arr[1]);
      // } else {
      //   return Number(nVal).toFixed(6);
      // }
      // return Number(nVal).toFixed(6); // 妈的，坑爹呀
    },
    round (v, e) {
      var t = 1;
      for (;e > 0; t *= 10, e--);
      for (;e < 0; t /= 10, e++);
      return Math.round(v * t) / t;
    },
    fmoney (s = 0, n = 2, f) {
      // s = Number(s).toFixed(6);
      let arr = s.toString().split('.');
      if (arr.length === 2 && arr[1].length > 7) {
        let sub = arr[1].substring(0, 7);
        s = arr[0] + '.' + sub;
      }
      /* eslint no-useless-escape: "off" */
      s = parseFloat((s + '').replace(/[^\d\.-]/g, ''));//eslint-disable-line
      let flag = s < 0;
      if (flag) s = Math.abs(s);
      s = this.round(s, n);
      if (flag) s = -s;
      if (parseFloat(s) === 0) {
        s = Number(0).toFixed(n);
      }
      var source = s.toString().split('.');// 按小数点分成2部分
      if (source[1]) {
        source[1] = (source[1] + '000000').substring(0, n);
      } else {
        let str = '';
        for (let i = 0; i < n; i++) {
          str += '0';
        }
        source.push(str);
      }
      if (f) source[0] = source[0].replace(new RegExp('(\\d)(?=(\\d{3})+$)', 'ig'), '$1,');// 只将整数部分进行都好分割
      return n > 0 ? source.join('.') : source[0] + '';// 再将小数部分合并进来
    },
    getHeadWord (x, y, columns) {
      let selectColumn = null;
      const digui = (displayColumns) => {
        for (const column of displayColumns) {
          if (column.child && column.child.length > 0) {
            digui(column.child);
          } else if (x > column.x && x < column.x + column.width && y > (column.isX ? 0 : column.i * this.rowHeight) && y < (column.i + 1) * this.rowHeight) {
            selectColumn = Object.assign({}, column);
          }
        }
      };
      digui(this.getHeaderTree(JSON.parse(JSON.stringify(columns))));
      return selectColumn;
    },
    getFixedHeadIcon (x, y, columns, position, size) {
      let selectColumn = null;
      const digui = (displayColumns) => {
        for (const column of displayColumns) {
          if (column.child && column.child.length > 0) {
            digui(column.child);
          } else if (x > (column.x + column.width) - (position) && x < (column.x + column.width) - (position - size) && y > (column.isX ? 0 : column.i * this.rowHeight) && y < (column.i + 1) * this.rowHeight) {
            selectColumn = Object.assign({}, column);
          }
        }
      };
      digui(this.getHeaderTree(JSON.parse(JSON.stringify(columns))));
      return selectColumn;
    },
    getSortHeadIcon (x, y, columns, size) {
      let selectColumn = null;
      const digui = (displayColumns) => {
        for (const column of displayColumns) {
          if (column.child && column.child.length > 0) {
            digui(column.child);
          } else {
            if (this.platform === 'APP') {
              if (x > column.x && x < column.x + column.width && y > (column.isX ? 0 : column.i * this.rowHeight) && y < (column.i + 1) * this.rowHeight) {
                selectColumn = Object.assign({}, column);
              }
            } else if (this.platform === 'PC') {
              if (x > (column.x + column.width / 2 + this.ctx.measureText(column.title).width / 2) && x < (column.x + (column.width / 2 + this.ctx.measureText(column.title).width / 2) + size) && y > (column.isX ? 0 : column.i * this.rowHeight) && y < (column.i + 1) * this.rowHeight) {
                selectColumn = Object.assign({}, column);
              }
            }
          }
        }
      };
      digui(this.getHeaderTree(JSON.parse(JSON.stringify(columns))));
      return selectColumn;
    },
    getDrillObj (x, y, rows) {
      let yy = this.oneOption.rowColSwap ? -(this.originPoint.y + 1) : 0;
      let obj = null;
      for (const row of rows) {
        for (const column of row) {
          if (x > column.x && x < (column.x + column.width) && y > (column.y + yy) && y < (column.height + column.y + yy)) {
            obj = column;
          }
        }
      }
      return obj;
    },
    // rgb to hex
    rgbToHex (r, g, b) {
      var hex = ((r << 16) | (g << 8) | b).toString(16);
      return '#' + new Array(Math.abs(hex.length - 7)).join('0') + hex;
    },
    // hex to rgb
    hexToRgb (hex) {
      var rgb = [];
      for (var i = 1; i < 7; i += 2) {
        rgb.push(parseInt('0x' + hex.slice(i, i + 2)));
      }
      return rgb;
    },
    // 计算渐变过渡色
    gradient (startColor, endColor, step) {
      // 将 hex 转换为rgb
      let sColor = this.hexToRgb(startColor);
      let eColor = this.hexToRgb(endColor);

      // 计算R\G\B每一步的差值
      let rStep = (eColor[0] - sColor[0]) / step;
      let gStep = (eColor[1] - sColor[1]) / step;
      let bStep = (eColor[2] - sColor[2]) / step;

      var gradientColorArr = [];
      for (var i = 0; i < step; i++) {
        // 计算每一步的hex值
        gradientColorArr.push(this.rgbToHex(parseInt(rStep * i + sColor[0]), parseInt(gStep * i + sColor[1]), parseInt(bStep * i + sColor[2])));
      }
      return gradientColorArr;
    },
    // 处理交叉表颜色配置
    dealColorOption (cell, option, name = '') {
      if (option.type === 'tableColor') {
        let arr = option.value;
        for (let item of arr) {
          if (cell.uniqueId === item.uniqId) {
            if (item.colorType === '0') { // 单色
              this.dealColorOnly(cell, item);
            } else if (item.colorType === '1') { // 色阶
              let min = 0;
              let max = 0;
              for (let color of this.colorStepConfig) {
                if (color.uniqueId === item.uniqId) {
                  min = color.min;
                  max = color.max;
                  break;
                }
              }
              this.dealColorStep(cell, item, min, max);
            }
            break;
          }
        }
      }
    },
    // 处理单色
    dealColorOnly (cell, item) {
      let fun = (cell, tmp) => {
        cell.cellBgColor = tmp.color.bgColor;
        cell.cellFontColor = tmp.color.fontColor;
      };
      if (cell.content === '- -') {
        for (let i = 0; i < item.color.length; i++) {
          let tmp = item.color[i];
          if (tmp.compare === 2) { // 不等于
            fun(cell, tmp);
          }
        }
      }
      let num = Number(cell.content);
      if (num !== 0 && !num) return;
      for (let i = 0; i < item.color.length; i++) {
        let tmp = item.color[i];
        switch (tmp.compare) {
          case 0: // 介于
            if (num >= tmp.min && num <= tmp.max) {
              fun(cell, tmp);
            }
            break;
          case 1: // 等于
            if (num === tmp.min) {
              fun(cell, tmp);
            }
            break;
          case 2: // 不等于
            if (num !== tmp.min) {
              fun(cell, tmp);
            }
            break;
          case 3: // 大于
            if (num > tmp.min) {
              fun(cell, tmp);
            }
            break;
          case 4: // 大于等于
            if (num >= tmp.min) {
              fun(cell, tmp);
            }
            break;
          case 5: // 小于
            if (num < tmp.min) {
              fun(cell, tmp);
            }
            break;
          case 6: // 小于等于
            if (num <= tmp.min) {
              fun(cell, tmp);
            }
            break;
        }
      }
    },
    // 处理色阶
    dealColorStep (cell, item, min, max) {
      let num = Number(cell.content);
      if (num === 0 || num) {
        if (max === min) {
          cell.cellBgColor = item.color[0].color.startColor;
        } else {
          let p = (num - min) / (max - min);
          let colorArr = this.gradient(item.color[0].color.startColor, item.color[0].color.endColor, 10);
          cell.cellBgColor = p === 1 ? item.color[0].color.endColor : colorArr[Math.floor(p * 10)];
        }
        cell.cellFontColor = item.color[0].color.fontColor;
      }
    }
  }
};
