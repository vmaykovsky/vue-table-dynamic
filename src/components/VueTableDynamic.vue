<template>
  <div class="v-table-dynamic">
    <div 
      v-if="tableData && tableData.rows && tableData.rows.length > 0"
      :style="{ minWidth: minWidth + 'px', maxWidth: maxWidth + 'px' }"
    >
      <!-- Table Tools -->
      <div class="v-table-tools flex-c-s" v-if="enableTools">
        <vue-input v-if="enableSearch" class="tools-search" v-model="searchValue" placeholder="Search">
          <i class="iconfont iconsearch" slot="prefix"></i>
        </vue-input>
        <slot name="top-toolbar"></slot>
      </div>
      <div class="v-table-loader">
        <div class="v-linear-activity" v-if="isLoading">
          <div class="v-line"></div>
        </div>
      </div>
      <div 
        class="v-table"
        :class="{ 
          'v-show-border':tableBorder
        }"
        :style="{ minWidth: minWidth + 'px', maxWidth: maxWidth + 'px' }"
        @mouseenter="onMouseenterTable" 
        @mouseleave="onMouseleaveTable"
      >
        <!-- Table Header -->
        <div class="v-table-header-wrap">
          <div 
            v-if="headerInfirstRow" 
            class="v-table-row flex-c is-header"
            :class="{ 'is-striped': rowStripe, 'v-show-border': tableBorder, 'is-hovering': tableData.rows[0].hovering }"
            :style="{ 
              height: headerHeight + 'px', 
              minWidth: getRowMinWidth(),
              marginLeft: this.headerLeft * -1 +'px',
              backgroundColor: headerBgColor || (tableData.rows[0].hovering && rowHoverColor) || ''
            }"
            @mouseenter="onMouseenter(tableData.rows[0])" 
            @mouseleave="onMouseleave(tableData.rows[0])"
            @click="onClickRow(tableData.rows[0], 0)"
          >
            <div 
              v-if="showCheck" 
              class="table-check flex-c-c" 
              :class="{ 'v-show-border':tableBorder }"
              :style="{ backgroundColor: isHighlighted(0, NaN) ? highlightedColor : 'transparent' }"
            > 
              <div
                class="table-check-all flex-c-c"
                :class="{ 'is-checked': tableData.rows[0].checked }"
                @click.stop="onCheckAll(tableData.rows[0])"
              >
                <i class="iconfont iconcheck" v-show="tableData.rows[0].checked === true"></i> 
                <i class="iconfont iconminus" v-show="tableData.rows[0].checked === 'line'"></i>
              </div>
            </div>
            <div 
              v-for="(tableCell, j) in tableData.rows[0].cells" :key="j" 
              class="table-cell flex-c" 
              :class="{ 'v-show-border': tableBorder, 'is-header': (j === 0 && headerInfirstColumn) }"
              :style="getCellStyle(0, j)"
              @click="onClickCell(tableCell, 0, j)"
              @dblclick.exact.stop="onDblclickCell(tableCell, 0, j)"
              @contextmenu.stop.prevent="onContextmenuCell($event, tableCell, 0, j)"
            >
              <span 
                v-if="!(fixedColumn.includes(j))"
                class="table-cell-inner flex-c-s"
              >
                <span 
                  class="table-cell-content" 
                  :style="{ flexGrow: 1, whiteSpace: whiteSpace, wordWrap: wordWrap, textOverflow: textOverflow, ...getStyleCustomized(0, j) }"
                >
                  {{ tableCell.data }}
                </span>
                <span v-if="sortConfig[j]" class="table-sort flex-dir-column" :style="{ height: '30px' }">
                  <i 
                    class="sort-btns sort-ascending"
                    :style="{
                      borderBottomColor: (activatedSort[j] && activatedSort[j] === 'ascending') ? activedColor : '#C0C4CC'
                    }"
                    @click.stop="onSort(j, 'ascending')"
                  >
                  </i>
                  <i 
                    class="sort-btns sort-descending" 
                    :style="{
                      borderTopColor: (activatedSort[j] && activatedSort[j] === 'descending') ? activedColor : '#C0C4CC'
                    }"
                    @click.stop="onSort(j, 'descending')"
                  >
                  </i>
                </span>
                <span 
                  v-if="filterConfig[j]" 
                  class="table-filter flex-c-c" 
                  :style="{ height: headerHeight + 'px' }" 
                >
                  <filter-panel
                    :ref="`filter-${j}`"
                    :content="filterConfig[j].content"
                    :type="filterConfig[j].type"
                    :search="filterConfig[j].search"
                    :lang="lang"
                    @enter="() => { onFilterEnter(j) }"
                    @filter="(checked) => { onFilter(j, checked, filterConfig[j]) }"
                    @reset="clearFilter(j)"
                    @search="(filter, searchValue) => { onFilterSearch(filter, searchValue) }"
                  >
                    <i slot="reference" class="iconfont icondown"
                      :style="{ color: activatedFilter[j] ? activedColor : '#C0C4CC' }">
                    </i>
                  </filter-panel>
                </span>
              </span>
            </div>
            <div v-if="rowContextMenu && rowContextMenu.length" class="flex-c-c row-actions">
            </div>
          </div>
        </div>
        <!-- Table Body -->
        <div class="v-table-body" :style="{ height: height }">
          <vue-scrollbar
            x-bar-display="hidden"
            :y-bar-display="scrollbarDisplay"
            :size="7"
            :border-radius="0"
            :step="scrollStep"
            @scroll-x="onScrollX"
            @scroll-y="onScrollY"
            @size="onSize"
            ref="scrollbar" 
          >
            <div v-for="(tableRow, i) in tableData.activatedRows" :key="i" :style="{ minWidth: getRowMinWidth() }"> 
              <div
                v-show="tableRow.show && !tableRow.filtered && !(pagination && !tableRow.inPage) && !(i === 0 && headerInfirstRow)" 
                class="v-table-row flex-c"
                :class="{ 
                  'is-striped': (rowStripe && i % 2 === 0), 
                  'v-show-border': tableBorder,
                  'is-hovering': tableRow.hovering
                }"
                :style="{ height: rowHeight + 'px', minWidth: getRowMinWidth(), backgroundColor: tableRow.hovering ? rowHoverColor : '' }"
                @mouseenter="onMouseenter(tableRow)" 
                @mouseleave="onMouseleave(tableRow)"
                @click="onClickRow(tableRow, tableRow.index)"
              >
                <div 
                  v-if="showCheck" 
                  class="table-check flex-c-c" 
                  :class="{ 'v-show-border':tableBorder }"
                  :style="{ backgroundColor: isHighlighted(tableRow.index, NaN) ? highlightedColor : 'transparent' }"
                > 
                  <div
                    class="table-check-row flex-c-c"
                    :class="{ 'is-checked': tableRow.checked }"
                    @click.stop="onCheckRow(tableRow, tableRow.index)"
                  >
                    <i class="iconfont iconcheck" v-show="tableRow.checked"></i>
                  </div>
                </div>
                <div 
                  v-for="(tableCell, j) in tableRow.cells" :key="j" 
                  class="table-cell flex-c-s" 
                  :class="{ 'v-show-border': tableBorder, 'is-header': (j === 0 && headerInfirstColumn ) }"
                  :style="getCellStyle(tableRow.index, j)"
                  @click="onClickCell(tableCell, tableRow.index, j)"
                  @dblclick.exact.stop="onDblclickCell(tableCell, tableRow.index, j)"
                  @contextmenu.stop.prevent="onContextmenuCell($event, tableCell, tableRow.index, j)"
                >
                  <slot 
                    v-if="!(fixedColumn.includes(j))"
                    :name="'column-' + j" 
                    v-bind:props="{ cellData: tableCell.data, rowData: tableRow.cells, row: tableRow.index, column: j }"
                  >
                    <span
                      v-if="!(fixedColumn.includes(j))"
                      class="table-cell-content"
                      :class="{'fill-width': i !== 0}"
                      :style="{ whiteSpace: whiteSpace, wordWrap: wordWrap, textOverflow: textOverflow, ...getStyleCustomized(tableRow.index, j) }"
                      :contenteditable="isEditable(tableRow.index, j)"
                      :id="tableCell.key"
                      @blur="onCellBlur(tableCell, tableRow.index, j)"
                      @keydown.enter.stop.prevent="onCellKeyEnter"
                    >
                      {{ tableCell.data }}
                    </span>
                  </slot>
                </div>
                <div v-if="rowContextMenu && rowContextMenu.length && rowContextMenu.length > i - (headerInfirstRow ? 1 : 0)" class="flex-c-c row-actions">
                  <context-menu
                    v-if="rowContextMenu[i - (headerInfirstRow ? 1 : 0)] && rowContextMenu[i - (headerInfirstRow ? 1 : 0)].length"
                    :content="rowContextMenu[i - (headerInfirstRow ? 1 : 0)]"
                    @select="(value) => onRowContextMenuAction(tableRow, i - (headerInfirstRow ? 1 : 0), value)"
                  >
                    <i slot="reference" class="more-dots"></i>
                  </context-menu>
                </div>
              </div>
            </div>
          </vue-scrollbar>
          <div v-if="isLoading" class="v-table-overlay"></div>
        </div>
        <!-- Table Fixed -->
        <div class="v-table-fixed" :class="{ 'is-show-shadow': (scrollx !== 'left' )}"
          v-if="fixedWidth > 0" :style="{ width: fixedWidth + 'px' }"
        >
          <!-- Fixed Header -->
          <div 
            v-if="headerInfirstRow" 
            class="v-table-row flex-c is-header"
            :class="{ 'is-striped': rowStripe, 'v-show-border': tableBorder, 'is-hovering': tableData.rows[0].hovering }"
            :style="{ 
              height: headerHeight + 'px',
              minWidth: getRowMinWidth(),
              backgroundColor: headerBgColor || (tableData.rows[0].hovering && rowHoverColor) || ''
            }"
            @mouseenter="onMouseenter(tableData.rows[0])" 
            @mouseleave="onMouseleave(tableData.rows[0])"
            @click="onClickRow(tableData.rows[0], 0)"
          >
            <div 
              v-if="showCheck" 
              class="table-check flex-c-c" 
              :class="{ 'v-show-border':tableBorder }"
              :style="{ backgroundColor: isHighlighted(0, NaN) ? highlightedColor : 'transparent' }"
            > 
              <div
                class="table-check-all flex-c-c"
                :class="{ 'is-checked': tableData.rows[0].checked }"
                @click.stop="onCheckAll(tableData.rows[0])"
              >
                <i class="iconfont iconcheck" v-show="tableData.rows[0].checked === true"></i> 
                <i class="iconfont iconminus" v-show="tableData.rows[0].checked === 'line'"></i>
              </div>
            </div>
            <div 
              v-for="(tableCell, j) in tableData.rows[0].cells" :key="j" 
              class="table-cell flex-c" 
              :class="{ 'v-show-border': tableBorder, 'is-header': (j === 0 && headerInfirstColumn) }"
              :style="getCellStyle(0, j)"
              @click="onClickCell(tableCell, 0, j)"
              @dblclick.exact.stop="onDblclickCell(tableCell, 0, j)"
              @contextmenu.stop.prevent="onContextmenuCell($event, tableCell, 0, j)"
            >
              <span 
                v-if="fixedColumn.includes(j)"
                class="table-cell-inner flex-c-s"
              >
                <span 
                  class="table-cell-content" 
                  :style="{ whiteSpace: whiteSpace, wordWrap: wordWrap, textOverflow: textOverflow, ...getStyleCustomized(0, j) }"
                >
                  {{ tableCell.data }}
                </span>
                <span v-if="sortConfig[j]" class="table-sort flex-dir-column" :style="{ height: '30px' }">
                  <i 
                    class="sort-btns sort-ascending" 
                    :style="{
                      borderBottomColor: (activatedSort[j] && activatedSort[j] === 'ascending') ? activedColor : '#C0C4CC'
                    }"
                    @click.stop="onSort(j, 'ascending')"
                  >
                  </i>
                  <i 
                    class="sort-btns sort-descending"
                    :style="{
                      borderTopColor: (activatedSort[j] && activatedSort[j] === 'descending') ? activedColor : '#C0C4CC'
                    }"
                    @click.stop="onSort(j, 'descending')"
                  >
                  </i>
                </span>
                <span 
                  v-if="filterConfig[j]" 
                  class="table-filter flex-c-c" 
                  :style="{ height: headerHeight + 'px' }" 
                >
                  <filter-panel
                    :ref="`filter-${j}`"
                    :content="filterConfig[j].content"
                    :type="filterConfig[j].type"
                    :search="filterConfig[j].search"
                    :lang="lang"
                    @enter="() => { onFilterEnter(j) }"
                    @filter="(checked) => { onFilter(j, checked, filterConfig[j]) }"
                    @reset="clearFilter(j)"
                    @search="(filter, searchValue) => { onFilterSearch(filter, searchValue) }"
                  >
                    <i slot="reference" class="iconfont icondown" 
                      :style="{ color: activatedFilter[j] ? activedColor : '#C0C4CC' }"
                    >
                    </i>
                  </filter-panel>
                </span>
              </span>
            </div>
          </div>
          <!-- Fixed Body -->
          <div class="v-table-body v-table-body-fixed" :style="{ height: height }" ref="fixedBody">
            <div class="v-table-body-inner" :style="{ marginTop: fixedTop * -1 + 'px' }" @wheel="onFixedScroll" ref="fixedBodyInner">
              <div v-for="(tableRow, i) in tableData.activatedRows" :key="i" :style="{ minWidth: getRowMinWidth() }"> 
                <div
                  v-show="tableRow.show && !tableRow.filtered && !(pagination && !tableRow.inPage) && !(i === 0 && headerInfirstRow)" 
                  class="v-table-row flex-c"
                  :class="{ 
                    'is-striped': (rowStripe && i % 2 === 0), 
                    'v-show-border': tableBorder,
                    'is-hovering': tableRow.hovering
                  }"
                  :style="{ height: rowHeight + 'px', backgroundColor: tableRow.hovering ? rowHoverColor : '' }"
                  @mouseenter="onMouseenter(tableRow, true)" 
                  @mouseleave="onMouseleave(tableRow, true)"
                  @click="onClickRow(tableRow, tableRow.index)"
                >
                  <div 
                    v-if="showCheck" 
                    class="table-check flex-c-c" 
                    :class="{ 'v-show-border':tableBorder }"
                    :style="{ backgroundColor: isHighlighted(tableRow.index, NaN) ? highlightedColor : 'transparent' }"
                  > 
                    <div
                      class="table-check-row flex-c-c"
                      :class="{ 'is-checked': tableRow.checked }"
                      @click.stop="onCheckRow(tableRow, tableRow.index)"
                    >
                      <i class="iconfont iconcheck" v-show="tableRow.checked"></i>
                    </div>
                  </div>
                  <div 
                    v-for="(tableCell, j) in tableRow.cells" :key="j" 
                    class="table-cell flex-c-s" 
                    :class="{ 'v-show-border': tableBorder, 'is-header': (j === 0 && headerInfirstColumn ) }"
                    :style="getCellStyle(tableRow.index, j)"
                    @click="onClickCell(tableCell, tableRow.index, j)"
                    @dblclick.exact.stop="onDblclickCell(tableCell, tableRow.index, j)"
                    @contextmenu.stop.prevent="onContextmenuCell($event, tableCell, tableRow.index, j)"
                  >
                    <slot 
                      v-if="fixedColumn.includes(j)"
                      :name="'column-' + j" 
                      v-bind:props="{ cellData: tableCell.data, rowData: tableRow.cells, row: tableRow.index, column: j }"
                    >
                      <span
                        v-if="fixedColumn.includes(j)"
                        class="table-cell-content"
                        :class="{'fill-width': i !== 0}"
                        :style="{ whiteSpace: whiteSpace, wordWrap: wordWrap, textOverflow: textOverflow, ...getStyleCustomized(tableRow.index, j) }"
                        :contenteditable="isEditable(tableRow.index, j)"
                        :id="tableCell.key"
                        @blur="onCellBlur(tableCell, tableRow.index, j)"
                        @keydown.enter.stop.prevent="onCellKeyEnter"
                      >
                        {{ tableCell.data }}
                      </span>
                    </slot>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Table left/right border -->
        <div class="v-table-left-line" v-if="tableBorder"></div>
        <div class="v-table-right-line" v-if="tableBorder"></div>
        <div class="v-table-scrollbar">
          <horizontal-scrollbar
            v-if="bodyWidth && bodyViewerWidth"
            :x-bar-display="scrollbarDisplay"
            :size="7"
            :border-radius="0"
            :viewer-width="bodyViewerWidth"
            :wrapper-width="bodyWidth"
            :scrolling="hMovement"
            @change-position="onChangePosition"
            ref="hscroll"
          >
          </horizontal-scrollbar>
        </div>
      </div>
      <!-- Table Pagination -->
      <div class="table-pagination" v-if="pagination">
        <vue-pagination
          :page-size="pageSize"
          :page-sizes="pageSizes"
          :total="totalPages" 
          :show-total="showTotal"
          :disabled="!pagination"
          :lang="lang"
          @current-page="onPageChange"
          @size="onPageSizeChange"
          ref="tablePagination"
        >
        </vue-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { unemptyArray, is2DMatrix } from '../utils/array.js'
