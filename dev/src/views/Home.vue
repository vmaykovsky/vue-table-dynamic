<template>
  <div class="home">
    <header>
      <nav-menu></nav-menu>
    </header>
    <aside>
      <vuescroll :ops="scrollBarOpts" ref="vuescroll">
        <vue-button class="aside-btns" size="mini" @click="getToggleLoader">Toggle Loader</vue-button>
        <vue-button class="aside-btns" size="mini" @click="getToggleRemoteData">Toggle Remote Data</vue-button>
        <div class="aside-line"></div>
        <vue-button class="aside-btns" size="mini" @click="addRow">Add Row</vue-button>
        <vue-button class="aside-btns" size="mini" @click="deleteRow">Delete Row</vue-button>
        <vue-button class="aside-btns" size="mini" @click="addColumn">Add Column</vue-button>
        <vue-button class="aside-btns" size="mini" @click="deleteColumn">Delete Column</vue-button>
        <div class="aside-line"></div>
        <vue-button class="aside-btns" size="mini" @click="fixedHeader">Fixed Header</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleHeader">Toggle Header</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleBorder">Toggle Border</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleStripe">Toggle Stripe</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleHighlight">Toggle Highlight</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleSelect">Toggle Select</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleSearch">Toggle Search</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleFilter">Toggle Filter</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleSort">Toggle Sort</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleEdit">Toggle Edit</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleFixed">Toggle Fixed Column</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleSlot">Toggle Slot</vue-button>
        <div class="aside-line"></div>
        <vue-button class="aside-btns" size="mini" @click="togglePagination">Toggle Pagination</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toPage">To Random Page</vue-button>
        <vue-button class="aside-btns" size="mini" @click="toggleLanguage">Toggle language</vue-button>
        <div class="aside-line"></div>
        <vue-button class="aside-btns" size="mini" @click="changeColumnWidth">Change Column Width</vue-button>
        <vue-button class="aside-btns" size="mini" @click="changeHeaderHeight">Change Header Height</vue-button>
        <vue-button class="aside-btns" size="mini" @click="changeRowHeight">Change Row Height</vue-button>
        <div class="aside-line"></div>
        <vue-button class="aside-btns" size="mini" @click="getData">Get Data</vue-button>
        <vue-button class="aside-btns" size="mini" @click="getCheckedRowDatas">Checked Row Data</vue-button>
      </vuescroll>
    </aside>
    <section>
      <vuescroll :ops="scrollBarOpts" ref="vuescroll">
        <vue-table-dynamic 
          :params="params"
          @select="onSelect"
          @select-all="onSelectAll"
          @selection-change="onSelectionChange"
          @row-click="onRowClick"
          @cell-click="onCellClick"
          @cell-contextmenu="onCellContextmenu"
          @download="onDownload"
          ref="table"
        >
          <template v-if="useSlot" v-slot:column-0="{ props }">
            <span class="cell--slot-1">Slot::{{props.cellData}}--{{props.row}}--{{props.column}}</span>
          </template>
          <template v-slot:column-4="{ props }">
            {{props.cellData instanceof Date ? props.cellData.toLocaleString() : props.cellData}}
          </template>
          <template v-if="useSlot"  v-slot:column-5="{ props }">
            <span class="cell--slot-2">
              <vue-button class="aside-btns aside-btns-slot" size="mini" @click.stop="testSlot(props)">Test Slot1</vue-button>
              <vue-button class="aside-btns" type="text" size="mini" @click.stop="testSlot(props)">Test Slot2</vue-button>
            </span>
          </template>
          <template v-slot:top-toolbar>
            <button class="btn btn-primary">Create</button>
          </template>
        </vue-table-dynamic>
      </vuescroll>
    </section>
    <vue-msg :timeout="2000" :top="100" :right="20" ref="vueMsg"></vue-msg>
  </div>
</template>

<script>
import VueTableDynamic from '../../../src/components/VueTableDynamic.vue'
import NavMenu from './NavMenu.vue'
import VueButton from './VueButton.vue'
import VueMsg from 'vue-msgs'
import vuescroll from 'vuescroll'
import { saveAs } from 'file-saver'
import { table, getBorderCharacters } from 'table'
const cloneDeep = require('lodash.clonedeep')

