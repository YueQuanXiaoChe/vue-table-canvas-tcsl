export function throttle (delay, noTrailing, callback, debounceMode) {
  // After wrapper has stopped being called, this timeout ensures that
  // `callback` is executed at the proper times in `throttle` and `end`
  // debounce modes.
  var timeoutID;

  // Keep track of the last time `callback` was executed.
  var lastExec = 0;

  // `noTrailing` defaults to falsy.
  if (typeof noTrailing !== 'boolean') {
    debounceMode = callback;
    callback = noTrailing;
    noTrailing = undefined;
  }

  // The `wrapper` function encapsulates all of the throttling / debouncing
  // functionality and when executed will limit the rate at which `callback`
  // is executed.
  function wrapper () {
    var self = this;
    var elapsed = Number(new Date()) - lastExec;
    var args = arguments;

    // Execute `callback` and update the `lastExec` timestamp.
    function exec () {
      lastExec = Number(new Date());
      callback.apply(self, args);
    }

    // If `debounceMode` is true (at begin) this is used to clear the flag
    // to allow future `callback` executions.
    function clear () {
      timeoutID = undefined;
    }

    if (debounceMode && !timeoutID) {
      // Since `wrapper` is being called for the first time and
      // `debounceMode` is true (at begin), execute `callback`.
      exec();
    }

    // Clear any existing timeout.
    if (timeoutID) {
      clearTimeout(timeoutID);
    }

    if (debounceMode === undefined && elapsed > delay) {
      // In throttle mode, if `delay` time has been exceeded, execute
      // `callback`.
      exec();
    } else if (noTrailing !== true) {
      // In trailing throttle mode, since `delay` time has not been
      // exceeded, schedule `callback` to execute `delay` ms after most
      // recent execution.
      //
      // If `debounceMode` is true (at begin), schedule `clear` to execute
      // after `delay` ms.
      //
      // If `debounceMode` is false (at end), schedule `callback` to
      // execute after `delay` ms.
      timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
    }
  }

  // Return the wrapper function.
  return wrapper;
};