import { unique } from '../utils/unique.js'
import { isPercentage } from '../utils/util.js'
import VueScrollbar from 'vue-scrollbar-simple'
import HorizontalScrollbar from './scrollbar/HorizontalScrollbar.vue'
import VueInput from './VueInput.vue'
import FilterPanel from './FilterPanel.vue'
import ContextMenu from './ContextMenu.vue'
import VuePagination from './VuePagination.vue'
import '../assets/css/flex.css'
import '../assets/iconfont/iconfont.css'
const trim = require('lodash.trim')

const wordWrapList = ['normal', 'break-word']
const whiteSpaceList = ['nowrap', 'normal', 'pre', 'pre-wrap', 'pre-line']
const textOverflowList = ['clip', 'ellipsis']
const scrollbarDisplayList = ['hover', 'show', 'hidden']

export default {
  name: 'VueTableDynamic',
  data () {
    return {
      tableData: {},
      searchValue: '',
      activatedSort: {},
      activatedFilter: {},
      totalPages: 0,
      pageSize: 0,
      headerLeft: 0,
      scrollStep: 40,
      scrollx: 'left',
      scrolly: 'top',
      fixedColumn: [],
      fixedWidth: 0,
      fixedTop: 0,
      bodyWidth: null,
      bodyViewerWidth: null,
      hMovement: 0,
      isLoading: false,
      currentPage: 1,
      rowContextMenu: [],
    }
  },
  props: {
    // Form related information
    // params.data: (two-dimensional matrix) table data
    // params.header: (String) header type. 'row': the first row as the header;'column': the first column as the header;''/'none'/other: no header. Default none
    // params.border: (Boolean) Whether to have a border. Without default
    // params.stripe: (Boolean) The line background interval stripe display. Default false
    // params.highlight: (Object) Configure the row/column/table unit of the highlighted background
    // params.highlightedColor: (String) The color of the highlighted background.
    // params.wordWrap: (String) Wrap long words of text in table cells'normal/break-word' default normal
    // params.whiteSpace: (String) Blank handling of text in table cells'nowrap/normal/pre/pre-wrap/pre-line' default nowrap
    // params.textOverflow: (String) text overflow handling in table cells'clip/ellipsis' default clip
    // params.showCheck: (Boolean) Whether to show the multi-select (check) box in front of the first column. Not displayed by default. Note: Only when params.header is'row, the first column of the first row is the'select all' box, otherwise the first column is the check box of the current row
    // params.enableSearch: (Boolean) Enable the search function. Disabled by default
    // params.minWidth: (Number) The minimum width of the table. Default 100
    // params.maxWidth: (Number) The maximum width of the table. Default 10000
    // params.height: (Number) table height.
    // params.headerHeight: (Number) table header height. Default 30
    // params.rowHeight: (Number) table row height. Default 30
    // params.columnWidth: (Array) Specify the width of a certain column or certain columns, and the remaining column widths are equally divided. [{column: 0, width: 80}, {column: 1, width: '20%'}]
    // params.sort: (Array) Specify sorting based on a certain column. If you specify the first and second columns, you can sort: [0, 1]. Only valid when the first row is configured as the header
    // params.edit: (Object) Configure the editable row/column/table unit. Such as: {row: [2, 3, ... ], column: [3, 4, ... ], cell: [[4, 4], [5, 6], ...]}; negative number means Reverse order (such as -1 is the last row/column); row:'all' all rows
    // Editing will change the data displayed in the table, but will not change the incoming source data. When calling the component method to get the table data, the edited data is returned. The header cannot be edited. Disabled by default
    // params.filter: (Array) Configure column-based filtering. Such as: [{column: 0, content: [{text:'> 5', value: 5}], method: (value, tableCell) => {... }}]
    // params.activedColor: (string) The color of the header sorting/filtering button after activation
    // params.pagination: (Boolean) Whether to enable the paging function. Default false
    // params.pageSize: (Number) The number of items displayed per page
    // params.pageSizes: (Array) Optional value of the number of items displayed per page
    params: { type: Object, default: () => { return {} } }
  },
  mounted() {
    if (this.params && this.params.rowContextMenu) {
      this.rowContextMenu = this.params.rowContextMenu;
    } else {
      this.rowContextMenu = [];
    }
  },
  computed: {
    sourceData () {
      if (this.params && Array.isArray(this.params.data)) {
        return this.params.data
      }
      return []
    },
    tableBorder () {
      return !!(this.params && this.params.border)
    },
    rowStripe () {
      return !!(this.params && this.params.stripe)
    },
    highlightConfig () {
      if (this.params && this.params.highlight && typeof this.params.highlight === 'object') {
        return this.params.highlight
      }
      return {}
    },
    highlightedColor () {
      if (this.params && this.params.highlightedColor && typeof this.params.highlightedColor === 'string') {
        return this.params.highlightedColor
      }
      return '#EBEBEF'
    },
    headerBgColor () {
      if (this.params && this.params.headerBgColor && typeof this.params.headerBgColor === 'string') {
        return this.params.headerBgColor
      }
      return ''
    },
    rowHoverColor () {
      if (this.params && this.params.rowHoverColor && typeof this.params.rowHoverColor === 'string') {
        return this.params.rowHoverColor
      }
      return ''
    },
    wordWrap () {
      if (this.params && this.params.wordWrap && wordWrapList.includes(this.params.wordWrap)) {
        return this.params.wordWrap
      }
      return wordWrapList[0]
    },
    whiteSpace () {
      if (this.params && this.params.whiteSpace && whiteSpaceList.includes(this.params.whiteSpace)) {
        return this.params.whiteSpace
      }
      return whiteSpaceList[0]
    },
    textOverflow () {
      if (this.params && this.params.textOverflow && textOverflowList.includes(this.params.textOverflow)) {
        return this.params.textOverflow
      }
      return textOverflowList[0]
    },
    headerInfirstRow () {
      return !!(this.params && this.params.header === 'row')
    },
    headerInfirstColumn () {
      return !!(this.params && this.params.header === 'column')
    },
    showCheck () {
      return !!(this.params && this.params.showCheck)
    },
    enableSearch () {
      return !!(this.params && this.params.enableSearch)
    },
    enableTools () {
      return this.enableSearch
    },
    minWidth () {
      if (this.params && typeof this.params.minWidth === 'number' && this.params.minWidth > 0) {
        return this.params.minWidth
      }
      return 100
    },
    maxWidth () {
      if (this.params && typeof this.params.maxWidth === 'number' && this.params.maxWidth > 0) {
        return this.params.maxWidth
      }
      return 10000
    },
    headerHeight () {
      if (this.params && typeof this.params.headerHeight === 'number' && this.params.headerHeight >= 24) {
        return this.params.headerHeight
      }
      return 30
    },
    rowHeight () {
      if (this.params && typeof this.params.rowHeight === 'number' && this.params.rowHeight >= 24) {
        return this.params.rowHeight
      }
      return 30
    },
    height () {
      if (this.params && typeof this.params.height === 'number' && this.params.height > this.rowHeight) {
        if (this.headerInfirstRow) {
          return (this.params.height - this.headerHeight) + 'px'
        }
        return this.params.height + 'px'
      }
      return 'auto'
    },
    columnWidth () {
      if (this.params && unemptyArray(this.params.columnWidth)) {
        let obj = {}
        let percentageList = []

        this.params.columnWidth.forEach(c => {
          if (c && typeof c.column === 'number' && c.column >= 0) {
            if (typeof c.width === 'number' && c.width >= 0) {
              obj[c.column] = { value: c.width + 'px', type: 'absolute' }
            } else if (isPercentage(c.width)) {
              obj[c.column] = { value: c.width, type: 'percentage' }
              percentageList.push(c.width)
            }
          }
        })

        if (percentageList.length > 0) {
          let total = percentageList.reduce((t, p) => { return parseFloat(t) + parseFloat(p) })
          if (total > 100) {
            console.error(`The total percentage of column width must be less than 100%, current is ${total}%`)
            return {}
          }
        }

        return obj
      }
      return {}
    },
    fixedConfig () {
      if (this.params && typeof this.params.fixed === 'number' && this.params.fixed >= 0) {
        return this.params.fixed
      }
      return null
    },
    sortConfig () {
      if (this.params && this.params.header === 'row' && Array.isArray(this.params.sort)) {
        let conf = {}
        this.params.sort.forEach(s => {
          if (typeof s === 'number' && s >= 0) {
            conf[s] = {}
          } else if (s && typeof s === 'object' && typeof s.column === 'number' && (typeof s.ascending === 'function' || typeof s.descending === 'function')) {
            conf[s.column] = s
          }
        })

        return conf
      }
      return {}
    },
    editConfig () {
      if (this.params && this.params.edit && typeof this.params.edit === 'object') {
        return this.params.edit
      }
      return {}
    },
    styleConfig () {
      if (this.params && this.params.style && typeof this.params.style === 'object') {
        return this.params.style
      }
      return {}
    },
    activedColor () {
      if (this.params && this.params.activedColor && typeof this.params.activedColor === 'string') {
        return this.params.activedColor
      }
      return '#046FDB'
    },
    filterConfig () {
      if (this.params && unemptyArray(this.params.filter)) {
        let filterObj = {}
        this.params.filter.forEach(f => {
          if (f
            && typeof f.column === 'number'
            && f.column >= 0
            && typeof ((f.method === 'function' && !this.remoteDataSource) || (f.operator && this.remoteDataSource))
            && (['datetime', 'select', 'multiselect'].includes(f.type) || unemptyArray(f.content))
          ) {
            if (f.content.every(c => { return (c && typeof c.text === 'string' && typeof c.value !== 'undefined') })) {
              let content = f.content.map(c => { return { ...c, checked: false, key: unique(`content-`) } })
              filterObj[f.column] = { ...f, content, key: unique(`filter-`) }
            }
          }
        })
        return filterObj
      }
      return {}
    },
    pagination () {
      return !!(this.params && this.params.pagination)
    },
    pageSizeConfig () {
      if (this.params && typeof this.params.pageSize === 'number' && this.params.pageSize > 0) {
        return this.params.pageSize
      }
      return 10
    },
    pageSizes () {
      if (Array.isArray(this.params.pageSizes)) {
        return this.params.pageSizes
      }
      return [10, 20, 50, 100]
    },
    showTotal () {
      return !!(this.params && this.params.showTotal)
    },
    scrollbarDisplay () {
      if (this.params && scrollbarDisplayList.includes(this.params.scrollbar)) {
        return this.params.scrollbar
      }
      return 'show'
    },
    lang () {
      if (this.params && ['en_US', 'zh_CN'].includes(this.params.language)) {
        return this.params.language
      }
      return 'en_US'
    },
    remoteDataSource() {
      if (this.params && this.params.remoteDataSource) {
        return this.params.remoteDataSource;
      }

      return false;
    },
    remoteDataHandler() {
      if (this.params && this.params.remoteDataHandler) {
        return this.params.remoteDataHandler;
      }

      return null;
    },
  },
  watch: {
    params: {
      handler (value) {
        this.searchValue = ''
        this.activatedSort = {}
        this.activatedFilter = {}
      },
      deep: true,
      immediate: true
    },
    sourceData: {
      handler (value) {
        this.initData(value)
      },
      deep: true,
      immediate: true
    },
    searchValue (value) {
      if (!this.enableSearch) return;
      if (this.remoteDataSource && this.remoteDataHandler) {
        this.isLoading = true;

        this.remoteDataHandler(value, this.filterConfig, this.getSort(), 1, this.pageSize)
          .then(({ data, totalItems, contextMenu }) => {
            this.$nextTick(() => { 
              this.rowContextMenu = contextMenu;
              this.initData(data, totalItems);
            });
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });

        return;
      }

      this.search(value);
    },
    headerInfirstRow (value) {
      if (value && this.tableData && this.tableData.rows.length) {
        this.tableData.rows[0].checked = false
        this.tableData.rows[0].show = true
      }
    },
    enableSearch (newVal, oldVal) {
      if (oldVal && !newVal) {
        this.clearSearch()
      }
    },
    pageSizeConfig: {
      handler (v) {
        if (v > 0 && this.pageSize !== v && (this.params && this.params.pagination)) {
          this.pageSize = v
        }
      },
      immediate: true
    },
    showCheck (value) {
      this.$nextTick(this.updateFixedColumn)
    },
    fixedConfig: {
      handler () {
        this.$nextTick(this.updateFixedColumn)
      },
      immediate: true
    },
    columnWidth (value) {
      this.$nextTick(this.updateFixedColumn)
    }
  },
  beforeDestroy () {
    this.tableData = {}
    this.activatedSort = {}
    this.activatedFilter = {}
  },
  methods: {
    refresh(page) {
      if (!this.remoteDataSource || !this.remoteDataHandler) {
        return;
      }

      if (this.$refs && this.$refs.tablePagination) {
        const toPage = page || this.currentPage;
        this.currentPage = -1; // a little hack to force page update
        this.$refs.tablePagination.toPage(toPage);
      }
    },
    getSort() {
      const sort = {};
      if (Object.keys(this.activatedSort).length) {
        sort.columnIndex = Object.keys(this.activatedSort)[0];
        sort.order = this.activatedSort[sort.columnIndex];
      }

      return sort;
    },
    /**
   * @function Initialize table data
   */
    initData (sourceData, totalItems, skipPaginationUpdate) {
      if (this.params && is2DMatrix(sourceData)) {
        let table = { key: unique(`table-`), checked: false, rows: [], activatedRows: [], filteredRows: {} };
        for (let i = 0; i < sourceData.length; i++) {
          let tableRow = { key: unique(`table-`), checked: false, show: true, filtered: false, inPage: false, hovering: false, index: i };
          tableRow.cells = sourceData[i].map(item => {
            return { data: item, key: unique(`table-`), checked: false };
          })
          table.rows.push(tableRow);
        }
        this.tableData = table;

        if (this.pagination) {
          if (!skipPaginationUpdate) {
            this.$nextTick(() => this.updatePagination(totalItems));
          } else if (this.remoteDataSource) {
            this.tableData.rows.forEach(r => { r.inPage = true; });
            this.tableData.activatedRows = this.tableData.rows;
          }
        } else {
          this.tableData.activatedRows = this.tableData.rows;
        }
      }
    },
    updateActivatedRows () {
      if (!(this.tableData && this.tableData.rows && this.tableData.rows.length > 0)) return

      this.tableData.activatedRows = this.tableData.rows.filter((row, index) => {
        if (index === 0 && this.headerInfirstRow) return true
        return (row.show && !row.filtered && !(this.pagination && !row.inPage))
      })
    },
    /**
   * @function Update paging data
   */
    updatePagination (totalItems) {
      if (!this.pagination) return;
      if (!(this.tableData && this.tableData.rows && this.tableData.rows.length > 0)) return;

      const rowNum = this.remoteDataSource && totalItems !== undefined ? totalItems : this.getActivatedRowNum();
      if (rowNum === this.totalPages) {
        if (this.$refs && this.$refs.tablePagination) {
          this.$refs.tablePagination.initPages(this.totalPages)
        }
      } else {
        this.totalPages = rowNum
      }
    },
    /**
   * @function Current page number change
   * @param {Number} page number
   */
    onPageChange (page) {
      if (!this.pagination) return;
      if (!(this.tableData && this.tableData.rows && this.tableData.rows.length > 0)) return;

      if (this.remoteDataSource && this.remoteDataHandler && this.currentPage !== page) {
        this.isLoading = true;
        this.remoteDataHandler(this.searchValue, this.filterConfig, this.getSort(), page, this.pageSize)
          .then(({ data, contextMenu }) => {
            this.$nextTick(() => { 
              this.rowContextMenu = contextMenu;
              this.initData(data, undefined, true);
            });
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });

        this.currentPage = page;
        return;
      }

      this.currentPage = page;
      let start = (page - 1) * this.pageSize;
      let end = start + this.pageSize;

      let rows = this.tableData.rows.filter((row, index) => {
        if (index === 0 && this.headerInfirstRow) return false;
        return row.show && !row.filtered;
      })
      rows.forEach((row, index) => {
        row.inPage = !!(index >= start && index < end);
      })

      this.$nextTick(this.updateActivatedRows);
    },
    /**
   * @function Display the number of switching events per page
   */
    onPageSizeChange (size) {
      if (!this.pagination) return;
      if (this.pageSize !== size && this.remoteDataSource && this.remoteDataHandler) {
        this.isLoading = true;
        this.remoteDataHandler(this.searchValue, this.filterConfig, this.getSort(), 1, size)
          .then(({ data, totalItems, contextMenu }) => {
            this.$nextTick(() => { 
              this.rowContextMenu = contextMenu;
              this.initData(data, totalItems);
            });
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });
      }

      this.pageSize = size;
    },
    onRowContextMenuAction (rowData, rowIndex, actionValue) {
      this.$emit('row-action', rowData, rowIndex, actionValue);
    },
    /**
   * @function Jump to the target page
   * @param {Number} tagetPage Page number
   */
    toPage (tagetPage) {
      if (!this.pagination) return
      if (!(typeof tagetPage === 'number' && tagetPage > 0)) return

      if (this.$refs && this.$refs.tablePagination) {
        this.$refs.tablePagination.toPage(tagetPage)
      }
    },
    /**
   * @function Get cell style data
   */
    getCellStyle (rowIndex, columnIndex) {
      let style = {}
      if (this.isHighlighted(rowIndex, columnIndex)) {
        style.backgroundColor = this.highlightedColor
      }

      if (this.columnWidth[columnIndex]) {
        return {
          ...style,
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: this.columnWidth[columnIndex].value
        }
      } else {
        return {
          ...style,
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: '0%'
        }
      }
    },
    /**
      * @function calculates the minimum row width based on the input column width configuration
      * 1. Column width is not configured: inherit the width of the parent container
      * 2. Only part (or all) of the column width is configured as an absolute pixel value: the sum of the configured pixel values + the remaining columns * the minimum width of the column + the width of the multi-selection column (if multi-selection is enabled)
      * 3. All columns are configured as relative percentages: inherit the width of the parent container
      * 4. Some columns are configured as relative percentages, and some columns are configured as absolute pixel values: (sum of configured pixel values (if any) + remaining columns (if any) * minimum column width + multi-choice column width (if multiple columns are enabled) Optional)) * 100 / (100-the sum of configured percentages)
      */
    getRowMinWidth () {
      let columnMinWidth = 80
      let checkColumnWidth = this.showCheck ? 50 : 0
      let columnNum = this.getColumnNum()
      let defaultMinWidth = '100%'
      let offset = 2
      let keys = Object.keys(this.columnWidth)

      if (!(keys.length > 0)) {
        return defaultMinWidth
      } else {
        let abs = { total: 0, count: 0 } // Absolute pixel value
        let pct = { total: 0, count: 0 } // Relative percentage

        for (let i = 0; i < keys.length; i++) {
          if (keys[i] >= columnNum) continue

          let conf = this.columnWidth[keys[i]]
          if (conf.type === 'absolute') {
            abs.total += parseFloat(conf.value)
            abs.count += 1
          } else if (conf.type === 'percentage') {
            pct.total += parseFloat(conf.value)
            pct.count += 1
          }
        }

        if (pct.count === 0) {
          let remainNum = columnNum - abs.count
          if (remainNum < 0) return defaultMinWidth
          return Math.ceil(abs.total + remainNum * columnMinWidth + checkColumnWidth) + offset + 'px'
        } else if (pct.count === columnNum) {
          return defaultMinWidth
        } else {
          let remainNum = columnNum - abs.count - pct.count
          if (remainNum < 0 || pct.total >= 100) return defaultMinWidth

          let ret = (remainNum * columnMinWidth + checkColumnWidth + abs.total) * 100 / (100 - pct.total)
          return Math.ceil(ret) + offset + 'px'
        }
      }
    },
    updateFixedColumn () {
      if (!(typeof this.fixedConfig === 'number' && this.fixedConfig >= 0)) {
        this.fixedColumn = []
        this.fixedWidth = 0
        return
      }

      let fixedWidth = 0
      let fixedColumn = []
      for (let i = 0; i <= this.fixedConfig; i++) {
        let columnIndex = i
        let item = this.columnWidth[columnIndex]
        if (item && item.type === 'absolute') {
          fixedWidth += parseFloat(item.value)
          fixedColumn.push(columnIndex)
        } else {
          this.fixedColumn = []
          this.fixedWidth = 0
          throw new Error(`Failed to render fixed column, the width of fixed column(${i}) needs to be configured with an absolute pixel value by params.columnWidth `)
        }
      }

      let checkColumnWidth = this.showCheck ? 50 : 0
      fixedWidth += checkColumnWidth
      this.fixedWidth = fixedWidth
      this.fixedColumn.splice(0, this.fixedColumn.length, ...fixedColumn)
    },
    /**
   * @function Check whether the cell is editable
   * @param {Number} rowIndex
   * @param {Number} columnIndex
   */
    isEditable (rowIndex, columnIndex) {
      if (!(this.editConfig && (this.editConfig.row || this.editConfig.column || this.editConfig.cell))) return false
      if (this.headerInfirstRow && rowIndex === 0) return false
      if (this.headerInfirstColumn && columnIndex === 0) return false
      
      if (this.editConfig.row === 'all' || this.editConfig.column === 'all' || this.editConfig.cell === 'all') return true

      if (Array.isArray(this.editConfig.row) &&
        (this.editConfig.row.includes(rowIndex) || this.editConfig.row.includes(rowIndex - this.sourceData.length))) {
        return true
      }

      if (Array.isArray(this.editConfig.column) &&
        (this.editConfig.column.includes(columnIndex) || this.editConfig.column.includes(columnIndex - this.sourceData[0].length))) {
        return true
      }

      if (Array.isArray(this.editConfig.cell) && this.editConfig.cell.length > 0) {
        return this.editConfig.cell.some(item => {
          return (Array.isArray(item) && item.length >= 2 && (item[0] === rowIndex || item[0] === (rowIndex - this.sourceData.length)) && (item[1] === columnIndex || item[1] === (columnIndex - this.sourceData[0].length)))
        })
      }

      return false
    },
    isHighlighted (rowIndex, columnIndex) {
      if (!(this.highlightConfig && (this.highlightConfig.row || this.highlightConfig.column || this.highlightConfig.cell))) return false

      if (Array.isArray(this.highlightConfig.row) &&
        (this.highlightConfig.row.includes(rowIndex) || this.highlightConfig.row.includes(rowIndex - this.sourceData.length))) {
        return true
      }

      if (Array.isArray(this.highlightConfig.column) &&
        (this.highlightConfig.column.includes(columnIndex) || this.highlightConfig.column.includes(columnIndex - this.sourceData[0].length))) {
        return true
      }

      if (Array.isArray(this.highlightConfig.cell) && this.highlightConfig.cell.length > 0) {
        return this.highlightConfig.cell.some(item => {
          return (Array.isArray(item) && item.length >= 2 && (item[0] === rowIndex || item[0] === (rowIndex - this.sourceData.length)) && (item[1] === columnIndex || item[1] === (columnIndex - this.sourceData[0].length)))
        })
      }

      return false
    },
    getStyleCustomized (rowIndex, columnIndex) {
      if (!(this.styleConfig && (this.styleConfig.row || this.styleConfig.column || this.styleConfig.cell))) return {}

      if (Array.isArray(this.styleConfig.row)) {
        for (let i = 0; i < this.styleConfig.row.length; i++) {
          let item = this.styleConfig.row[i]
          if (typeof item.styles === 'object') {
            if (item.scope === 'all') { return item.styles }
            else if (Array.isArray(item.scope) && 
              (item.scope.includes(rowIndex) || item.scope.includes(rowIndex - this.sourceData.length))) {
              return item.styles
            }
          }
        }
      }
      
      if (Array.isArray(this.styleConfig.column)) {
        for (let i = 0; i < this.styleConfig.column.length; i++) {
          let item = this.styleConfig.column[i]
          if (typeof item.styles === 'object') {
            if (item.scope === 'all') { return item.styles }
            else if (Array.isArray(item.scope) && 
              (item.scope.includes(columnIndex) || item.scope.includes(columnIndex - this.sourceData[0].length))) {
              return item.styles
            }
          }
        }
      }

      if (Array.isArray(this.styleConfig.cell)) {
        for (let i = 0; i < this.styleConfig.cell.length; i++) {
          let item = this.styleConfig.cell[i]
          if (typeof item.styles === 'object') {
            if (item.scope === 'all') { return item.styles }
            else if (Array.isArray(item.scope)) {
              let included = item.scope.some(s => {
                return (Array.isArray(s) && s.length >= 2 && (s[0] === rowIndex || s[0] === (rowIndex - this.sourceData.length)) && (s[1] === columnIndex || s[1] === (columnIndex - this.sourceData[0].length)))
              })
              if (included) return item.styles
            }
          }
        }
      }

      return {}
    },
    /**
   * @function Check all Row
   * @param {Object} tableRow First row header
   */
    onCheckAll (tableRow) {
      if (!this.showCheck) return
      let allChecked = (tableRow.checked !== true)
      this.setAllRowChecked(allChecked)
      this.$emit('select-all', allChecked)
      this.$emit(
        'selection-change', 
        this.getCheckedRowDatas(true), 
        this.getCheckedRowIndexs(true),
        this.getCheckedRowNum(true)
      )
    },
    /**
   * @function Check a single Row
   * @param {Object} tableRow Row data object
   * @param {Number} rowIndex
   */
    onCheckRow (tableRow, rowIndex) {
      if (!this.showCheck) return

      tableRow.checked = !tableRow.checked
      
      if (this.headerInfirstRow) {
        if (this.isAllRowChecked()) {
          this.tableData.rows[0].checked = true
        } else if (this.getCheckedRowNum() > 0) {
          this.tableData.rows[0].checked = 'line'
        } else {
          this.tableData.rows[0].checked = false
        }
      }

      this.$emit('select', tableRow.checked, this.headerInfirstRow ? rowIndex - 1 : rowIndex, this.getRowDataFromTableRow(tableRow))
      this.$emit(
        'selection-change', 
        this.getCheckedRowDatas(true), 
        this.getCheckedRowIndexs(true),
        this.getCheckedRowNum(true)
      )
    },
    /**
   * @function Click Row event
   * @param {Object} tableRow Row data object
   * @param {Number} rowIndex
   */
    onClickRow (tableRow, rowIndex) {
      this.$emit('row-click', this.headerInfirstRow ? rowIndex - 1 : rowIndex, this.getRowDataFromTableRow(tableRow))
    },
    /**
   * @function Mouse enters Row event
   * @param {Object} tableRow Row data object
   * @param {Boolean} isFixedBody Whether it is row in a fixed column
   */
    onMouseenter (tableRow, isFixedBody = false) {
      tableRow.hovering = true
      if (isFixedBody && this.$refs.scrollbar && this.$refs.scrollbar.onMouseenter) {
        this.$refs.scrollbar.onMouseenter()
      }
    },
    /**
   * @function Mouse left Row event
   * @param {Object} tableRow Row data object
   * @param {Boolean} isFixedBody Whether it is row in a fixed column
   */
    onMouseleave (tableRow, isFixedBody = false) {
      tableRow.hovering = false
      if (isFixedBody && this.$refs.scrollbar && this.$refs.scrollbar.onMouseleave) {
        this.$refs.scrollbar.onMouseleave()
      }
    },
    onContextmenuCell (event, tableCell, rowIndex, columnIndex) {
      this.$emit('cell-contextmenu', event, this.headerInfirstRow ? rowIndex - 1 : rowIndex, columnIndex, tableCell.data)
    },
    onMouseenterTable () {
      if (this.$refs.hscroll) {
        this.$refs.hscroll.showBar()
      }
    },
    onMouseleaveTable () {
      if (this.$refs.hscroll) {
        this.$refs.hscroll.hiddenBar()
      }
    },
    /**
   * @function Click Cell event
   * @param {Object} tableCell Cell data object
   * @param {Number} rowIndex
   * @param {Number} columnIndex
   */
    onClickCell (tableCell, rowIndex, columnIndex) {
      this.$emit('cell-click', this.headerInfirstRow ? rowIndex - 1 : rowIndex, columnIndex, tableCell.data)
    },
    /**
   * @function Double-click Cell event
   * @param {Object} tableCell Cell data object
   * @param {Number} rowIndex
   * @param {Number} columnIndex
   */
    onDblclickCell (tableCell, rowIndex, columnIndex) {
      this.$emit('cell-dblclick', rowIndex, columnIndex, tableCell.data)
    },
    /**
   * @function The cell loses focus. If the editing function is enabled, the data is updated with the current input. If the source data is of type number, only valid when the input is number
   * @param {Object} tableCell Cell data object
   * @param {Number} rowIndex
   * @param {Number} columnIndex
   */
    onCellBlur (tableCell, rowIndex, columnIndex) {
      if (!this.isEditable(rowIndex, columnIndex)) return

      let cellEle = document.querySelector(`#${tableCell.key}`)
      let newVal = trim(cellEle.innerHTML)

      if (cellEle && (tableCell.data !== newVal)) {
        if (typeof tableCell.data === 'number') {
          newVal = Number(newVal)
          if (tableCell.data === newVal) return
          if (isNaN(newVal)) {
            return (cellEle.innerHTML = `${tableCell.data}`)
          }
          
          tableCell.data = newVal
          this.$emit('cell-change', this.headerInfirstRow ? rowIndex - 1 : rowIndex, columnIndex, tableCell.data)
        } else {
          tableCell.data = trim(cellEle.innerHTML)
          this.$emit('cell-change', this.headerInfirstRow ? rowIndex - 1 : rowIndex, columnIndex, tableCell.data)
        }
      }
    },
    onCellKeyEnter (e) {
    },
    /**
   * @function Sort based on a column of data
   * @param {Number} index Column index
   * @param {String} value ascending/descending
   */
    onSort (index, value) {
      if (!(this.tableData && this.tableData.rows && this.tableData.rows.length > 0)) return;
      if (!this.headerInfirstRow) return;
      if (this.activatedSort[index] === value) return;

      this.activatedSort = {};
      this.activatedSort[index] = value;

      if (this.remoteDataSource && this.remoteDataHandler) {
        this.isLoading = true;
        this.remoteDataHandler(this.searchValue, this.filterConfig, { columnIndex: index, order: value }, this.currentPage, this.pageSize)
          .then(({ data, contextMenu }) => {
            this.$nextTick(() => { 
              this.rowContextMenu = contextMenu;
              this.initData(data, undefined, true);
            });
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });

        this.$emit('sort-change', index, value);
        return;
      }

      // Default collation
      let ascending = (a, b) => { 
        if (a === b) { return 0 }
        else { return a > b ? 1 : -1 }
      }
      let descending = (a, b) => { 
        if (a === b) { return 0 }
        else { return b > a ? 1 : -1 }
      }

      // Custom collation
      if (this.sortConfig && this.sortConfig[index]) {
        if (typeof this.sortConfig[index].ascending === 'function') {
          ascending = this.sortConfig[index].ascending
        }
        if (typeof this.sortConfig[index].descending === 'function') {
          descending = this.sortConfig[index].descending
        }
      }
      
      this.tableData.rows.sort((row1, row2) => {
        if (row1.index === 0) return -1
        if (row2.index === 0) return 1
        let data1 = row1.cells[index].data
        let data2 = row2.cells[index].data
        if (value === 'ascending') {
          return ascending(data1, data2)
        } else {
          return descending(data1, data2)
        }
      })

      this.$emit('sort-change', index, value)
      this.updateActivatedRows()
      this.$nextTick(this.updatePagination)
    },
    onFilterEnter(columnIndex) {
      Object.keys(this.filterConfig).forEach(key => {
        if (columnIndex === this.filterConfig[key].column) {
          return;
        }

        const filter = this.$refs[`filter-${this.filterConfig[key].column}`];
        if(filter && Array.isArray(filter) && filter.length) {
          filter.forEach(i => {
            if (i.display) i.display.doClose();
          });
        }
      });
    },
    /**
   * @function Filter based on a column of data
   * @param {Number} columnIndex
   * @param {Array} checked Selected filter
   * @param {Object} config Filter configuration for this column
   */
    onFilter (columnIndex, checked, config) {
      if (!(this.tableData && this.tableData.rows)) return;

      this.activatedFilter[columnIndex] = true;
      if (this.filterConfig[columnIndex].type === 'daterange') {
        this.filterConfig[columnIndex].content[0].value = checked[0].value;
      } else if (['select', 'multiselect'].includes(this.filterConfig[columnIndex].type)) {
        this.filterConfig[columnIndex].content = checked;
      }

      if (this.remoteDataSource && this.remoteDataHandler) {
        this.isLoading = true;
        this.remoteDataHandler(this.searchValue, this.filterConfig, this.getSort(), 1, this.pageSize)
          .then(({ data, totalItems, contextMenu }) => {
            this.$nextTick(() => { 
              this.rowContextMenu = contextMenu;
              this.initData(data, totalItems);
            });
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });

        return;
      }

      let filteredArr = [];
      this.tableData.rows.forEach((row) => {
        if (row && row.cells && row.cells[columnIndex]) {
          let matched = checked.some(item => {
            return config.method(item.value, row.cells[columnIndex]);
          });
          matched ? '' : filteredArr.push(row.index);
        }
      })
      this.tableData.filteredRows[columnIndex] = filteredArr;

      this.updateFilteredRows();
    },
    async onFilterSearch (filter, searchValue) {
      if (!filter || typeof filter.search !== 'function') {
        return;
      }

      if (!searchValue) {
        return;
      }

      filter.isLoading = true;
      try {
        const result = await filter.search(searchValue, {
          search: this.searchValue,
          filter: this.filterConfig,
          sort: this.getSort(),
          page: this.currentPage,
          pageSize: this.pageSize,
        });

        if (result && Array.isArray(result)) {
          filter.options = result;
        }
      } catch(ex) {}
      filter.isLoading = false;
    },
    /**
   * @function Update row filter status
   */
    updateFilteredRows () {
      this.tableData.rows.forEach(row => {
        row.filtered = Object.keys(this.tableData.filteredRows).some(key => {
          return this.tableData.filteredRows[key].includes(row.index)
        })
        row.filtered = !!row.filtered
      })

      this.updateActivatedRows()
      this.$nextTick(this.updatePagination)
    },
    /**
   * @function Clear filter status
   * @param {Number} columnIndex Column index. When the column index is passed in, the column is cleared; when the index is not passed, all filters are cleared
   */
    clearFilter (columnIndex) {
      if (typeof columnIndex === 'number') {
        this.activatedFilter[columnIndex] = false;

        if (!(this.remoteDataSource && this.remoteDataHandler)) {
          delete this.tableData.filteredRows[columnIndex];
        }

        if (this.filterConfig && this.filterConfig[columnIndex]) {
          this.filterConfig[columnIndex].content.forEach(c => { c.checked = false });
        }
      } else {
        this.activatedFilter = {};

        if (!(this.remoteDataSource && this.remoteDataHandler)) {
          this.tableData.filteredRows = {};
        }

        Object.keys(this.filterConfig).forEach(key => {
          this.filterConfig[key].content.forEach(c => { c.checked = false });
        })
      }

      if (this.remoteDataSource && this.remoteDataHandler) {
        this.isLoading = true;
        this.remoteDataHandler(this.searchValue, this.filterConfig, this.getSort(), 1, this.pageSize)
          .then(({ data, totalItems, contextMenu }) => {
            this.$nextTick(() => { 
              this.rowContextMenu = contextMenu;
              this.initData(data, totalItems);
            });
            this.isLoading = false;
          })
          .catch(() => {
            this.isLoading = false;
          });

        return;
      }
  
      this.updateFilteredRows();
    },
    /**
   * @function Search by keyword, show matching rows
   * @param {String} searchValue Keyword
   * @param {Array} included Match in the specified column
   * @param {Array} excluded Does not match in the specified column. Priority is higher than included
   */
    search (searchValue, included, excluded) {
      if (!(this.tableData && this.tableData.rows)) return

      searchValue = String(searchValue)
      let isIncluded = !!(included && included.length >= 1)
      let isExcluded = !!(excluded && excluded.length >= 1)

      this.tableData.rows.forEach(row => {
        if (row && row.cells) {
          if (!searchValue) {
            return row.show = true
          }

          let matched = row.cells.some((cell, index) => {
            if (isExcluded && excluded.includes(index)) return false
            if (isIncluded && !included.includes(index)) return false
            return String(cell.data).toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
          })
          row.show = !!matched
        }
      })

      this.updateActivatedRows()
      this.$nextTick(this.updatePagination)
    },
    /**
   * @function Cancel search filter
   */
    clearSearch () {
      if (!(this.tableData && this.tableData.rows)) return
      this.tableData.rows.forEach(row => {
        row ? row.show = true : ''
      })

      this.updateActivatedRows()
      this.$nextTick(this.updatePagination)
    },
    /**
   * @function Get the number of selected rows
   * @param {Boolean} includeWhenHeaderInfirstRow Whether to check the header of the first row. Default false
   */
    getCheckedRowNum (includeWhenHeaderInfirstRow = false) {
      if (!this.showCheck) return 0

      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let num = 0
        this.tableData.rows.forEach((row, index) => {
          if (index === 0 && this.headerInfirstRow) {
            if (!includeWhenHeaderInfirstRow) return
            if (row.checked !== false) return (num++)
          }
          if (row.checked) num++
        })
        return num
      }

      return 0
    },
    /**
   * @function Get the original index of the selected row (before sorting). The returned index list has nothing to do with sorting
   * @param {Boolean} includeWhenHeaderInfirstRow Whether to check the header of the first row. Default false
   * @param {Boolean} excludeFiltered Whether to exclude (checked) rows filtered by (Search/Column Filter). Default false
   * @param {Boolean} excludeNotInPage When paging is enabled, whether to exclude (checked) rows that are not on the current page. Default false
   */
    getCheckedRowIndexs (includeWhenHeaderInfirstRow = false, excludeFiltered = false, excludeNotInPage = false) {
      if (!this.showCheck) return []

      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let indexs = []

        this.tableData.rows.forEach((row, index) => {
          if (index === 0 && this.headerInfirstRow) {
            if (!includeWhenHeaderInfirstRow) return
            if (row.checked !== false) return indexs.push(row.index)
          }

          if (row.checked) {
            if (excludeFiltered && (!row.show || row.filtered)) return
            if (excludeNotInPage && this.pagination && !row.inPage) return
            indexs.push(row.index)
          }
        })

        return indexs
      }

      return []
    },
    /**
   * @function Get the data of the selected row（2DMatrix）
   * @param {Boolean} includeWhenHeaderInfirstRow Whether to check the first row header
   */
    getCheckedRowDatas (includeWhenHeaderInfirstRow = false) {
      let indexs = this.getCheckedRowIndexs(includeWhenHeaderInfirstRow)
      let checkedDatas = this.getData(indexs)
      return checkedDatas || []
    },
    /**
   * @function Get the latest data in the table. You can specify to include only the specified rows, or include all data if you don't specify them. Row order is initial order
   * @param {Array} rowIndexs Specify the line. Such as: [0, 1, 2, ...]
   */
    getData (rowIndexs) {
      let matrix = []
      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let tmpRows = {}
        this.tableData.rows.forEach((row, index) => {
          if (Array.isArray(rowIndexs)) {
            rowIndexs.includes(row.index) ? tmpRows[row.index] = row : ''
          } else {
            tmpRows[row.index] = row
          }
        })
        for (let i = 0; i < this.tableData.rows.length; i++) {
          let rowData = this.getRowDataFromTableRow(tmpRows[i])
          rowData.length > 0 ? matrix.push(rowData) : ''
        }
      }
      return matrix
    },
    /**
   * @function Get the latest data of the specified row according to the row index
   * @param {Number} rowIndex Row index
   * @param {Boolean} isCurrent Whether the index is a sorted index. The default is false, which is the original index
   */
    getRowData (rowIndex, isCurrent = false) {
      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let row
        if (isCurrent) {
          row = this.tableData.rows[rowIndex]
        } else {
          row = this.tableData.rows.find(r => { return r.index === rowIndex })
        }
        return this.getRowDataFromTableRow(row)
      }
      return []
    },
    /**
   * @function Get the latest data of the specified Cell according to the row and column index
   * @param {Number} rowIndex
   * @param {Number} columnIndex
   * @param {Boolean} isCurrent Whether the row index is a sorted index. The default is false, which is the original index
   */
    getCellData (rowIndex, columnIndex, isCurrent = false) {
      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let row
        if (isCurrent) {
          row = this.tableData.rows[rowIndex]
        } else {
          row = this.tableData.rows.find(r => { return r.index === rowIndex })
        }
        if (!(row && unemptyArray(row.cells))) return ''

        let cell = row.cells[columnIndex]
        if (cell && typeof cell.data !== 'undefined') return cell.data
        return ''
      }
      return ''
    },
    /**
   * @function Get the data of the row according to tableRow (internal row object). { key: 'xxx', cells:[ ... ] } ==> [ ... ]
   * @param {Number} tableRow Internal row object. { key: 'xxx', cells:[ ... ] }
   */
    getRowDataFromTableRow (tableRow) {
      let rowData = []
      if (!(tableRow && unemptyArray(tableRow.cells))) return rowData

      for (let i = 0; i < tableRow.cells.length; i++) {
        let cellData = tableRow.cells[i].data
        if (typeof cellData === 'undefined') cellData = ''
        rowData.push(cellData)
      }
      return rowData
    },
    /**
   * @function Get a collection of data objects containing only the selected row, the row data is the internally converted object: {Object} tableRow
   */
    getCheckedRows () {
      if (!this.showCheck) return []

      if (this.tableData && unemptyArray(this.tableData.rows)) {
        return this.tableData.rows.filter((row, index) => {
          if (index === 0 && this.headerInfirstRow) return false
          return row.checked
        })
      }

      return []
    },
    /**
   * @function Whether all rows are selected
   */
    isAllRowChecked () {
      if (!this.showCheck) return false

      if (this.tableData && unemptyArray(this.tableData.rows)) {
        return this.tableData.rows.every((row, index) => {
          if (index === 0 && this.headerInfirstRow) return true
          return row.checked
        })
      }

      return false
    },
    /**
   * @function Set all rows selected state
   * @param {Boolean} checked true/false
   */
    setAllRowChecked (checked) {
      if (this.tableData && unemptyArray(this.tableData.rows)) {
        this.tableData.rows.forEach((row, index) => {
          row.checked = !!checked
        })
      }
    },
    /**
   * @function Set the selected state of the specified row
   * @param {Array} rows Specified line
   * @param {Boolean} checked true/false
   */
    setRowChecked (rows, checked = true) {
      if (!(Array.isArray(rows) && rows.length > 0)) return

      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let checkedRows = 0

        this.tableData.rows.forEach((row, index) => {
          if (index === 0 && this.headerInfirstRow) return
          if (rows.includes(row.index)) {
            row.checked = !!checked
          }
          checkedRows += Number(!!row.checked)
        })

        if (this.headerInfirstRow) {
          if (checkedRows === (this.tableData.rows.length - 1)) {
            this.tableData.rows[0].checked = true
          } else if (checkedRows > 0) {
            this.tableData.rows[0].checked = 'line'
          } else {
            this.tableData.rows[0].checked = false
          }
        }
      }
    },
    /**
   * @function Number of rows currently displayed
   */
    getActivatedRowNum (includeWhenHeaderInfirstRow = false) {
      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let num = 0
        this.tableData.rows.forEach((row, index) => {
          if (index === 0 && this.headerInfirstRow) {
            if (!includeWhenHeaderInfirstRow) return
            return (num++)
          }
          if (row.show && !row.filtered) num++
        })
        return num
      }

      return 0
    },
    /**
   * @function Number of columns
   */
    getColumnNum () {
      if (this.tableData && unemptyArray(this.tableData.rows)) {
        let row = this.tableData.rows[0]
        return row.cells.length
      }
      return 0
    },
    /**
     * @function Horizontal scroll event
     */
    onScrollX (pos) {
      if (pos.right) {
        this.scrollx = 'right'
      } else if (pos.left) {
        this.scrollx = 'left'
      } else {
        this.scrollx = 'middle'
      }
      this.headerLeft = pos.value
      if (this.bodyViewerWidth > 0) {
        this.hMovement = pos.value / this.bodyViewerWidth * 100
      } else {
        this.hMovement = 0
      }
    },
    /**
     * @function Vertical scroll event
     */
    onScrollY (pos) {
      if (pos.top) {
        this.scrolly = 'top'
      } else if (pos.bottom) {
        this.scrolly = 'bottom'
      } else {
        this.scrolly = 'middle'
      }
      this.fixedTop = pos.value
    },
    onSize (size) {
      this.bodyViewerWidth = size.viewerWidth
      this.bodyWidth = size.wrapperWidth
    },
    /**
     * @function Fixed column mouse scroll event
     */
    onFixedScroll (e) {
      if (!(this.fixedWidth > 0)) return
      if (!(this.$refs.fixedBody && this.$refs.fixedBodyInner)) return
      if (!this.$refs.scrollbar) return

      let viewerHeight = this.$refs.fixedBodyInner.clientHeight
      let wrapperHeight = this.$refs.fixedBody.clientHeight

      setTimeout(() => {
        let scrollY = e.deltaY > 0 ? this.scrollStep : -(this.scrollStep)
        let nextY = this.fixedTop + scrollY

        if (viewerHeight > wrapperHeight) {
          this.$refs.scrollbar.scrollToY(nextY)
        }
      }, 10)
    },
    onChangePosition (movement) {
      let next = movement / 100
      this.$refs.scrollbar.scrollToX(next * this.bodyViewerWidth)
    }
  },
  components: { VueInput, FilterPanel, ContextMenu, VuePagination, VueScrollbar, HorizontalScrollbar }
}
</script>