const random = (length) => {
  if (!(length > 0 && length < 10)) length = 5
  let num = parseInt(Date.now() + Math.random() * 10000000)
  return num.toString(16).slice(0 - length)
}

const randomBoolean = () => Math.random() >= 0.5;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function compare(a, operator, b) {
  const aa = typeof a === 'number' ? a : String(a).toLowerCase();
  const bb = typeof b === 'number' ? b : String(b).toLowerCase();

  switch(operator) {
    case '$eq':
      return aa === bb;
    case '$ne':
      return aa !== bb;
    case '$gt':
      return aa > bb;
    case '$gte':
      return aa >= bb;
    case '$lt':
      return aa < bb;
    case '$lte':
      return aa <= bb;
    case '$sw':
      return aa.startsWith(bb);
    case '$ew':
      return aa.endsWith(bb);
    case '$between':
      return aa >= bb.start && a <= bb.end;
    default:
      return false;
  }
}

function removeHeader(rows) {
  return rows.filter(row => {
    if (JSON.stringify(row) === JSON.stringify(['Index', 'Data1', 'Data2', 'Data3'])) {
      return false;
    }

    return true;
  });
}

function filterRowsBySearch(rows, searchValue) {
  if (!searchValue || !searchValue.trim()) {
    return rows;
  }

  return rows.filter(row => {
    return row.some(cell => String(cell).toLowerCase().includes(searchValue.toLowerCase()));
  });
}

function filterRows(rows, filter) {
  let result = rows.map((r, ix) => ({ _rid: ix, row: r }));
  Object.keys(filter).map(key => filter[key]).forEach((f, ix) => {
    let accumulated = [];
    const checked = f.content.filter(i => i.checked);
    if (!checked.length) {
      return;
    }

    checked.forEach(i => {
      accumulated = accumulated.concat(result.filter(r => (compare(r.row[f.column], f.operator, i.value))));
    });

    const uniqueRid = [...new Set(accumulated.map(i => i._rid))];
    result = uniqueRid.map(i => accumulated.find(k => k._rid === i));
  });

  return result.map(i => i.row);
}

function sortRows(rows, sort) {
  return rows.sort((a, b) => {
    if (a[sort.columnIndex] === b[sort.columnIndex]) { return 0; }
    else if(sort.order === 'ascending') { return a[sort.columnIndex] > b[sort.columnIndex] ? 1 : -1 }
    else if(sort.order === 'descending') { return b[sort.columnIndex] > a[sort.columnIndex] ? 1 : -1 }
  });
}

function paginateRows(rows, page, pageSize) {
  const skip = (page - 1) * pageSize;
  return rows.slice(skip, skip + pageSize);
}

const rowContextMenu = [];
for (let i = 0; i < 200; i++) {
  if ((i + 1) % 3 === 0) {
    rowContextMenu.push([]);
    continue;
  }

  rowContextMenu.push([
    { text: `Num ${i + 1}`, value: i + 1, hidden: false, disabled: true, },
    { text: 'Edit data', value: 'edit', hidden: randomBoolean(), disabled: randomBoolean(), },
    { text: 'Copy item', value: 'copy', hidden: randomBoolean(), disabled: randomBoolean(), },
    { text: 'Share item', value: 'share', hidden: randomBoolean(), disabled: randomBoolean(), },
    { text: 'Remove item', value: 'remove', hidden: randomBoolean(), disabled: randomBoolean(), },
  ]);
}

async function emulateRemoteData(rows, searchValue, filter, sort, page, pageSize) {
  await timeout(1000);
  let result = removeHeader(rows);
  result = filterRowsBySearch(result, searchValue);
  result = filterRows(result, filter);
  result = sortRows(result, sort);
  const totalItems = result.length;
  result = paginateRows(result, page, pageSize);

  const uniqueIndexes = result.map(i => i[0]);
  const contextMenu = rowContextMenu.filter(i => uniqueIndexes.includes(i[0].value));

  return {
    totalItems,
    data: [['Index', 'Data1', 'Data2', 'Data3', 'Date']].concat(result),
    contextMenu,
  };
}