export function rowColSwap2 (chartData, condition, setting) {
  let {isDimension, isCompare, isIndex} = condition;
  let xaxis = [];
  let yaxis = [];
  // 如果 x y 轴都没有数据，就 return
  if (chartData.xaxis.length === 0 && chartData.yaxis.length === 0) return {xaxis, yaxis};
  // 给 tmpData 赋值
  let tmpData = null;
  if (chartData.xaxis.length > 0) { // x 轴有数据
    tmpData = chartData.xaxis;
  } else if (chartData.yaxis.length > 0) { // y 轴有数据
    tmpData = chartData.yaxis;
  }
  // 将 tmpData[0] 放入 xaxis 中, 将 tmpData[0].data 放入 yaxis 中
  // xaxis.push({data: [], name: tmpData[0].name, uniqueId: tmpData[0].uniqueId});
  // for (let item of tmpData[0].data) {
  //   yaxis.push({data: [], name: item, uniqueId: tmpData[0].uniqueId});
  // }
  xaxis.push({data: [tmpData[0].name], name: tmpData[0].name, uniqueId: tmpData[0].uniqueId});
  for (let item of tmpData[0].data) {
    yaxis.push({data: [item], name: item, uniqueId: tmpData[0].uniqueId});
  }
  // 给 xaxis[0].data 赋值
  if (chartData.xaxis.length > 0) { // x 轴有数据
    for (let i = 1; i < chartData.xaxis.length; i++) {
      xaxis[0].data.push(chartData.xaxis[i].name);
    }
    for (let item of chartData.yaxis) {
      xaxis[0].data.push(item.name);
    }
  } else if (chartData.yaxis.length > 0) { // y 轴有数据
    for (let i = 1; i < chartData.yaxis.length; i++) {
      xaxis[0].data.push(chartData.yaxis[i].name);
    }
  }
  // 给 yaxis[i].data 赋值
  for (let i = 0; i < yaxis.length; i++) {
    if (chartData.xaxis.length > 0) { // x 轴有数据
      for (let j = 1; j < chartData.xaxis.length; j++) {
        yaxis[i].data.push(chartData.xaxis[j].data[i]);
      }
      for (let item of chartData.yaxis) {
        yaxis[i].data.push(item.data[i]);
      }
    } else if (chartData.yaxis.length > 0) { // y 轴有数据
      for (let j = 1; j < chartData.yaxis.length; j++) {
        yaxis[i].data.push(chartData.yaxis[j].data[i]);
      }
    }
  }
  let isAllDataNull = true;
  for (let item of xaxis) {
    if (item.data.length > 0) {
      isAllDataNull = false;
      break;
    }
  }
  for (let item of yaxis) {
    if (item.data.length > 0) {
      isAllDataNull = false;
      break;
    }
  }
  if (isAllDataNull) {
    for (let item of xaxis) {
      item.data.push('swapNull');
    }
    for (let item of yaxis) {
      item.data.push('swapNull');
    }
  }

  // 以下是有 对比 和 数值 的情况
  if (!isDimension && isCompare && isIndex) {
    let nameArr = xaxis[0].name.split(':%');
    let objArr = [];
    for (let item of nameArr) {
      objArr.push({data: [], name: item, uniqueId: xaxis[0].uniqueId});
    }
    for (let item of xaxis[0].data) {
      let tArr = item.split(':%');
      for (let i = 0; i < tArr.length; i++) {
        objArr[i].data.push(tArr[i]);
      }
    }
    xaxis = objArr;
  }
  // 以下是有 ‘维度 对比 数值’ 的情况
  if (isDimension && isCompare && isIndex) {
    let nameArr = xaxis[0].name.split(':%');
    let dataArr = [];
    let lengthArr = [];
    let maxLength = 0;
    let objArr = [];
    for (let item of xaxis[0].data) {
      let tmpArr = item.split(':%');
      dataArr.push(tmpArr);
      lengthArr.push(tmpArr.length);
    }
    maxLength = Math.max.apply(null, lengthArr);
    for (let item of dataArr) {
      if (item.length < maxLength) {
        let len = maxLength - item.length;
        for (let i = 0; i < len; i++) {
          // item.push(item[0]);
          item.push('dontPaintY_Swap');
        }
      }
    }
    if (nameArr.length < maxLength) {
      let len = maxLength - nameArr.length;
      for (let j = 0; j < len; j++) {
        nameArr.push(nameArr[0]);
      }
    }
    for (let i = 0; i < maxLength; i++) {
      let tmpArr = [];
      for (let item of dataArr) {
        tmpArr.push(item[i]);
      }
      objArr.push({data: tmpArr, name: nameArr[i], uniqueId: xaxis[0].uniqueId});
    }
    xaxis = objArr;
  }

  // 数值小计
  if (setting[1].keyOfSubtotalColumn.length > 0) {
    for (let item of setting[1].keyOfSubtotalColumn) {
      for (let i = 0; i < xaxis.length; i++) {
        if (i === 0) {
          xaxis[i].data.push(item + '总计');
        } else {
          xaxis[i].data.push('dontPaintY_Swap');
        }
      }
      for (let iitem of yaxis) {
        let sum = 0;
        // for (let tmp of iitem.data) {
        //   if (isAvailableData(tmp)) {
        //     sum += Number(tmp);
        //   }
        // }
        for (let j = 0; j < iitem.data.length; j++) {
          if (xaxis[0].data[j] === item && isAvailableData(iitem.data[j])) {
            sum += Number(iitem.data[j]);
          }
        }
        iitem.data.push(sum.toString());
      }
    }
  }

  return {xaxis, yaxis};
}

function isAvailableData (v) {
  let boo = false;
  if (typeof v === 'number') boo = true;
  if (typeof v === 'string') {
    if (!isNaN(parseFloat(v))) boo = true;
  }
  return boo;
};
