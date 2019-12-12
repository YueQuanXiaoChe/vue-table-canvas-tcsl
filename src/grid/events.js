export default {
  data () {
    return {
      isFirefox: false,
      throttleHandleResize: null,
      refresh: false,
      dropdownObj: {
        v_show: false,
        top: 0,
        left: 0,
        activeSelect: {}
      }
    };
  },
  created () {
    this.isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  },
  watch: {
    retract () {
      this.handleResize();
    }
  },
  methods: {
    throttle (delay, noTrailing, callback, debounceMode) {
      var timeoutID;
      var lastExec = 0;
      if (typeof noTrailing !== 'boolean') {
        debounceMode = callback;
        callback = noTrailing;
        noTrailing = undefined;
      }
      function wrapper () {
        var self = this;
        var elapsed = Number(new Date()) - lastExec;
        var args = arguments;
        function exec () {
          lastExec = Number(new Date());
          callback.apply(self, args);
        }
        function clear () {
          timeoutID = undefined;
        }
    
        if (debounceMode && !timeoutID) {
          exec();
        }
    
        if (timeoutID) {
          clearTimeout(timeoutID);
        }
    
        if (debounceMode === undefined && elapsed > delay) {
          exec();
        } else if (noTrailing !== true) {
          timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
        }
      }
    
      return wrapper;
    },
    preventEvent (event) {
      if (!this.refresh) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    removeEvent () {
      if (this.platform === 'APP') {
        window.removeEventListener('touchstart', this.handleMousedown, false);
        window.removeEventListener('touchmove', this.throttle(16, this.handleMousemoveAPP), false);
        window.removeEventListener('touchend', this.handleMouseup, false);
      } else if (this.platform === 'PC') {
        window.removeEventListener('mouseup', this.handleMouseup, false);
      }
      window.removeEventListener('resize', this.handleResize, false);
    },
    initEvent () {
      window.addEventListener('resize', this.handleResize, false);

      if (this.platform === 'APP') {
        this.$refs.canvas.addEventListener('click', this.handleClickAPP, false);
        this.$refs.reference.addEventListener('touchstart', this.handleMousedown, false);
        this.$refs.reference.addEventListener('touchmove', this.throttle(16, this.handleMousemoveAPP), false);
        window.addEventListener('touchend', this.handleMouseup, false);
        this.$refs.canvas.addEventListener('dblclick', this.doubleHandleClick, false);
        this.$refs.canvas.addEventListener('touchmove', this.throttle(16, this.handleTouchmove), false);
        this.$refs.canvas.addEventListener('touchstart', this.handleMousedown, false);
      } else if (this.platform === 'PC') {
        this.$refs.canvas.addEventListener('click', this.handleClickPC, false);
        this.$refs.reference.addEventListener('mousedown', this.handleMousedown, false);
        this.$refs.reference.addEventListener('mousemove', this.throttle(16, this.handleMousemovePC), true);
        window.addEventListener('mouseup', this.handleMouseup, false);
        this.$refs.canvas.addEventListener('mousemove', this.throttle(16, this.handleMouseOver), false);
        // this.$refs.canvas.addEventListener(this.isFirefox ? 'DOMMouseScroll' : 'mousewheel', this.throttle(16, this.handleWheel));
        this.$refs.canvas.addEventListener('contextmenu', this.handleContextmenu, false);
      }
    },
    handleMousedown (e) {
      if (this.platform === 'APP') {
        if (this.horizontalBar.size) {
          this.horizontalBar.cursorX = e.touches[0].screenX;
        }
        if (this.verticalBar.size) {
          this.verticalBar.cursorY = e.touches[0].screenY;
        }
      }
    },
    handleMouseOver (evt) {
      evt.stopPropagation();
      const x = evt.offsetX * this.dpr;
      const y = evt.offsetY * this.dpr;
      let headColumn = null;
      let bodyColumn = null;
      if (x > this.fixedColumnsWidth) {
        headColumn = this.getHeadWord(x, y, this.displayColumns);
        bodyColumn = this.getDrillObj(x, y, this.displayCells);
      } else {
        headColumn = this.getHeadWord(x, y, this.displayColumns);
        bodyColumn = this.getDrillObj(x, y, this.displayallFixedCells);
      }
      if (headColumn) {
        this.allColumns = this.allColumns.map((v) => {
          if (v.key === headColumn.key) {
            v.isShowIcon = true;
          } else {
            v.isShowIcon = false;
          }
          return v;
        });
        this.fixedColumns = this.fixedColumns.map((v) => {
          if (v.key === headColumn.key) {
            v.isShowIcon = true;
          } else {
            v.isShowIcon = false;
          }
          return v;
        });
        window.requestAnimationFrame(this.rePainted);
      } else {
        this.allColumns = this.allColumns.map((v) => {
          v.isShowIcon = false;
          return v;
        });
        this.fixedColumns = this.fixedColumns.map((v) => {
          v.isShowIcon = false;
          return v;
        });
        window.requestAnimationFrame(this.rePainted);
      }
      if (this.$refs.canvas.style.cursor === 'pointer') {
        this.$refs.canvas.style.cursor = 'Default';
      }
      if (bodyColumn && bodyColumn.canJump) {
        if (bodyColumn.content !== '小计' && bodyColumn.content !== '列总计' && bodyColumn.content !== 'dontPaintX' && bodyColumn.content !== 'dontPaintY') {
          this.$refs.canvas.style.cursor = 'pointer';
        }
      }
    },
    handleResize () {
      if (this.throttleHandleResize) {
        clearInterval(this.throttleHandleResize);
      }
      this.throttleHandleResize = setTimeout(() => {
        this.offset.y = 0;
        this.offset.x = 0;
        this.horizontalBar.x = 0;
        this.columns = this.columns.map((v) => {
          v.fixed = false;
          v.fixedIcon = false;
          return v;
        });
        this.setOption(this.option);
        this.throttleHandleResize = null;
      }, 500);
    },
    handleWheel (e) {
      if (e.target.tagName === 'CANVAS') {
        if (!this.isEditing) {
          const {deltaX, deltaY} = e;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            const lastScrollX = this.offset.x;
            let maxWidth = 0;
            if (this.fillWidth > 0) {
              maxWidth = this.maxPoint.x;
            } else {
              maxWidth = this.maxPoint.x + this.fixedWidth;
            }
            if (this.offset.x - deltaX > 0) {
              this.offset.x = 0;
            } else if ((this.bodyWidth - maxWidth) + this.offset.x < deltaX) {
              this.offset.x = maxWidth - this.bodyWidth;
              if (maxWidth - this.bodyWidth < 0) {
                this.offset.x = maxWidth - this.bodyWidth;
              } else {
                e.preventDefault();
                e.returnValue = false;
              }
            } else {
              e.preventDefault();
              e.returnValue = false;
              this.offset.x -= deltaX;
            }
            if (lastScrollX !== this.offset.x) {
              window.requestAnimationFrame(this.rePainted);
              this.$emit('scroll');
            }
          } else {
            const lastScrollY = this.offset.y;
            if (lastScrollY - deltaY > 0) {
              this.offset.y = 0;
            } else if ((this.bodyHeight - this.maxPoint.y) + lastScrollY < deltaY) {
              if (this.maxPoint.y - this.bodyHeight < 0) {
                this.offset.y = this.maxPoint.y - this.bodyHeight;
              } else {
                e.preventDefault();
                e.returnValue = true;
              }
            } else {
              e.returnValue = false;
              this.offset.y -= deltaY;
            }
            if (lastScrollY !== this.offset.y) {
              if (this.verticalBar.y + this.verticalBar.size > this.height * 0.8) {
                this.setAllCells(this.data.length);
              }
              window.requestAnimationFrame(this.rePainted);
              this.$emit('scroll');
            }
          }
        }
      }
    },
    handleMousemovePC (evt) {
      evt.stopPropagation();
      if (this.verticalBar.move) {
        const height = this.maxPoint.y - this.verticalBar.size;
        const moveHeight = this.verticalBar.y + (evt.screenY - this.verticalBar.cursorY);
        if (moveHeight > 0 && moveHeight < height) {
          this.verticalBar.y += (evt.screenY - this.verticalBar.cursorY) * this.dpr;
        } else if (moveHeight <= 0) {
          this.verticalBar.y = 0;
        } else {
          this.verticalBar.y = height;
        }
        this.verticalBar.cursorY = evt.screenY;
        this.offset.y = -this.verticalBar.y / this.verticalBar.k;
        if (this.verticalBar.y + this.verticalBar.size > this.height * 0.9) {
          this.setAllCells(this.data.length);
        }
        window.requestAnimationFrame(this.rePainted);
      }
      if (this.horizontalBar.move) {
        let width = 0;
        if (this.fillWidth > 0) {
          width = this.maxPoint.x - this.horizontalBar.size;
        } else {
          width = (this.maxPoint.x + this.fixedWidth) - this.horizontalBar.size;
        }
        const moveWidth = this.horizontalBar.x + (evt.screenX - this.horizontalBar.cursorX);
        if (moveWidth > 0 && moveWidth < width) {
          this.horizontalBar.x += (evt.screenX - this.horizontalBar.cursorX) * this.dpr;
        } else if (moveWidth <= 0) {
          this.horizontalBar.x = 0;
        } else {
          this.horizontalBar.x = width;
        }
        this.horizontalBar.cursorX = evt.screenX;
        this.offset.x = -this.horizontalBar.x / this.horizontalBar.k;
        window.requestAnimationFrame(this.rePainted);
      }
    },
    handleMousemoveAPP (evt) {
      evt.stopPropagation();
      if (this.verticalBar.move) {
        const height = this.maxPoint.y - this.verticalBar.size;
        const moveHeight = this.verticalBar.y + (evt.touches[0].screenY - this.verticalBar.cursorY);
        if (moveHeight > 0 && moveHeight < height) {
          this.verticalBar.y += (evt.touches[0].screenY - this.verticalBar.cursorY) * this.dpr;
          this.refresh = false;
        } else if (moveHeight <= 0) {
          this.verticalBar.y = 0;
          this.refresh = false;
        } else {
          this.verticalBar.y = height;
          this.refresh = false;
        }
        this.verticalBar.cursorY = evt.touches[0].screenY;
        this.offset.y = -this.verticalBar.y / this.verticalBar.k;
        if (this.verticalBar.y + this.verticalBar.size > this.height * 0.9) {
          this.setAllCells(this.data.length);
        }
        window.requestAnimationFrame(this.rePainted);
      }
      if (this.horizontalBar.move) {
        let width = 0;
        if (this.fillWidth > 0) {
          width = this.maxPoint.x - this.horizontalBar.size;
        } else {
          width = (this.maxPoint.x + this.fixedWidth) - this.horizontalBar.size;
        }
        const moveWidth = this.horizontalBar.x + (evt.touches[0].screenX - this.horizontalBar.cursorX);
        if (moveWidth > 0 && moveWidth < width) {
          this.horizontalBar.x += (evt.touches[0].screenX - this.horizontalBar.cursorX) * this.dpr;
        } else if (moveWidth <= 0) {
          this.horizontalBar.x = 0;
        } else {
          this.horizontalBar.x = width;
        }
        this.horizontalBar.cursorX = evt.touches[0].screenX;
        this.offset.x = -this.horizontalBar.x / this.horizontalBar.k;
        window.requestAnimationFrame(this.rePainted);
      }
    },
    handleTouchmove (evt) {
      const x = evt.touches[0].screenX;
      const y = evt.touches[0].screenY;
      if (!this.verticalBar.move && this.verticalBar.size > 0) {
        const height = this.maxPoint.y - this.verticalBar.size;
        const moveHeight = this.verticalBar.y - ((y - this.verticalBar.cursorY) * this.dpr * this.verticalBar.k);
        if (moveHeight > 0 && moveHeight < height) {
          this.verticalBar.y = moveHeight;
          this.refresh = false;
        } else if (moveHeight <= 0) {
          this.verticalBar.y = 0;
          this.refresh = true;
        } else {
          this.verticalBar.y = height;
          this.refresh = false;
        }
        this.verticalBar.cursorY = y;
        this.offset.y = -this.verticalBar.y / this.verticalBar.k;
        if (this.verticalBar.y + this.verticalBar.size > this.height * 0.9) {
          this.setAllCells(this.data.length);
        }
        window.requestAnimationFrame(this.rePainted);
      }
      if (!this.horizontalBar.move && this.horizontalBar.size > 0) {
        let width = 0;
        if (this.fillWidth > 0) {
          width = this.maxPoint.x - this.horizontalBar.size;
        } else {
          width = (this.maxPoint.x + this.fixedWidth) - this.horizontalBar.size;
        }
        const moveWidth = this.horizontalBar.x - (x - this.horizontalBar.cursorX) * this.dpr * this.horizontalBar.k;
        if (moveWidth > 0 && moveWidth < width) {
          this.horizontalBar.x = moveWidth;
        } else if (moveWidth <= 0) {
          this.horizontalBar.x = 0;
        } else {
          this.horizontalBar.x = width;
        }
        this.horizontalBar.cursorX = x;
        this.offset.x = -this.horizontalBar.x / this.horizontalBar.k;
        window.requestAnimationFrame(this.rePainted);
      }
    },
    handleMouseup () {
      this.horizontalBar.move = false;
      this.verticalBar.move = false;
    },
    handleClickAPP (evt) {
      if (this.oneOption.rowColSwap) return;
      const x = evt.offsetX * this.dpr;
      const y = evt.offsetY * this.dpr;
      let headSortIcon = null;
      headSortIcon = this.getSortHeadIcon(x, y, this.displayColumns);
      if (headSortIcon) {
        this.columns = this.columns.map((v) => {
          if (v.key === headSortIcon.key) {
            if (!v.isSort || v.isSort === 2) {
              v.isSort = 1;
              headSortIcon.isSort = 1;
            } else if (v.isSort === 1) {
              v.isSort = 2;
              headSortIcon.isSort = 2;
            }
          } else {
            v.isSort = 0;
          }
          return v;
        });
        typeof (this.oneOption.sortCallback) === 'function' && this.oneOption.sortCallback(headSortIcon);
        return;
      }
      let drillObj = null;
      drillObj = this.getDrillObj(x, y, this.displayCells);
      if (drillObj && drillObj.canJump) {
        this.$emit('drill', {demensionId: drillObj.key, value: drillObj.content});
      }
    },
    handleClickPC (evt) {
      if (this.oneOption.rowColSwap) return;
      evt.stopPropagation();
      const x = evt.offsetX * this.dpr;
      const y = evt.offsetY * this.dpr;
      let headSortIcon = null;
      if (x > this.fixedColumnsWidth) {
        headSortIcon = this.getSortHeadIcon(x, y, this.displayColumns, 20 * this.dpr, 25 * this.dpr);
      } else {
        headSortIcon = this.getSortHeadIcon(x, y, this.fixedColumns, 20 * this.dpr, 25 * this.dpr);
      }
      if (headSortIcon && headSortIcon.title && headSortIcon.title.indexOf('总计') >= 0) return;
      if (headSortIcon) {
        this.columns = this.columns.map((v) => {
          if (v.key === headSortIcon.key) {
            if (v.isSort === 1) {
              v.isSort = 2;
              headSortIcon.isSort = 2;
            } else {
              v.isSort = 1;
              headSortIcon.isSort = 1;
            }
          } else {
            v.isSort = 0;
          }
          return v;
        });
        typeof (this.oneOption.sortCallback) === 'function' && this.oneOption.sortCallback(headSortIcon);
      }
      let headFixedIcon = null;
      if (x > this.fixedColumnsWidth) {
        headFixedIcon = this.getFixedHeadIcon(x, y, this.displayColumns, 25 * this.dpr, 25 * this.dpr);
      } else {
        headFixedIcon = this.getFixedHeadIcon(x, y, this.fixedColumns, 25 * this.dpr, 25 * this.dpr);
      }
      if (headFixedIcon && headFixedIcon.title && headFixedIcon.title.indexOf('总计') >= 0) return;
      if (headFixedIcon && this.horizontalBar.size > 0) {
        const index = this.columns.findIndex(v => v.key === headFixedIcon.key);
        if (this.columns[index].fixedIcon) {
          this.columns = this.columns.map((v) => {
            v.fixed = false;
            v.fixedIcon = false;
            return v;
          });
        } else {
          this.columns = this.columns.map((v, i) => {
            v.fixedIcon = false;
            v.fixed = false;
            if (!(i > index)) {
              v.fixed = true;
            }
            return v;
          });
          this.columns[index].fixedIcon = true;
        }
        this.setOption(this.option);
      }
      let drillObj = null;
      if (x > this.fixedColumnsWidth) {
        drillObj = this.getDrillObj(x, y, this.displayCells);
      } else {
        drillObj = this.getDrillObj(x, y, this.displayallFixedCells);
      }
      if (drillObj && drillObj.canJump) {
        this.$emit('drill', {demensionId: drillObj.key, value: drillObj.content});
      }
    },
    doubleHandleClick (evt) {
      if (this.oneOption.rowColSwap) return;
      const x = evt.offsetX * this.dpr;
      const y = evt.offsetY * this.dpr;
      let drillObj = null;
      drillObj = this.getDrillObj(x, y, this.displayCells);
      if (drillObj && drillObj.canJump) {
        this.$emit('drill', {demensionId: drillObj.key, value: drillObj.content});
      }
    },
    handleContextmenu (evt) {
      evt.preventDefault();
      const x = evt.offsetX * this.dpr;
      const y = evt.offsetY * this.dpr;
      let selectedJobNode = this.getDrillObj(x, y, this.displayCells);
      if (selectedJobNode) {
        this.dropdownObj.v_show = true;
        this.dropdownObj.top = y;
        this.dropdownObj.left = x;
        this.dropdownObj.activeSelect = Object.assign({}, selectedJobNode);
      } else {
        closeMenu(this);
      }
      return false;
    }
  }
};
function closeMenu (context) {
  context.dropdownObj.v_show = false;
  context.dropdownObj.top = 0;
  context.dropdownObj.left = 0;
}
