<template>
  <div class="context-menu-wrap" @click.stop.prevent="">
    <transition
      name="zoom-in-top"
      @enter="handleEnter"
      @after-enter="handleAfterEnter"
      @after-leave="handleAfterLeave"
    >
      <div
        v-show="isShow.value"
        class="menu-content"
        :style="{ top: y, left: x }"
        ref="content"
      >
        <div class="menu-body">
          <div
            v-for="(item, index) in menus"
            :key="index"
            @click.stop="onSelect(item)"
            class="menu-item flex-c"
            :class="{ delimiter: index !== menus.length - 1, disabled: item.disabled, hidden: item.hidden }"
          >
            <span class="menu-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </transition>
    <slot name="reference"></slot>
  </div>
</template>

<script>
import Display from "../utils/display.js";

export default {
  name: "ContextMenu",
  data() {
    return {
      isShow: { value: false },
      opacity: 0,
      x: "0px",
      y: "0px",
      display: null,
      emitEle: null,
      activeEle: null,
      menus: [],
      checkedCache: [],
    };
  },
  props: {
    disabled: { type: Boolean, default: false },
    content: { type: Array, default: () => [] },
  },
  watch: {
    disabled(value) {
      value ? "" : this.init();
    },
    content: {
      handler(value) {
        if (!Array.isArray(value)) return;

        this.checkedCache = [];
        this.menus.splice(0, this.menus.length);
        for (let i = 0; i < value.length; i++) {
          let item = value[i];
          if (item && typeof item.text === "string" && typeof item.value !== "undefined") {
            this.menus.push(item);
          }
        }
      },
      deep: true,
      immediate: true,
    },
    menus: {
      handler(f) {
        this.menuable = f.some((i) => {
          return i.checked;
        });
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    this.init();
  },
  beforeDestroy() {
    this.emitEle = null;
    this.activeEle = null;
    this.menus = [];
    this.checkedCache = [];

    if (this.display && this.display.unBind) {
      this.display.unBind();
      setTimeout(() => {
        this.display.clear();
        this.display = null;
      }, 10);
    }
  },
  methods: {
    init() {
      setTimeout(() => {
        if (this.display || this.disabled || !this.menus.find(i => !i.hidden)) return;

        let emitEle = (this.emitEle = this.$slots.reference[0].elm);
        let activeEle = (this.activeEle = this.$refs.content);
        this.display = new Display(
          "click-click",
          this.isShow,
          activeEle,
          emitEle,
          document
        );
        this.display.doBind();
      }, 100);
    },
    getContextCoordinate(activeX, activeY) {
      let coord = [activeX + 6, activeY + 6];
      if (!(this.activeEle && this.activeEle.offsetHeight && this.activeEle.offsetWidth)) {
        return coord;
      }

      let viewportHeight = window.innerHeight;
      let viewportWidth = window.innerWidth;
      let targetHeight = this.activeEle.offsetHeight;
      let targetWidth = this.activeEle.offsetWidth;

      if (targetWidth + activeX + 8 > viewportWidth) {
        coord[0] = viewportWidth - targetWidth - 6;
        coord[0] < 0 ? (coord[0] = 0) : "";
      }

      if (targetHeight + activeY + 8 > viewportHeight) {
        coord[1] = viewportHeight - targetHeight - 6;
        coord[1] < 0 ? (coord[1] = 0) : "";
      }

      return coord;
    },
    handleEnter() {
      let coord = this.getContextCoordinate(
        this.display.activeX,
        this.display.activeY
      );
      this.x = coord[0] + "px";
      this.y = coord[1] + "px";
    },
    handleAfterEnter() {
      this.$emit("after-enter");
    },
    handleAfterLeave() {
      this.$emit("after-leave");
    },
    onSelect(item) {
      if (item.disabled || item.hidden) {
        return;
      }
      this.$emit('select', item.value)
      this.isShow.value = false;
    },
  },
};
</script>

<style lang="scss" scoped>
  $textColor: rgba(0, 0, 0, 0.85);
  $normalColor: rgba(0, 0, 0, 0.65);
  $disabledColor: rgba(0, 0, 0, 0.25);
  $borderColor: rgba(217, 217, 217, 1);
  $activeColor: rgba(0, 0, 0, 0.05);
  $delimiterColor: rgba(0, 0, 0, 0.07);
  $fontFamily: Arial, Helvetica, sans-serif;

  .menu-content {
    position: fixed;
    z-index: 9999;
    background-color: #ffffff;
    border: 1px solid $borderColor;
    border-radius: 2px;
    box-shadow: 0px 2px 12px 0 rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    min-width: 120px;
    max-width: 300px;
    cursor: auto;
  }

  .menu-body {
    .menu-item {
      cursor: pointer;
      padding: 10px;
      &:hover {
        background-color: $activeColor;
      }

      &.delimiter {
        border-bottom: 1px solid $delimiterColor;
      }

      &.disabled {
        opacity: .5;
        cursor: not-allowed;
      }

      &.disabled:hover {
        background-color: unset;
      }

      &.hidden {
        display: none;
      }

      .menu-text {
        margin-left: 6px;
        color: $textColor;
        font-size: 12px;
        line-height: 12px;
        font-weight: 500;
        overflow: hidden;
        word-wrap: normal;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  .zoom-in-top-enter-active,
  .zoom-in-top-leave-active {
    opacity: 1;
    transform: scaleY(1);
    -webkit-transform: scaleY(1);
    -moz-transform: scaleY(1);
    -ms-transform: scaleY(1);
    -o-transform: scaleY(1);
    transition: transform 150ms ease-in-out, opacity 150ms ease-in-out;
    -webkit-transition: transform 150ms ease-in-out, opacity 150ms ease-in-out;
    -moz-transition: transform 150ms ease-in-out, opacity 150ms ease-in-out;
    -o-transition: transform 150ms ease-in-out, opacity 150ms ease-in-out;
    transform-origin: center top;
    -webkit-transform-origin: center top;
    -moz-transform-origin: center top;
    -o-transform-origin: center top;
    -ms-transform-origin: center top;
  }
  .zoom-in-top-enter,
  .zoom-in-top-leave-active {
    opacity: 0;
    transform: scaleY(0);
    -webkit-transform: scaleY(0);
    -moz-transform: scaleY(0);
    -ms-transform: scaleY(0);
    -o-transform: scaleY(0);
  }
</style>
