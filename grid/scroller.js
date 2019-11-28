export default {
  data () {
    return {
      horizontalBar: {
        x: 0,
        size: 0,
        move: false,
        cursorX: 0,
        k: 1
      },
      verticalBar: {
        y: 0,
        size: 0,
        move: false,
        cursorY: 0,
        k: 1
      }
    };
  },
  created () {
    this.$on('scroll', () => {
      this.horizontalBar.x = -parseInt(this.offset.x * this.horizontalBar.k, 10);
      this.verticalBar.y = -parseInt(this.offset.y * this.verticalBar.k, 10);
    });
  },
  methods: {
    scroll (e) {
      e.stopPropagation();
    },
    dragMove (e, type) {
      if (type) {
        if (this.verticalBar.size > 0) {
          this.verticalBar.move = true;
          if (this.platform === 'APP') {
            this.verticalBar.cursorY = e.touches[0].screenY;
          } else if (this.platform === 'PC') {
            this.verticalBar.cursorY = e.screenY;
          }
        }
      } else {
        if (this.horizontalBar.size > 0) {
          this.horizontalBar.move = true;
          if (this.platform === 'APP') {
            this.horizontalBar.cursorX = e.touches[0].screenX;
          } else if (this.platform === 'PC') {
            this.horizontalBar.cursorX = e.screenX;
          }
        }
      }
    },
    resetScrollBar ({x, y}, bodyWidth, bodyHeight, fixedWidth) {
      let width = 0;
      if (this.platform === 'APP') {
        width = x;
      } else if (this.platform === 'PC') {
        if (this.fillWidth > 0) width = x;
        else width = x + fixedWidth;
      }
      if (width === 0) return;

      let horizontalRatio = width / bodyWidth;
      if (horizontalRatio >= 1) {
        this.horizontalBar.size = 0;
      } else {
        this.horizontalBar.size = width - ((bodyWidth - width) * horizontalRatio);
        if (this.horizontalBar.size < 30) {
          this.horizontalBar.size = 30;
          horizontalRatio = (width - 30) / (bodyWidth - width);
        }
      }
      this.horizontalBar.k = horizontalRatio;

      let verticalRatio = y / bodyHeight;
      if (verticalRatio > 1) {
        this.verticalBar.size = 0;
      } else {
        this.verticalBar.size = y - ((bodyHeight - y) * verticalRatio);
        if (this.verticalBar.size < 30) {
          this.verticalBar.size = 30;
          verticalRatio = (y - 30) / (bodyHeight - y);
        }
      }
      this.verticalBar.k = verticalRatio;

      if (width - this.horizontalBar.size < -this.offset.x * this.horizontalBar.k) {
        this.offset.x = width - this.bodyWidth;
      }
      if (this.verticalBar.k > 1) {
        this.offset.y = 0;
      } else if (this.maxPoint.y - this.verticalBar.size < -this.offset.y * this.verticalBar.k) {
        this.offset.y = this.maxPoint.y - this.bodyHeight;
      }
      this.horizontalBar.x = -this.offset.x * this.horizontalBar.k;
      this.verticalBar.y = -this.offset.y * this.verticalBar.k;
    }
  }
};
