import _ from 'lodash'

export default class Index {
  constructor (quill, options) {

    this.quill = quill
    this.options = options

    this.onSelectionChange = this.onSelectionChange.bind(this)
    this.updateCursor = this.updateCursor.bind(this)
    this.onTextChange = this.onTextChange.bind(this)

    this.quill.on('selection-change', this.onSelectionChange)
    this.quill.on('text-change', this.onTextChange)

    this.container = this.quill.addContainer('ql-my-cursor')
    this.cursorElement = null

    this.display = false

    this.setupViews()

  }

  setupViews () {

    this.cursorElement = document.createElement('div')
    this.cursorElement.classList.add('livex-my-cursor')

    this.cursorElement.style.position = 'absolute'
    this.cursorElement.style.top = `0px`
    this.cursorElement.style.left = '0px'
    this.cursorElement.style.width = '2px'
    this.cursorElement.style.height = '15px'
    this.cursorElement.style.background = '#000'
    this.cursorElement.style.display = 'none'

    this.container.appendChild(this.cursorElement)

  }

  updateCursor (range, display = true) {

    if (display === false) {
      this.cursorElement.style.display = 'none'
      return
    }

    if (_.get(range, 'length') > 0) {
      this.cursorElement.style.display = 'none'
      console.log('hide cursor')
      return
    }

    clearTimeout(this._timeout)

    this._timeout = setTimeout(() => {

      const bound = this.quill.getBounds(range.index)

      const top = _.get(bound, 'top', 0)
      const left = _.get(bound, 'left', 0)
      this.cursorElement.style.top = `${top}px`
      this.cursorElement.style.left = `${left}px`
      this.cursorElement.style.display = 'block'

    }, 100)

  }

  /**
   * Event selection editor change
   * @param range
   */
  onSelectionChange (range, oldRange, source) {

    const rangeIndex = _.get(range, 'index')
    if (source === 'user' && typeof rangeIndex !== 'undefined' && rangeIndex !==
      null) {
      this.updateCursor(range)
    }
  }

  onTextChange (delta, oldDelta, source) {
    this.updateCursor(null, false)
  }

}