const defaultTableParams = {
  data: [
    ['Index', 'Data1', 'Data2', 'Data3', 'Date']
  ],
  header: 'row',
  height: '',
  headerHeight: 30,
  rowHeight: 30,
  // wordWrap: 'break-word',
  // whiteSpace: 'normal',
  // textOverflow: 'clip',
  border: true,
  stripe: true,
  showCheck: true,
  enableSearch: true,
  // activedColor: '#046FDB',
  headerBgColor: '#efefef',
  columnWidth: [{column: 0, width: 120}, {column: 1, width: 150}, {column: 2, width: 'auto' }, {column: 3,  width: 200}],
  // fixed: 1,
  sort: [0, { 
    column: 1, 
    ascending: (a, b) => { return parseInt(a) > parseInt(b) ? 1 : -1 }, 
    descending: (a, b) => { return parseInt(b) > parseInt(a) ? 1 : -1 } 
    }
  ],
  edit: {},
  highlight: {},
  filter: [
    {
      column: 0,
      type: 'radio',
      operator: '$gt',
      content: [{text: '> 20', value: 20}, {text: '> 50', value: 50}, {text: '> 100', value: 100}], 
      method: (value, tableCell) => { return tableCell.data > value }
    },
    {
      column: 2,
      operator: '$ew',
      content: [{text: '*1-Cell', value: '1-Cell'}, {text: '*2-Cell', value: '2-Cell'}, {text: '*3-Cell', value: '3-Cell'}], 
      method: (value, tableCell) => { return String(tableCell.data).toLocaleLowerCase().endsWith(String(value).toLocaleLowerCase()) }
    },
    {
      column: 4,
      type: 'daterange',
      operator: '$between',
      content: [{ text: 'Date range', value: { start: new Date((new Date()).getTime() - 10*24*60*60*1000), end: new Date() }}],
      method: (value, tableCell) => {
        const cellData = tableCell.data instanceof Date ? tableCell.data : new Date(tableCell.data);
        return cellData >= value.start && cellData <= value.end;
      }
    },
  ],
  // style: {
  //   row: [{ scope: [0], styles: { color: '#046FDB'}}]
  // },
  pagination: true,
  // showTotal: true,
  // pageSize: 20,
  // pageSizes: [5, 15, 30, 50, 100],
  language: '',

  // remote data handlers
  remoteDataSource: true,
  remoteDataHandler: async function(searchValue, filter, sort, page, pageSize) {
    return emulateRemoteData(this.params.data, searchValue, filter, sort, page, pageSize);
  },
}

for (let i = 0; i < 200; i++) {
  defaultTableParams.data.push([i+1, `${random()}-Cell`, `${random()}-Cell`, `${random()}-Cell`, randomDate(new Date(2020, 0, 1), new Date())]);
}

defaultTableParams.rowContextMenu = rowContextMenu;

const tableHeaderTypes = ['', 'row', 'column'];