<style lang="scss" scoped>

$textColor: rgba(0,0,0,0.85);
$normalColor: rgba(0,0,0,0.65);
$disabledColor: rgba(0,0,0,0.25);
$borderColor: rgba(217,217,217,1);
$activeColor: #046FDB;
$fontFamily: Arial, Helvetica, sans-serif;

.v-table-dynamic{
  width: 100%;
  display: block;
  box-sizing: border-box;
  font-family: $fontFamily;
  font-size: 13px;
  color: $textColor;
  padding-bottom: 10px;
  overflow: hidden;
}
.v-table{
  position: relative;
  box-sizing: border-box;
  border: none;
}
.v-table::before{
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  z-index: 1;
  border-bottom: 1px solid $borderColor;
}
.v-table.v-show-border{
  border-top: 1px solid $borderColor;
}
.v-table-left-line, .v-table-right-line{
  position: absolute;
  top: 0;
  height: 100%;
  width: 1px;
  z-index: 1;
}
.v-table-left-line{
  left: 0;
  border-left: 1px solid $borderColor;
}
.v-table-right-line{
  right: 0;
  border-right: 1px solid $borderColor;
}

.v-table-scrollbar{
  position: absolute;
  width: 100%;
  left: 0;
  bottom: -8px;
  height: 8px;
  background: transparent;
}

