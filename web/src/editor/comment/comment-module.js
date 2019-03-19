import _ from 'lodash'
import { Map } from 'immutable'
import { store } from '../../store'
import {
  EVENT_EMIT,
  ON_HIDE_COMMENT,
  ON_SHOW_ADD_COMMENT, SET_COMMENT_SELECT,
} from '../../redux/types'
import { editorWidth } from '../../config'
import { toggleSidebar } from '../../redux/actions'

export default class QuillComment {

  constructor (quill, options) {

    this.onSelectionChange = this.onSelectionChange.bind(this)
    this.changeAddCommentButtonPosition = this.changeAddCommentButtonPosition.bind(
      this)
    this.handleClickAddComment = this.handleClickAddComment.bind(this)
    this.createCommentSelection = this.createCommentSelection.bind(this)
    this.hideAddCommentButton = this.hideAddCommentButton.bind(this)
    this.updateCommentSelection = this.updateCommentSelection.bind(this)
    this.handleCancelAddComment = this.handleCancelAddComment.bind(this)

    this.quill = quill
    this.options = options
    this.container = this.quill.addContainer('ql-comments')
    // store all comments as map
    this.comments = new Map()
    this.addCommentButton = null
    this.addCommentSelection = null
    this._range = null

    this.createAddCommentButton()
    this.createCommentSelection()
    this.quill.on('selection-change', this.onSelectionChange)

  }

  createAddCommentButton () {
    this.addCommentButton = document.createElement('button')
    this.addCommentButton.onclick = (event) => this.handleClickAddComment(event)
    this.addCommentButton.style.position = 'absolute'
    this.addCommentButton.style.display = 'none'
    this.addCommentButton.style.zIndex = 1250;
    this.addCommentButton.classList.add('ql-add-comment')
    const spanEl = document.createElement('span')
    spanEl.classList.add('md-icon')
    spanEl.appendChild(document.createTextNode('add_comment'))

    this.addCommentButton.appendChild(spanEl)

    this.container.appendChild(this.addCommentButton)
  }

  createCommentSelection () {

    this.addCommentSelection = document.createElement('span')
    this.addCommentSelection.style.position = 'absolute'
    this.addCommentSelection.style.display = 'none'
    this.addCommentSelection.classList.add('ql-comment-selection')

    this.container.appendChild(this.addCommentSelection)

  }

  updateCommentSelection (bound, display = false) {

    return

    // if (!display) {
    //   this.addCommentSelection.style.display = 'none'
    // } else {
    //   const _top = _.get(bound, 'top', 0)
    //   const _left = _.get(bound, 'left', 0)
    //   const _width = _.get(bound, 'width', 0)
    //   const _height = _.get(bound, 'height', 0)
    //   this.addCommentSelection.style.top = `${_top}px`
    //   this.addCommentSelection.style.left = `${_left}px`
    //   this.addCommentSelection.style.width = `${_width}px`
    //   this.addCommentSelection.style.height = `${_height}px`
    //   this.addCommentSelection.style.display = `block`
    // }

  }

  handleCancelAddComment () {
    console.log('Cancel add comment')

    this.updateCommentSelection(null, false)
  }

  /**
   * hide add comment button
   */
  hideAddCommentButton () {
    this.changeAddCommentButtonPosition({}, false)
  }

  /**
   * Handle when user click add comment button
   * @param e
   */
  handleClickAddComment (e) {
    const selection = this.quill.getSelection()
    const _bound = this.quill.getBounds(selection)
    // const top = _.get(_bound, 'top')

    this.updateCommentSelection(_bound, true)
    const containerRect = this.quill.container.getBoundingClientRect()

    const position = {
      top: _.get(_bound, 'top', 0),
      left: _.get(containerRect, 'left', 0) + editorWidth - 400,
    }

    // Hide comment
    store.dispatch({
      type: EVENT_EMIT,
      payload: {
        event: ON_HIDE_COMMENT,
        message: {},
      },
    })

    store.dispatch(toggleSidebar(false))
    store.dispatch({
      type: EVENT_EMIT,
      payload: {
        event: ON_SHOW_ADD_COMMENT,
        message: {
          position: position,
          selection: selection,
          quill: this.quill,
          onCancel: this.handleCancelAddComment,
        },
      },
    })

  }

  onSelectionChange (range, oldRange, source) {

    this._range = range

    if (range !== null) {
      // hide selection
      this.updateCommentSelection(null, false)
    }

    const rangeIndex = _.get(range, 'index')
    if (source === 'user' && typeof rangeIndex !== 'undefined' && rangeIndex !==
      null) {
      const _bound = this.quill.getBounds(range)

      // apply position to add comment button
      let _display = true
      if (!_.get(range, 'length')) {
        _display = false

        // hide comment box
        store.dispatch({
          type: EVENT_EMIT,
          payload: {
            event: ON_HIDE_COMMENT,
            message: {},
          },
        })

        store.dispatch({
          type: SET_COMMENT_SELECT,
          payload: null,
        })

      }

      const containerRect = this.quill.container.getBoundingClientRect()
      const _format = this.quill.getFormat(range)

      //console.log('format current is:', _format)

      const commentData = _.get(_format, 'comment')

      if (commentData) {
        // current is a comment
        _display = false
        // notify show a comment
        let position = {
          top: _.get(_bound, 'top', 0),
          left: _.get(containerRect, 'left', 0) + editorWidth - 400,
        }

        store.dispatch({
          type: SET_COMMENT_SELECT,
          payload: {
            id: _.get(commentData, 'id'),
            position: position,
          },
        })

      }

      this.changeAddCommentButtonPosition({top: _.get(_bound, 'top')}, _display)
    } else {
      this.changeAddCommentButtonPosition({}, false)

    }
  }

  changeAddCommentButtonPosition (style, display = true) {
    this.addCommentButton.style.display = display ? 'block' : 'none'
    const padding = 20
    const left = 826 - padding - 20
    this.addCommentButton.style.left = `${left}px`
    this.addCommentButton.style.top = `${_.get(style, 'top', 0) - 20}px`
  }

}