export default {
  name: 'Home',
  data() {
    return {
      params: cloneDeep(defaultTableParams),
      scrollBarOpts: {
        scrollPanel: { scrollingX: false },
        bar: { background: '#DFDFDF', opacity: 0.8 }
      },
      widthIncrement: 1,
      heightIncrement: 1,
      rowHeightIncrement: 1,
      useSlot: false
    }
  },
  methods: {
    addRow () {
      let rowNum = this.params.data.length
      let columnNum = this.params.data[0].length
       
      if (rowNum >= 200) {
        return this.showMsg('warning', 'The number of rows cannot be more than 200.')
      }

      let newRow = [rowNum]
      for (let i = 1; i < columnNum; i++) {
        newRow.push(`${random()}-Cell`)
      }

      this.params.data.push(newRow)
    },
    deleteRow () {
      let rowNum = this.params.data.length

      if (rowNum <= 1) {
        return this.showMsg('warning', 'The number of rows cannot be less than 1.')
      }

      this.params.data.pop()
    },
    addColumn () {
      let rowNum = this.params.data.length
      let columnNum = this.params.data[0].length

      if (columnNum >= 12) {
        return this.showMsg('warning', 'The number of columns cannot be more than 12.')
      }

      this.params.data[0].push(`Data${columnNum}`)
      for (let i = 1; i < rowNum; i++) {
        this.params.data[i].push(`${random()}-Cell`)
      }
    },
    deleteColumn () {
      let rowNum = this.params.data.length
      let columnNum = this.params.data[0].length

      if (columnNum <= 1) {
        return this.showMsg('warning', 'The number of columns cannot be less than 1.')
      }

      for (let i = 0; i < rowNum; i++) {
        this.params.data[i].pop()
      }
    },
    toggleHeader () {
      let curr = tableHeaderTypes.indexOf(this.params.header)
      if (curr < 0 || curr === (tableHeaderTypes.length - 1)) return this.params.header = tableHeaderTypes[0]

      this.params.header = tableHeaderTypes[curr + 1]
    },
    fixedHeader () {
      if (this.params.height) {
        this.params.height = ''
      } else {
        this.params.height = 240
      }
    },
    toggleBorder () {
      this.params.border = !this.params.border
    },
    toggleStripe () {
      this.params.stripe = !this.params.stripe
    },
    toggleHighlight () {
      if (Object.keys(this.params.highlight).length > 0) {
        this.params.highlight = {}
      } else {
        this.params.highlight = { column: [-1] }
      }
    },
    toggleSelect () {
      this.params.showCheck = !this.params.showCheck
    },
    toggleSearch () {
      this.params.enableSearch = !this.params.enableSearch
    },
    toggleFilter () {
      if (this.params.filter.length > 0) {
        this.params.filter = []
      } else {
        this.params.filter = [{
          column: 0, 
          content: [{text: '> 3', value: 3}, {text: '> 5', value: 5}, {text: '> 7', value: 7}], 
          method: (value, tableCell) => { return tableCell.data > value }
        }, {
          column: 2, 
          content: [{text: '1-Cell', value: '1-Cell'}, {text: '2-Cell', value: '2-Cell'}, {text: '3-Cell', value: '3-Cell'}], 
          method: (value, tableCell) => { return String(tableCell.data).toLocaleLowerCase().includes(String(value).toLocaleLowerCase()) }
        }]
      }
    },
    toggleSort () {
      if (this.params.sort.length > 0) {
        this.params.sort = []
      } else {
        this.params.sort = [0, 1]
      }
    },
    toggleEdit () {
      if (Object.keys(this.params.edit).length > 0) {
         this.params.edit = {}
      } else {
        this.params.edit = {
          row: [0, 1],
          column: [1, 2],
          cell: [[3, 3]]
        }
      }
    },
    toggleFixed () {
      if (typeof this.params.fixed === 'number') {
        this.params.fixed = ''
      } else {
        this.params.fixed = 1
      }
    },
    toggleSlot () {
      this.useSlot = !this.useSlot
    },
    togglePagination () {
      this.params.pagination = !this.params.pagination
    },
    toPage () {
      if (this.$refs && this.$refs.table) {
        let target = Math.floor(Math.random() * 5 + 1)
        this.$refs.table.toPage(target)
      }
    },
    toggleLanguage () {
      if (!this.params.language) return this.params.language = 'zh_CN'

      if (this.params.language === 'zh_CN') {
        this.params.language = 'en_US'
      } else {
        this.params.language = 'zh_CN'
      }
    },
    changeColumnWidth () {
      if (this.params.columnWidth[0].width >= 200) {
        this.widthIncrement = -1
      } else if (this.params.columnWidth[0].width <= 50) {
        this.widthIncrement = 1
      }
      this.params.columnWidth[0].width += 10 * this.widthIncrement
    },
    changeHeaderHeight () {
      if (this.params.headerHeight >= 80) {
        this.heightIncrement = -1
      } else if (this.params.headerHeight <= 30) {
        this.heightIncrement = 1
      }
      this.params.headerHeight += 5 * this.heightIncrement
    },
    changeRowHeight () {
      if (this.params.rowHeight >= 80) {
        this.rowHeightIncrement = -1
      } else if (this.params.rowHeight <= 30) {
        this.rowHeightIncrement = 1
      }
      this.params.rowHeight += 5 * this.rowHeightIncrement
    },
    getData () {
      if (this.$refs && this.$refs.table) {
        console.log('[ getData ] ', this.$refs.table.getData())
      }
    },
    getCheckedRowDatas () {
      if (this.$refs && this.$refs.table) {
        console.log('[ getCheckedRowDatas ] ', this.$refs.table.getCheckedRowDatas())
        console.log('[ getCheckedRowIndexs ] ', this.$refs.table.getCheckedRowIndexs())
        console.log('[ getCheckedRowNum ] ', this.$refs.table.getCheckedRowNum())
        console.log('[ isAllRowChecked ] ', this.$refs.table.isAllRowChecked())
      }
    },
    getToggleLoader() {
      if (this.$refs && this.$refs.table) {
        this.$refs.table.isLoading = !this.$refs.table.isLoading;
      }
    },
    getToggleRemoteData() {
      const remoteData = this.params.remoteDataSource || false;
      this.reset();
      this.params.remoteDataSource = !remoteData;
    },
    reset () {
      this.params = cloneDeep(defaultTableParams)
    },
    onSelect (checked, index, data) {
      console.log('onSelect: ', checked, index, data)
    },
    onSelectAll (isCheckedAll) {
      console.log('onSelectAll: ', isCheckedAll)
    },
    onSelectionChange (checkedDatas, checkedIndexs, checkedNum) {
      console.log('onSelectionChange: ', checkedDatas, checkedIndexs, checkedNum)
    },
    onRowClick (index, data) {
      console.log('[ onRowClick ] : ', index, data)
    },
    onCellClick (rowIndex, columnIndex, data) {
      console.log('[ onCellClick ]: ', rowIndex, columnIndex, data)
    },
    onCellContextmenu (rowIndex, columnIndex, data) {
      console.log('[ onCellContextmenu ]: ', rowIndex, columnIndex, data)
    },
    onDownload (datas) {
      if (!(datas && datas.length > 0)) {
        return this.showMsg('warning', 'The data is empty.')
      }

      let output = table(datas, { 
        border: getBorderCharacters(`void`),
        columnDefault: {
          paddingLeft: 0,
          paddingRight: 2
        },
        drawHorizontalLine: () => { return false }
      })

      let blob = new Blob([output], {type: "application/octet-stream"})
      saveAs(blob, "table")
    },
    testSlot (slotData) {
      console.log('testSlot ', slotData)
    },
    // 消息弹框 type：success/info/warning/error
    showMsg (type, info) {
      if (this.$refs && this.$refs.vueMsg && typeof this.$refs.vueMsg.showMsg === 'function') {
        this.$refs.vueMsg.showMsg(type, info)
      }
    }
  },
  components: { NavMenu, VueButton, VueMsg, vuescroll, VueTableDynamic }
}
</script>

<style lang="scss" scoped>
.home{
  height: 100%;
  width: 100%;
  min-width: 500px;
  position: relative;
  header {
    width: 100%;
    height: 70px;
  }
  aside{
    position: absolute;
    top: 70px;
    bottom: 0;
    left: 0;
    width: 140px;
    padding: 30px;
    background-color: rgb(33,37,43);
    border-right: 1px solid rgb(33,37,43);
    .aside-btns{
      display: block;
      width: 100%;
      margin-top: 12px;
      font-size: 12px;
      font-family: Arial;
    }
    .aside-line{
      display: block;
      width: calc(100% + 10px);
      margin: 12px -5px 6px -5px;
      border-bottom: 1px solid rgb(127, 130, 139);
    }
  }
  section {
    position: absolute;
    top:70px;
    bottom: 0;
    left: 200px;
    right: 0;
    padding: 20px 25px;
  }
  .downloader{
    height: 0;
    width: 0;
    visibility: hidden;
  }
}

.aside-btns-slot{
  margin-right: 10px;
}
</style>
<style>
.cell--slot-1, .cell--slot-2{
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


</style>