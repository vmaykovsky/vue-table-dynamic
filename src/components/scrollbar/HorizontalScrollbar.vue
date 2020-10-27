<template>
  <div>
    <div
      v-if="width < 100"
      class="vue-scrollbar-horizontal"
      :style="{ 
        opacity: opacity,
        height: scrollbarSize + 'px',
        bottom: scrollbarOffset + 'px'
      }"
      ref="container"
      @click="onClick"
    >
      <div
        :class="['scrollbar-inner', dragging ? '' : 'scrollbar-transition']"      
        :style="{
          width: this.width+'%',
          left: this.scrolling + '%',
          backgroundColor: color,
          height: scrollbarSize + 'px',
          borderRadius: scrollbarBorderRadius + 'px'
        }"
        @mousedown="startDrag"
        ref="scrollbar"
      >
      </div>
    </div>
  </div>
</template>

<script>
const throttle = require('lodash.throttle')
const DISPLAY_LIST = ['hover', 'show', 'hidden']

export default {
  name: 'HorizontalScrollbar',
  data() {
    return {
      width: 0,
      opacity: 0,
      dragging: false,
      start: 0
    }
  },
  props: {
    scrolling: Number, // The percentage of view scrolling horizontally
    wrapperWidth: Number, // Packaging layer (viewable area) width
    viewerWidth: Number, // View width
    color: { type: String, default: '#DFDFDF' },
    xBarDisplay: { type: String, default: 'hover' },
    size: { type: Number, default: 6 },
    borderRadius: { type: Number, default: 4 },
    offset: { type: Number, default: 0 }
  },
  watch: {
    wrapperWidth (val, old) {
      this.calculateSize(this)
    },
    viewerWidth (val, old) {
      this.calculateSize(this)
    }
  },
  mounted () {
    this.calculateSize(this)

    // mousedown + mousemove + mouseup Realize the scroll bar drag effect
    // mousemove and mouseup are bound to the document, when the mouse is moved outside the scroll bar, it can still be dragged
    document.addEventListener("mousemove", this.onDrag)
    document.addEventListener("mouseup", this.stopDrag)

    this.opacity = 0
    if (this.display === 'show') this.opacity = 1

    this.handleDrag = throttle((e) => {
      if (this.dragging) {
        this.$emit('dragging')
        e.preventDefault()
        e.stopPropagation()

        let xMovement = e.clientX - this.start
        let xMovementPercentage = xMovement / this.wrapperWidth * 100;
        this.start = e.clientX

        let next = this.scrolling + xMovementPercentage
        this.$emit('change-position', next, 'horizontal')
      }
    }, 100)
  },
  beforeDestroy () {
    document.removeEventListener("mousemove", this.onDrag)
    document.removeEventListener("mouseup", this.stopDrag)
    this.handleDrag = null
  },
  computed: {
    scrollbarSize () {
      if (typeof this.size === 'number' && this.size >= 0) {
        return this.size
      }
      return 6
    },
    scrollbarBorderRadius () {
      if (typeof this.borderRadius === 'number' && this.borderRadius >= 0) {
        return this.borderRadius
      }
      return 4
    },
    scrollbarOffset () {
      if (typeof this.offset === 'number' && this.offset >= 0) {
        return this.offset
      }
      return 0
    },
    display () {
      if (DISPLAY_LIST.includes(this.xBarDisplay)) {
        return this.xBarDisplay
      }
      return 'hover'
    }
  },
  methods: {
    // Mouse down => start dragging
    startDrag (e) {
      e.preventDefault()
      e.stopPropagation()

      if (this.display === 'hidden') return this.dragging = false

      this.dragging = true
      this.start = e.clientX
    },
    // Mouse movement => Drag in progress
    // Calculate the new scroll position next (percentage) according to the distance of the mouse in the horizontal direction of s. 
    // The parent component adjusts the marginLeft of the view according to next, and updates the scrolling value, which is fed back to the displacement of the scroll bar
    onDrag(e) {
      if (this.handleDrag) {
        this.handleDrag(e)
      }
    },
    // Release the mouse => stop dragging
    stopDrag(e){
      if(this.dragging){
        this.$emit('drag-stop')
        this.dragging = false
      }
    },
    // Click the scroll slot to quickly scroll to the specified position
    onClick (e) {
      if (e.target === this.$refs.container) {
        let position = this.$refs.scrollbar.getBoundingClientRect()

        let xMovement = e.clientX - position.left
        let centerize = (this.width / 2)
        let xMovementPercentage = xMovement / this.wrapperWidth * 100 - centerize

        this.start = e.clientX

        let next = this.scrolling + xMovementPercentage
        this.$emit('change-position', next, 'horizontal')
      }
    },
    // Calculate the scroll bar width (percentage)
    calculateSize(source){
      this.width = source.wrapperWidth / source.viewerWidth * 100
    },
    showBar () {
      if (this.display !== 'hover') return
      this.opacity = 1
    },
    hiddenBar () {
      if (this.display !== 'hover') return
      this.opacity = 0
    }
  }
}
</script>

<style scoped>
.vue-scrollbar-horizontal{
  position: absolute;
  width: 100%;
  left: 0;
  background: transparent;
}
.vue-scrollbar-horizontal .scrollbar-inner{
  position: relative;
  cursor: default;
  opacity: 0.8;
}
</style>