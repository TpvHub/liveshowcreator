import _ from 'lodash'
import { store } from '../../store'
import {
  EDIT_GFX,
  // SET_GFX_SELECT
} from '../../redux/types'
import { toggleSidebar, toggleInactiveGfxList, toggleMiniPlayer } from '../../redux/actions'
import { Map } from 'immutable'
import { statusColors } from '../../config'

export default class QuillGfx {
  constructor (quill, options) {

    this.quill = quill
    this.options = options

    this.onSelectionChange = this.onSelectionChange.bind(this)
    this.quill.on('selection-change', this.onSelectionChange)
    this.updateNumbers = this.updateNumbers.bind(this)
    this.renderNumbers = this.renderNumbers.bind(this)

    this.container = this.quill.addContainer('ql-gfx-numbers')
    this.numbers = new Map()

  }

  updateNumbers (items) {

    this.numbers = this.numbers.clear()
    _.each(items, (item, i) => {

      const range = {
        index: _.get(item, 'index', 0),
        length: _.get(item, 'length', 0)
      }

      const bound = this.quill.getBounds(range)

      const top = _.get(bound, 'top')

      let numbers = this.numbers.get(top)

      const value = {
        index: (i + 1),
        item: item,
        bound: bound
      }

      if (numbers) {
        numbers.push(value)
      } else {
        numbers = [value]
      }

      this.numbers = this.numbers.set(top, numbers)

    })
    this.renderNumbers()

  }

  getColor (status) {

    const statusClassName = _.join(_.split(_.toLower(_.trim(status)), ' '), '-')
    return _.get(statusColors, statusClassName, statusColors.default)
  }

  renderNumbers () {

    const fragmentElement = document.createDocumentFragment()

    this.numbers.forEach((item) => {

      const containerElement = document.createElement('div')
      containerElement.classList.add('gfx-index-container')

      let topPx = _.get(item, '[0].bound.top', 0)
      containerElement.style.top = `${topPx}px`
      containerElement.style.position = 'absolute'
      containerElement.style.left = '30px'
      containerElement.style.height = '20px'
      containerElement.style.maxWidth = `${item.length * 25}px`

      _.each(item, (i) => {

        const color = this.getColor(_.get(i.item, 'data.status'))

        const numberElement = document.createElement('span')
        numberElement.classList.add('gfx-index-number')
        numberElement.textContent = `${i.index}`
        numberElement.setAttribute('title', _.get(i, 'item.data.title', ''))
        numberElement.style.color = '#000'
        numberElement.style.display = 'inline'
        numberElement.style.borderBottom ='solid 2px'
        numberElement.style.borderColor = _.get(color, 'background', '#dddddd')
        numberElement.style.marginRight ='.2em'
        numberElement.onclick = () => {
          this.quill.setSelection(i.item.index, i.item.length, 'user')
        }

        containerElement.appendChild(numberElement)

      })

      fragmentElement.appendChild(containerElement)

    })

    if (this.container.childNodes.length) {
      this.container.innerHTML = ''
    }

    this.container.appendChild(fragmentElement)

  }

  /**
   * Event selection editor change
   * @param range
   */
  onSelectionChange (range, oldRange, source) {

    const rangeIndex = _.get(range, 'index')
    if (source === 'user' && typeof rangeIndex !== 'undefined' && rangeIndex !==
      null) {
      let currentSelectedFormat = this.quill.getFormat(range)

      // Try to get the Gfx if click >
      if (!_.get(currentSelectedFormat, 'livex')) {
        currentSelectedFormat = this.quill.getFormat({...range, index: range.index+1})
      }

      const livexBot = _.get(currentSelectedFormat, 'livex')
      let botType = Array.isArray(livexBot)
        ? _.get(livexBot, '[0].type')
        : _.get(
          livexBot, 'type')

      if (botType === 'gfx') {
        const formatData = _.get(currentSelectedFormat, 'livex')

        // show the Edit form GFX

        const payload = Array.isArray(formatData)
          ? _.get(formatData, '[0].payload')
          : _.get(formatData, 'payload')

        // Open sidebar
        const state = store.getState()
        if (!state.sidebar.open) store.dispatch(toggleSidebar(true))
        store.dispatch(toggleInactiveGfxList, toggleMiniPlayer(false))

        //let select and edit mode
        store.dispatch({
          type: EDIT_GFX,
          payload: _.get(payload, 'id'),
        })

        // Open miniplayer + drive
        store.dispatch(toggleMiniPlayer(true))
      }
      else {
        // unset GFX Edit
        store.dispatch({
          type: EDIT_GFX,
          payload: null,
        })
      }
    }

  }
}