.v-table-header-wrap{
  display: block;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.v-table-loader {
  overflow: hidden;
  width: 100%;
  height: 3px;
}

.v-linear-activity {
  overflow: hidden;
  width: 100%;
  height: 3px;
  background-color: #B3E5FC;
  margin: 0 auto;
}

.v-line {
  position: relative;
  width: 100%;
  height: 100%;
}

.v-line:before {
  content: '';
  position: absolute;
  height: 100%;
  background-color: #03A9F4;
  animation: line_first 1.5s infinite ease-out;
}

.v-line:after {
  content: '';
  position: absolute;
  height: 100%;
  background-color: #4FC3F7;
  animation: line_second 1.5s infinite ease-in;
}

@keyframes line_first {
  0% {
    left: -100%;
    width: 100%;
  }
  100% {
    left: 100%;
    width: 10%;
  }
}

@keyframes line_second {
  0% {
    left: -150%;
    width: 100%;
  }
  100% {
    left: 100%;
    width: 10%;
  }
}

.v-table-fixed{
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  box-sizing: border-box;
  z-index: 2;
  overflow: hidden;
  border-bottom: 1px solid $borderColor;
}
.v-table-fixed.is-show-shadow{
  -webkit-box-shadow: 1px 0px 6px rgba(0,0,0,.12);
  box-shadow: 1px 0px 6px rgba(0,0,0,.12);
}
.v-table-body-fixed{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.v-table-row{
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid $borderColor;
  background-color: #FFFFFF;
}
.v-table-row.is-header{
  overflow: hidden;
}
.v-table-row.is-header, 
.table-cell.is-header {
  font-weight: 600;
}
.v-table-row.is-striped{
  background-color: #F9F9F9;
}
.v-table-row.is-hovering{
  background-color: #F3F5F7;
}

.table-check{
  box-sizing: border-box;
  height: 100%;
  padding: 0 8px;
  overflow: hidden;
  -webkit-flex: 0 0 50px;
  -ms-flex: 0 0 50px;
  flex: 0 0 50px;
  border: none;
}

.table-check-all,
.table-check-row{
  box-sizing: border-box;
  height: 12px;
  width: 12px;
  font-weight: 400;
  color: $textColor;
  border: 1px solid $borderColor;
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
  i.iconfont{
    font-size: 12px;
  }
}
.table-check-all:hover,
.table-check-row:hover{
  border-color: $activeColor;
}
.table-check-all.is-checked,
.table-check-row.is-checked{
  border-color: $activeColor;
  background-color: $activeColor;
  color: #FFFFFF;
}

.table-cell{
  box-sizing: border-box;
  height: 100%;
  padding: 0 8px;
  overflow: hidden;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  border: none;
}

.table-check.v-show-border,
.table-cell.v-show-border{
  border-left: 1px solid $borderColor;
}

.table-cell-inner{
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  border: none;
}

.table-cell-content{
  box-sizing: border-box;
  min-width: 12px;
  min-height: 10px;
  outline: 0;
  text-align:left;
}
.table-cell-content.fill-width{
  width: 100%;
}

.table-cell-content{
  position: relative;
  overflow: hidden;
}

.v-table-tools{
  padding: 8px 0px;
}

.tools-search{
  width: 280px;
  margin-right: 8px;
}

.table-sort{
  width: 20px;
  margin-left: 2px;
  position: relative;
  vertical-align: middle;
  .sort-btns{
    width: 0;
    height: 0;
    border: 5px solid transparent;
    position: absolute;
    left: 5px;
    cursor: pointer;
  }
  .sort-ascending{
    border-bottom-color: #C0C4CC;
    top: 4px;
  }
  .sort-descending{
    border-top-color: #C0C4CC;
    bottom: 4px;
  }
  .sort-ascending.activated{
    border-bottom-color: $activeColor;
  }
  .sort-descending.activated{
    border-top-color: $activeColor;
  }
}

.table-filter{
  position: relative;
  margin-left: 2px;
  line-height: 100%;
  vertical-align: middle;
  cursor: pointer;
  color: $normalColor;
  i.iconfont{
    font-size: 12px;
  }
  i.iconfont.activated{
    color: $activeColor;
  }
}

.table-pagination{
  padding: 0px;
  padding-top: 10px;
}

.row-actions {
  box-sizing: border-box;
  height: 100%;
  line-height: 100%;
  overflow: hidden;
  -webkit-flex: 0 0 30px;
  -ms-flex: 0 0 30px;
  flex: 0 0 30px;
  border: none;
}

.more-dots {
  display: inline-block;
  cursor: pointer;
  opacity: 0;
  width: 20px;
  height: 20px;
  background-repeat: no-repeat;
  background: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="3.29037" r="1.91706"/><circle cx="10" cy="10" r="1.91706"/><circle cx="10" cy="16.70963" r="1.91706"/></svg>');
}

.v-table-row:hover .more-dots {
  opacity: .6;
}

.v-table-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(255,255,255,.6);
  z-index: 99999;
}
</style>
