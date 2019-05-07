import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import DocumentLayout from '../../layout/document-layout'
import DocumentToolbar from './document-toolbar'
import _ from 'lodash'
import moment from 'moment'
import 'react-quill/dist/quill.snow.css'
import '../../assets/css/toolbar.css'
import styled from 'styled-components'
import QuillEditor, { Quill } from 'react-quill'
import QuillCursors from '../../editor/cursors'
import '../../editor/cursors/style.css'
import QuillComment from '../../editor/comment/comment-module'
import QuillCommentFormat from '../../editor/comment/comment-format'
import QuillLivexFormat from '../../editor/livex-format'
import QuillGfxModule from '../../editor/gfx/gfx-module'
import Cursor from '../../editor/cursor'
import HeadingFormat from '../../editor/heading/heading-format'

import '../../editor/heading/style.css'
import '../../editor/comment/style.css'
import uuid from 'uuid/v1'

import {
  loadDocument,
  subscribe,
  broadcast,
  updateDocument,
  unsubscribe,
  toggleSidebar,
  setGfxItems,
  setCommentItems,
  showContextMenu,
  hideContextMenu,
  togglePrintLayout,
  setDocumentSavedStatus,
  showMessage,
  // toggleCommentItems,
  setHeadingItems,
  addNotificationItem,
  saveNotificationItem,
  loadDocNotifications,
  setNotificationItems,
  setNotificationCounter,
  getUserDocAccess,
  toggleInactiveGfxList,
  toggleDrive,
  copyFilesToNewFolder,
  refreshDrive,
  toggleMiniPlayer,
  showLoadingDialog,
} from '../../redux/actions'
import { getCurrentUser } from '../../redux/selectors'
import AddDocumentComment from './add-document-comment'
import {
  DELETE_INACTIVE_GFX,
  ON_EDITOR_SET_MY_CURSOR,
  ON_EDITOR_SET_SELECTION, ON_REMOVE_FORMAT,
  ON_SUBMIT_ADD_COMMENT,
  ON_SUBMIT_ADD_GFX_CARD, SET_INACTIVE_GFX, SET_LINE_SPACING,
  SET_QUILL, TOGGLE_DOCUMENT_GFX,
} from '../../redux/types'
import DocumentComment from './document-comment'
import DocumentSidebar from './document-sidebar'
import DocumentNavigation from './document-navigation'
import DocumentMiniPlayerAndDrive from './document-mini-player-drive'
import DocumentCinemaView from './document-cinema-view'
import EditorArea from './editor-area'
import EditorContainer from './editor-container'
import ImageHandler from '../../editor/image-handler'
import ContextMenu from './context-menu'

Quill.register('modules/myCursor', Cursor)
Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/gfx', QuillGfxModule)
Quill.register('modules/comment', QuillComment)
Quill.register('formats/comment', QuillCommentFormat)
Quill.register('formats/livex', QuillLivexFormat)
Quill.register('formats/heading', HeadingFormat)

const Parchment = Quill.import('parchment')

const ToolbarContainer = styled.div`

`

const COLORS = [
  '#D91E18',

]

let cursorColor = {}

let driveFolderId = null

class EditDocument extends React.Component {

  constructor (props) {
    super(props)

    this._onEditorChange = this._onEditorChange.bind(this)
    this.onEditorChangeSelection = this.onEditorChangeSelection.bind(this)
    this.attachRef = this.attachRef.bind(this)
    this.onUpdateDocumentBody = this.onUpdateDocumentBody.bind(this)
    this._updateDocumentBody = _.debounce(this.onUpdateDocumentBody, 800)

    this.handleSubscribe = this.handleSubscribe.bind(this)
    this.handleReceiveDocumentChange = this.handleReceiveDocumentChange.bind(
      this)
    this.handleReceiveDocumentNotification = this.handleReceiveDocumentNotification.bind(
      this)
    this.handleSendSelectionChange = this.handleSendSelectionChange.bind(this)
    this.handleSendChangeDelta = this.handleSendChangeDelta.bind(this)
    this.handleReceiveUserLeftDocument = this.handleReceiveUserLeftDocument.bind(
      this)

    this.handleOnCommentSubmit = this.handleOnCommentSubmit.bind(this)

    this.handleOnGfxCardSubmit = this.handleOnGfxCardSubmit.bind(this)

    this.updateEditorContent = this.updateEditorContent.bind(this)

    this.handleUpdateGfxList = this.handleUpdateGfxList.bind(this)
    this.handleUpdateCommentList = this.handleUpdateCommentList.bind(this)
    this.handleUpdateHeadingList = this.handleUpdateHeadingList.bind(this)
    this.handleChangeEditorSelection = this.handleChangeEditorSelection.bind(
      this)

    this.handleEditorChangeMyCursor = this.handleEditorChangeMyCursor.bind(this)

    this.handleRemoveFormat = this.handleRemoveFormat.bind(this)

    this.onMouseDown = this.onMouseDown.bind(this)
    this.handleRightClick = this.handleRightClick.bind(this)

    this.handleReceiveInactiveGfx = this.handleReceiveInactiveGfx.bind(this)
    this.listenKeyDown = this.listenKeyDown.bind(this)

    this.addGfxHandler = this.addGfxHandler.bind(this)

    this.updateHeading = this.updateHeading.bind(this)

    this.editorRef = null

    this.state = {
      arFileInDifferentFolder: null,
    }
  }

  componentWillUnmount () {

    const {doc} = this.state
    const {currentUser} = this.props
    if (doc) {
      const id = _.get(doc, '_id')
      this.props.broadcast(`doc/${id}/left`, {
        payload: {
          _id: _.get(currentUser, '_id'),
          firstName: _.get(currentUser, 'firstName', ''),
          lastName: _.get(currentUser, 'lastName'),
        },
      })

      this.props.unsubscribe(`doc/${id}/change`)
      this.props.unsubscribe(`doc/${id}/left`)
      this.props.unsubscribe(`doc/${id}/gfx/inactive`)
      this.props.unsubscribe(`doc/${id}/notification`)

    }

    // clear all curoros
    const cursorModule = this.editorRef.getModule('cursors')
    if (cursorModule) {
      cursorModule.clearCursors()
    }

    window.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('keydown', this.listenKeyDown)

    // remove listen comment submit event
    this._onCommentSubmit.remove()

    // remove event gfx card

    this._onGfxCardSubmit.remove()

    this._onEditorSelection.remove()
    this._onEditorSetMyCursor.remove()
    this._onRemoveFormat.remove()

    document.removeEventListener('contextmenu', this.handleRightClick)

    this.props.toggleGfx(this.getDocumentId(), false)

    // remove drive id if document don't have
    this.props.toggleSidebar(false);
    this.props.toggleMiniPlayer(false);
    this.props.toggleDrive(false, { rootId: null })

  }

  componentDidMount () {

    const {event} = this.props

    const id = _.get(this.props, 'match.params.id', null)

    // right menu context
    document.addEventListener('contextmenu', this.handleRightClick)
    window.addEventListener('mousedown', this.onMouseDown)

    document.addEventListener('keydown', this.listenKeyDown)

    // Load document from service and set text
    this.props.loadDocument(id).then((res) => {

      const access = _.get(res, 'checkDocumentAccess')
      const data = _.get(res, 'document')
      const text = _.get(data, 'body', '')

      driveFolderId = _.get(data, 'driveId')

      this.props.toggleDrive(false, { rootId: driveFolderId })

      //const value = this.editorRef.clipboard.convert(text)
      // this.editorRef.updateContents(value, 'api')
      // handle subscribe real time
      this.handleSubscribe(id)
      this.editorRef.clipboard.dangerouslyPasteHTML(text, 'api')

      const canEdit = _.get(access, 'write')
      if (!canEdit) {
        this.editorRef.enable(false)
      } else {
        this.editorRef.enable(true)
      }

      // load notification items for this document, limit is 10
      this.props.loadDocNotifications(id, 10).then((items) => {

        this.props.setNotificationItems(items)

        // set the counter based on the last notify time
        this.props.getUserDocAccess(_.get(this.props.currentUser, '_id'), id).then((access) => {

          if (!access) {
            this.props.setNotificationCounter(items.length)
            return;
          }

          const lastNotifyTime = new Date(_.get(access, 'notifyTime'))
          const newItems = _.filter(items, (item) => {
            return _.get(item, 'time').getTime() > lastNotifyTime.getTime()
          })
          this.props.setNotificationCounter(newItems.length)
        })
      })

      // check connectivity status
      this.props.connectivity((connected) => {
        const { isDisconnectState = false, timeDisconnect, numberOfRetry = 0, lastTimeSave } = this.state;

        // Still enable editor
        // this.editorRef.enable(connected)
        if (!connected) {
          if (isDisconnectState) {
            if ((Date.now() - timeDisconnect) / 20000 > numberOfRetry) {
              this.props.showMessage({
                body: <span style={{color: 'red'}}> You are disconnected. Trying to reconnect...</span>,
                duration: 5000,
              })
              // Increse number of retry
              this.setState({ numberOfRetry: numberOfRetry + 1 });
              if (numberOfRetry === 2) {
                this.props.showMessage({
                  body: <span style={{color: 'red'}}> Please save the text on a text file. <br/>{`Last save: ${lastTimeSave}`}</span>,
                  duration: 10000,
                })
              }
            }
          } else {
            this.setState({ isDisconnectState: true, timeDisconnect: Date.now(), numberOfRetry: 1 });
          }
        } else {
          this.setState({ isDisconnectState: false, numberOfRetry: 0 });
          if (numberOfRetry > 1) {
            this.props.showMessage({
              body: <span style={{color: 'green'}}>Connected</span>,
              duration: 2000,
            })
          }
        }
      })

    }).catch((e) => {

    })
    this.attachRef()

    // Event
    this._onCommentSubmit = event.addListener(ON_SUBMIT_ADD_COMMENT,
      this.handleOnCommentSubmit)

    // Listen for new GFX card submit
    this._onGfxCardSubmit = event.addListener(ON_SUBMIT_ADD_GFX_CARD,
      this.handleOnGfxCardSubmit)

    this._onEditorSelection = event.addListener(ON_EDITOR_SET_SELECTION,
      this.handleChangeEditorSelection)

    this._onEditorSetMyCursor = event.addListener(ON_EDITOR_SET_MY_CURSOR,
      this.handleEditorChangeMyCursor)

    // listen for remove format

    this._onRemoveFormat = event.addListener(ON_REMOVE_FORMAT,
      this.handleRemoveFormat)

    this.props.setDocumentSavedStatus('')

  }

  listenKeyDown (e) {
    if (e.keyCode === 27 && this.props.printLayout) {
      //esc press so we need to reset print layout
      this.props.togglePrintLayout(false)
    }

    // clear Block format when press ENTER
    if (e.keyCode === 13) {
      let currentSelectedFormat = {}
      const selection = this.editorRef.getSelection()
      try {
        currentSelectedFormat = this.editorRef.getFormat(selection)
      } catch (error) {
        // TODO: handle error here
        console.log(error)        
      }

      if (_.get(currentSelectedFormat, 'heading', false) === true) {
        const delta = this.editorRef.format('heading', false, 'user')
        this.updateEditorContent(delta, 'user')
      }
    }
  }

  onMouseDown (e) {

    if (e.which !== 3) {
      // not right click
      const parentElementClassList = _.get(e, 'target.parentElement.classList',
        [])

      if (!_.includes(parentElementClassList, 'context-menu')) {
        // hide context menu
        this.props.hideContextMenu()
      }

    }
  }

  /**
   * handle process right menu context
   * @param e
   */
  handleRightClick (e) {

    if (this.editorRef) {

      // hide my Cursor

      const myCusorModule = this.editorRef.getModule('myCursor')
      if (myCusorModule) {
        myCusorModule.updateCursor(null, false)
      }

      let selection = this.editorRef.getSelection()

      if (selection !== null) {
        e.preventDefault()

        const _bound = this.editorRef.getBounds(selection)

        const left = _.get(_bound, 'left', 0)
        const top = _.get(_bound, 'top', 0)
        const height = _.get(_bound, 'height', 0)
        const width = _.get(_bound, 'width', 0)
        const containerBound = this.editorRef.container.getBoundingClientRect()
        let leftPosition = _.get(containerBound, 'left', 0) + left + (width / 2)

        const selectionFormat = this.getCurrentFormats(selection)

        let menuItems = []

        let comment = _.get(selectionFormat, 'comment')

        // when user click on the comment flag
        if (!comment && e.target.matches('span.livex-quill-comment')) {
          const blot = Parchment.find(e.target)
          if (blot) {
            const newIndex = blot.offset(this.editorRef.scroll)
            const newLength = selection.index - newIndex
            this.editorRef.setSelection(newIndex, newLength, 'user')
            selection = this.editorRef.getSelection()
            try {
              comment = JSON.parse(blot.domNode.dataset.comment)
            }
            catch (e) {}
          }
        }

        if (comment) {
          menuItems.push({
            label: 'Delete Comment',
            key: 'remove_comment',
            params: {
              id: _.get(comment, 'id'),
            },
          })
        }
        else {
          menuItems.push({
            label: 'Add Comment',
            key: 'add_comment',
          })
        }

        const livex = _.get(selectionFormat, 'livex')

        if (livex) {

          switch (_.get(livex, 'type')) {

            case 'gfx':

            menuItems.push({
              label: 'Remove GFX cue',
              key: 'inactive_gfx',
              params: {
                id: _.get(livex, 'id'),
              },
            })
            menuItems.push({
              label: 'Delete GFX cue',
              key: 'remove_gfx',
              params: {
                id: _.get(livex, 'id'),
              },
            })
            break

          default:

            break
          }
        }
        else {

          menuItems.push({
            label: 'Add GFX',
            key: 'add_gfx',
          })
          menuItems.push({
            label: 'Add Unused GFX',
            key: 'add_inactive_gfx',
            params: {
              selection: selection,
            },
          })
        }

        if (_.get(selection, 'length') > 1) {

          menuItems.push({
            label: 'Copy',
            key: 'copy',
          })
        }

        const position = {
          top: top + (height / 2),
          left: leftPosition,
        }

        this.props.showContextMenu({
          selection: selection,
          position: position,
          menu: menuItems,
          quill: this.editorRef,
          bound: _bound,
          containerBound: containerBound,
          whereNeedToShow: 'edit-document'
        })

      }

    }

  }

  /**
   * Get current selection format
   * @param range
   * @returns {*}
   */
  getCurrentFormats (range) {

    const currentSelectedFormat = this.editorRef.getFormat(range)

    let formats = {};

    const comment = _.get(currentSelectedFormat, 'comment')
    if (comment) {
      formats.comment = {
        type: 'comment',
        id: _.get(comment, 'id')
      }
    }

    const blot = _.get(currentSelectedFormat, 'livex')
    let botType = Array.isArray(blot)
      ? _.get(blot, '[0].type')
      : _.get(
        blot, 'type')

    let data = _.get(currentSelectedFormat, 'livex')
    const payload = Array.isArray(data)
      ? _.get(data, '[0].payload')
      : _.get(data, 'payload')

    if (botType) formats.livex = {
      type: botType,
      id: _.get(payload, 'id'),
    }

    console.log('current format is:', formats)

    return formats
  }

  /**
   * Remove format
   * @param message
   */
  handleRemoveFormat (message) {

    const selection = _.get(message, 'selection')
    const source = _.get(message, 'source', 'user')
    const format = _.get(message, 'format', 'livex')

    let delta = {
      ops: [],
    }

    // remove current comment

    const selectIndex = _.get(selection, 'index', 1)

    let objectOps = {
      retain: selectIndex >= 0 ? selectIndex : 0,
    }

    // Handle first character ignored
    if ( selectIndex === 0) objectOps['insert'] = ''

    delta.ops.push(objectOps)

    delta.ops.push({
      retain: _.get(selection, 'length', 0),
      attributes: {
        [format]: false,
      },
    })
    this.updateEditorContent(delta, source)

  }

  handleEditorChangeMyCursor (payload) {

    const _range = _.get(payload, 'range')

    const myCursorModule = this.editorRef.getModule('myCursor')
    myCursorModule.updateCursor(_range, true)
  }

  handleChangeEditorSelection (payload) {

    this.editorRef.setSelection(_.get(payload, 'range'),
      _.get(payload, 'source'))
    this.editorRef.focus()

  }

  handleOnCommentSubmit (message) {

    let comment = _.get(message, 'comment')
    const selection = _.get(message, 'selection')

    if (!_.get(comment, 'id')) {
      comment.id = uuid()
    }

    let delta = {
      ops: [],
    }

    // remove current comment

    const selectIndex = _.get(selection, 'index', 1)

    delta.ops.push({
      retain: selectIndex > 0 ? selectIndex : 1,
    })

    delta.ops.push({
      retain: selection.length,
      attributes: {
        comment: false,
      },
    })

    this.updateEditorContent(delta, 'user')
    // End remove current comment

    // Begin add comment
    delta = {
      ops: [],
    }
    delta.ops.push({
      retain: selectIndex > 0 ? selectIndex : 1,
    })

    delta.ops.push({
      retain: selection.length,
      attributes: {
        comment: comment,
      },
    })

    this.updateEditorContent(delta, 'user')
  }

  /**
   * Handle receive gfx card submitted
   * @param message
   */
  handleOnGfxCardSubmit (message) {

    const gfx = _.get(message, 'payload')
    const range = _.get(message, 'range')

    if (!_.get(gfx, 'id')) {
      gfx.id = uuid()
    }

    let delta = {
      ops: [],
    }

    const selectIndex = _.get(range, 'index', 1)
    // remove current gfx if length > 0
    if (_.get(range, 'length', 0) > 0) {
      delta.ops.push({
        retain: selectIndex > 0 ? selectIndex : 1,
      })

      delta.ops.push({
        retain: range.length,
        attributes: {
          livex: false,
        },
      })

      this.updateEditorContent(delta, 'user')
      // End remove current gfx
    }

    // Begin add gfx
    delta = {
      ops: [],
    }

    let objectOps = {
      retain: selectIndex >= 0 ? selectIndex : 0,
    }

    // Handle first character ignored
    if ( selectIndex === 0) objectOps['insert'] = ''

    delta.ops.push(objectOps)

    //@todo Idea: if user not select a text, that mean length = 0, we need to add a space like " "
    if (_.get(range, 'length', 0) < 1) {
      delta.ops.push({
        insert: '  ',
        attributes: {
          livex: {
            payload: gfx,
            type: 'gfx',
          },
        },
      })

    } else {
      delta.ops.push({
        retain: range.length > 0 ? range.length : 1,
        attributes: {
          livex: {
            payload: gfx,
            type: 'gfx',
          },
        },
      })
    }

    this.updateEditorContent(delta, 'user')

    // save gfx changes to db

    const updatedGfx = _.cloneDeep(gfx)

    let notifyItem = {
      user: this.props.currentUser,
      docId: _.get(updatedGfx, 'documentId'),
      type: 'gfx',
      time: new Date(),
      data: updatedGfx,
      action: ''
    }

    const previousData = _.get(updatedGfx, 'history[0]', null)

    if (!previousData) {  // create new GFX item

      notifyItem.action = 'new'
      this.handleSendNotificationAdd(notifyItem)
    }
    else if (_.get(updatedGfx, 'status') !== _.get(previousData, 'status')) {

      notifyItem.action = 'update_status'
      this.handleSendNotificationAdd(notifyItem)
    }
    else if (_.get(updatedGfx, 'assign._id') !== _.get(previousData, 'assign._id')) {

      notifyItem.action = 'update_assign'
      this.handleSendNotificationAdd(notifyItem)
    }
    else if (_.get(updatedGfx, 'title') !== _.get(previousData, 'title')) {

      notifyItem.action = 'update_title'
      this.handleSendNotificationAdd(notifyItem)
    }
    else if (!_.isEqual(_.get(updatedGfx, 'files'), _.get(previousData, 'files'))) {

      notifyItem.action = 'update_files'
      this.handleSendNotificationAdd(notifyItem)
    }

  }

  /**
   * Update Editor content
   * @param delta
   * @param source
   */

  updateEditorContent (delta, source = 'user') {

    if (!this.editorRef) {
      return
    }
    this.editorRef.updateContents(delta, source)

  }

  /**
   * Handle Send delta change to real time
   * @param delta
   */
  handleSendChangeDelta (delta) {

    const {currentUser} = this.props
    const id = this.getDocumentId()
    this.props.broadcast(`doc/${id}/change`, {
      type: 'delta',
      user: {
        _id: _.get(currentUser, '_id'),
        firstName: _.get(currentUser, 'firstName', ''),
        lastName: _.get(currentUser, 'lastName'),
      },
      payload: delta,
    })
  }

  /**
   * Handle send selection change to real time
   * @param range
   */
  handleSendSelectionChange (range) {

    const {currentUser} = this.props
    const id = this.getDocumentId()
    this.props.broadcast(`doc/${id}/change`, {
      type: 'selection',
      user: {
        _id: _.get(currentUser, '_id'),
        firstName: _.get(currentUser, 'firstName', ''),
        lastName: _.get(currentUser, 'lastName'),
      },
      payload: range,
    })

  }

  handleSendNotificationAdd (notifyItem) {

    this.props.saveNotificationItem(notifyItem).then((item) => {

      const id = this.getDocumentId()
      this.props.broadcast(`doc/${id}/notification`, item)
    })
  }

  /**
   * Receive document change from realtime.
   * @param message
   */
  handleReceiveDocumentChange (message) {

    const type = _.get(message, 'type')
    const payload = _.get(message, 'payload')

    switch (type) {

      case 'selection':
        // let apply to Editor selection change

        const cursorModule = this.editorRef.getModule('cursors')
        const user = _.get(message, 'user')
        const userId = _.get(user, '_id')
        if (payload === null) {
          // remove cursor
          cursorModule.removeCursor(userId)
        } else {
          const name = `${_.get(user, 'firstName', '')} ${_.get(user,
            'lastName', '')}`

          let color = _.get(cursorColor, userId)
          if (!color) {
            color = COLORS[Math.floor(Math.random() * COLORS.length)]
            cursorColor = _.setWith(cursorColor, userId, color)
          }
          const info = {
            id: userId,
            name: name,
            color: color,
            range: payload, //{index: 1, length: 10}
          }

          cursorModule.setCursor(info.id, info.range, info.name, info.color)

        }

        break

      case 'delta':

        //
        // console.log('handleReceiveDocumentChange', message)

        // handle update Editor content
        this.editorRef.updateContents(payload)

        break

      default:

        break
    }
  }

  /**
   * Handle when a user left document
   */
  handleReceiveUserLeftDocument (message) {

    const userId = _.get(message, 'payload._id')
    const cursorModule = this.editorRef.getModule('cursors')
    if (userId && cursorModule) {
      cursorModule.removeCursor(userId)
    }

  }

  /**
   * Handle when having notification
   */
  handleReceiveDocumentNotification (notifyItem) {

    // only show notification of other users
    if (_.get(notifyItem, 'user._id') === this.props.currentUser._id) return;

    if (typeof notifyItem.time === 'string') {
      _.set(notifyItem, 'time', new Date(_.get(notifyItem, 'time')))
    }

    this.props.addNotificationItem(notifyItem)
  }

  getDocumentId () {
    return _.get(this.props, 'match.params.id', null)
  }

  /**
   * Begin listen for change from realtime
   */
  handleSubscribe (id) {

    this.props.subscribe(`doc/${id}/change`, this.handleReceiveDocumentChange)
    this.props.subscribe(`doc/${id}/left`, this.handleReceiveUserLeftDocument)
    this.props.subscribe(`doc/${id}/gfx/inactive`, this.handleReceiveInactiveGfx)
    this.props.subscribe(`doc/${id}/notification`, this.handleReceiveDocumentNotification)

  }

  handleReceiveInactiveGfx (message) {

    const type = _.get(message, 'type')
    const payload = _.get(message, 'payload')

    switch (type) {

      case 'set':

        this.props.addInactiveCard(payload)

        break

      case 'delete':

        this.props.removeInactiveCard(payload)

        break

      default:

        break
    }
  }

  onEditorChangeSelection (range, source, editor) {
    //console.log('On Change selection', range, source)
    if (source === 'user') {

      this.handleSendSelectionChange(range)
    }
  }

  /**
   * this will send document content to the server
   * @param body
   */
  onUpdateDocumentBody (body) {
    const id = _.get(this.props, 'match.params.id', null)
    this.props.updateDocument({_id: id, body: body}).then((res) => {
      const lastTimeSave = moment(new Date()).format('LLL');
      this.setState({ lastTimeSave })
      this.props.setDocumentSavedStatus('Document saved. Last save: ' + lastTimeSave)
    });

  }

  async _onEditorChange (content, delta, source, editor) {
    // update comments list

    this.handleUpdateCommentList()

    // handle find and update GFX list

    await this.handleUpdateGfxList()

    this.handleUpdateHeadingList()

    if (source === 'user') {
      this.props.setDocumentSavedStatus('Saving...')
      // update to the server
      this.handleSendChangeDelta(delta)
      this._updateDocumentBody(content)
    }

  }

  async handleUpdateGfxList () {

    const docId = _.get(this.props, 'match.params.id', null)
    const gfxNodeList = document.querySelectorAll(
      '#document-editor span.livex-quill-gfx')

    let list = []
    let lastItem = null
    let lastItemIndex = 0

    // TODO: refactor... Get list file different Folder
    const arFileInDifferentFolder = new Map();
    gfxNodeList.forEach((element) => {
      // get all id files different folder
      // copy then make a mapping
      const elementClassName = element.className
      element.className = _.replace(elementClassName, new RegExp('gfx-highlight', 'g'), '')
      element.className = _.replace(elementClassName, new RegExp('gfx-hide', 'g'), '')
      const gfxBlot = Parchment.find(element)//editor.find(element)
      let gfxContent = _.get(gfxBlot, 'domNode.dataset.content')
      try {
        gfxContent = JSON.parse(gfxContent)
      } catch (e) {}

      const dataOfItem = _.get(gfxContent, 'payload', null);
      this.getFilesInDifferentFolder(dataOfItem, arFileInDifferentFolder);
    });

    // console.log('arFileInDifferentFolder', arFileInDifferentFolder);
    // console.log('this.state.arFileInDifferentFolder', this.state.arFileInDifferentFolder);
    if (!_.isEqual(this.state.arFileInDifferentFolder, arFileInDifferentFolder)) {
      if (arFileInDifferentFolder.size > 0) {
        this.props.showLoadingDialog({
          open: true,
          text: `Copying ${arFileInDifferentFolder.size} files from old folder to current folder...`,
        })
        await this.createMappingFromOldFilesToNewFolder(arFileInDifferentFolder);
        // Refresh folder if have arFileInDifferentFolder
        this.props.refreshDrive();
        this.setState({ arFileInDifferentFolder });
        this.props.showLoadingDialog({
          open: false,
        })
      }
    }

    await gfxNodeList.forEach(async (element) => {
      const elementClassName = element.className

      element.className = _.replace(elementClassName, new RegExp('gfx-highlight', 'g'), '')
      element.className = _.replace(elementClassName, new RegExp('gfx-hide', 'g'), '')

      const gfxBlot = Parchment.find(element)//editor.find(element)

      const gfxIndex = this.editorRef.getIndex(gfxBlot)
      const gfxLength = gfxBlot.length()

      const gfxId = _.get(gfxBlot, 'domNode.dataset.id')
      let gfxContent = _.get(gfxBlot, 'domNode.dataset.content')

      try {
        gfxContent = JSON.parse(gfxContent)
      } catch (e) {

      }

      let dataOfItem = _.get(gfxContent, 'payload', null);

      /**
      * Handle copy asset if different drive folder
      *
      */
      dataOfItem = await this.handleCopyAssetFromDifferentFolder(dataOfItem, arFileInDifferentFolder);
      // Overwrite data in document
      gfxContent.payload = dataOfItem
      element.setAttribute('data-content', JSON.stringify(gfxContent));

      let item = {
        id: gfxId,
        documentId: docId,
        index: gfxIndex,
        length: gfxLength,
        blots: [gfxBlot],
        data: dataOfItem,
        elements: [element],
      }

      if (gfxId === _.get(lastItem, 'id')) {
        item.index = lastItem.index
        item.length = lastItem.length + item.length + 1 // it can be \n so increase one number
        item.blots = _.concat(lastItem.blots, item.blots)
        item.elements = _.concat(lastItem.elements, item.elements)
        list[lastItemIndex - 1] = item
      } else {

        lastItemIndex = lastItemIndex + 1
        list.push(item)
      }
      lastItem = item

    })
    // let update gfx to redux store

    // let update numbers

    const gfxModule = this.editorRef.getModule('gfx')
    gfxModule.updateNumbers(list)
    this.props.setGfxItems(list)
  }

  handleUpdateCommentList () {

    const docId = _.get(this.props, 'match.params.id', null)
    const nodeList = document.querySelectorAll(
      '#document-editor span.livex-quill-comment')

    let list = []
    let lastItem = null
    let lastItemIndex = 0

    nodeList.forEach((element) => {
      const commentBlot = Parchment.find(element)//editor.find(element)

      const commentIndex = this.editorRef.getIndex(commentBlot)
      const commentLength = commentBlot.length()

      const commentId = _.get(commentBlot, 'domNode.dataset.id')
      let commentContent = _.get(commentBlot, 'domNode.dataset.comment')

      try {
        commentContent = JSON.parse(commentContent)
      } catch (e) {

      }

      let item = {
        id: commentId,
        documentId: docId,
        index: commentIndex,
        length: commentLength,
        blots: [commentBlot],
        data: commentContent,
        elements: [element],
      }

      if (commentId === _.get(lastItem, 'id')) {
        item.index = lastItem.index
        item.length = lastItem.length + item.length + 1 // it can be \n so increase one number
        item.blots = _.concat(lastItem.blots, item.blots)
        item.elements = _.concat(lastItem.elements, item.elements)
        list[lastItemIndex - 1] = item
      } else {

        lastItemIndex = lastItemIndex + 1
        list.push(item)
      }
      lastItem = item

    })
    // let update gfx to redux store
    this.props.setCommentItems(list)

  }

  handleUpdateHeadingList () {
    const docId = _.get(this.props, 'match.params.id', null)
    const headingNodeList = document.querySelectorAll(
      '#document-editor h2.livex-heading')

    let list = []

    headingNodeList.forEach((element) => {

      const headingBlot = Parchment.find(element)//editor.find(element)

      const headingIndex = this.editorRef.getIndex(headingBlot)
      const headingLength = headingBlot.length()

      element.setAttribute('class', 'livex-heading')

      let item = {
        text: element.textContent,
        documentId: docId,
        index: headingIndex,
        length: headingLength,
        blots: [headingBlot],
        elements: [element],
      }

      list.push(item)

    })

    // let update heading to redux store
    this.props.setHeadingItems(list)
  }

  componentDidUpdate () {
    this.attachRef()
  }

  addGfxHandler () {

    // change to CUES tab
    this.props.toggleInactiveGfxList(false)

    // reset the newGFX
    this.props.toggleSidebar(true, { newGFX: null })

    // load the updated newGFX
    const range = this.editorRef.getSelection()
    const gfx = {
      quill: this.editorRef,
      range: range,
      text: this.editorRef.getText(range.index, range.length)
    }
    window.setTimeout(() => this.props.toggleSidebar(true, {newGFX: gfx}), 10)

  }

  /**
   * Handle image upload
   * */

  addImageHandler () {

    const imageHandler = new ImageHandler({
      success: (urls) => {
        const range = this.editorRef.getSelection()
        this.editorRef.insertEmbed(range.index, 'image', _.get(urls, '[0]'),
          'user')

      },
      error: (err) => {
        console.log('Upload image error', err)
      },
    })
    imageHandler.setupViews()

  }

  attachRef () {

    if (this.ref && typeof this.ref.getEditor !== 'undefined') {
      this.editorRef = this.ref.getEditor()
      this.editorRef.enable(false)
      this.props.setQuill(this.editorRef)

    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return false
  }

  toggleGfx () {

    this.props.toggleGfx(this.getDocumentId())
  }

  updateHeading (range) {

    const currentSelectedFormat = this.editorRef.getFormat(range)

    const delta = this.editorRef.format('heading', currentSelectedFormat.heading ? false : true, 'user')

    this.updateEditorContent(delta, 'user')
  }

  handleCopyAssetFromDifferentFolder = async (dataOfItem, arFileInDifferentFolder) => {
    const curentDocumentId = _.get(this.props, 'match.params.id', null)
    let newDataOfItem = {...dataOfItem}
    // Make sure same id of document
    newDataOfItem.documentId = curentDocumentId

    let files = _.get(newDataOfItem, 'files', [])
    files = files.map(_itemFile => {
      if (_itemFile.parents[0] !== driveFolderId) { // Check if different folder
        _itemFile.parents[0] = driveFolderId
        _itemFile.id = arFileInDifferentFolder.get(_itemFile.id)
      }
      return _itemFile
    })
    newDataOfItem.files = files

    return newDataOfItem
  }

  getFilesInDifferentFolder(dataOfItem, arFileInDifferentFolder) {
    const files = _.get(dataOfItem, 'files', [])
    files.forEach(_itemFile => {
      if (_itemFile.parents[0] !== driveFolderId) { // Check if fifferent folder
        _itemFile.parents[0] = driveFolderId
        arFileInDifferentFolder.set(_itemFile.id, '');
      }
    })
  }

  createMappingFromOldFilesToNewFolder = async (arFileInDifferentFolder) => {
    // Copy arFileInDifferentFolder to driveFolderId
    await this.props.copyFilesToNewFolder([...arFileInDifferentFolder.keys()], driveFolderId).then((data) => {
      const results = _.get(data, 'result', []);
      [...arFileInDifferentFolder.keys()].forEach((_key, _index) => {
        arFileInDifferentFolder.set(_key, results[_index]);
      });
      console.log('arFileInDifferentFolder', arFileInDifferentFolder);
    }).catch((err) => {
      console.log(err)
    })
  }


  render () {

    const id = this.getDocumentId()

    const MODULES = {
      toolbar: {
        container: '#toolbar',
        handlers: {
          image: this.addImageHandler.bind(this),
          'linespacing': (value) => {
            this.props.setLineSpacing(id, value)

            this.handleUpdateGfxList()

          },
          'heading': () => {

            const selection = this.editorRef.getSelection()
            this.updateHeading(selection)

          },
          'gfx-options': (selected) => {
            switch (selected) {

              case 'toggle':

                this.props.toggleGfx(this.getDocumentId())

                break

              case 'add':

                this.addGfxHandler()

                break

              case 'open':

                this.props.toggleSidebar(true)
                this.props.toggleMiniPlayer(true)

                break

              case 'openDrive':

                window.open(`https://drive.google.com/drive/u/3/folders/${driveFolderId}`, '_blank')

                break

              // case 'toggle_comments':

                // this.props.toggleCommentItems();
                //this.editorRef.container.parentElement.className = 'quill showComments'

                // break

              default:

                break
            }
          }
        },
      },
      cursors: {
        autoRegisterListener: false,
      },
      comment: true,
      gfx: true,
      myCursor: true,
      history: {
        userOnly: true,
      },
    }

    const containerId = 'document-viewer-container'
    const widthNavigation = '250px !important'

    return (

      <DocumentLayout docId={id}>

        <ToolbarContainer>
          <DocumentToolbar docId={id}/>
        </ToolbarContainer>
        <EditorContainer printLayout={this.props.printLayout}>
          <DocumentSidebar docId={id}/>
          <DocumentNavigation docId={id} width={widthNavigation} />
          <DocumentMiniPlayerAndDrive />
          <DocumentCinemaView />
          <div
            id={containerId}
            ref={(ref) => this.viewerContainerRef = ref}
            className={containerId}>
            <QuillEditor
              ref={(ref) => this.ref = ref}
              modules={MODULES}
              theme={'snow'}
              scrollingContainer={'#' + containerId}
              defaultValue={this.state.text}
              onChange={this._onEditorChange}
              onChangeSelection={this.onEditorChangeSelection}
            >
              <EditorArea
                id={'document-editor'}
                className="document-editor ql-container ql-snow"
                navigationWidth={widthNavigation}
              />
            </QuillEditor>
            <AddDocumentComment docId={id}/>
            <DocumentComment/>
            <ContextMenu whereNeedToShow="edit-document"/>
          </div>
        </EditorContainer>
      </DocumentLayout>
    )
  }
}

const mapStateToProps = (state, props) => ({
  currentUser: getCurrentUser(state),
  event: state.event,
  printLayout: state.layout.printLayout,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  loadDocument,
  updateDocument,
  subscribe,
  broadcast,
  unsubscribe,
  showContextMenu,
  hideContextMenu,
  toggleSidebar,
  setGfxItems,
  setCommentItems,
  togglePrintLayout,
  setDocumentSavedStatus,
  showMessage,
  // toggleCommentItems,
  setHeadingItems,
  addNotificationItem,
  saveNotificationItem,
  loadDocNotifications,
  setNotificationItems,
  setNotificationCounter,
  getUserDocAccess,
  toggleInactiveGfxList,
  toggleDrive,
  refreshDrive,
  copyFilesToNewFolder,
  toggleMiniPlayer,
  showLoadingDialog,
  addInactiveCard: (data) => {
    return (dispatch) => {
      dispatch({
        type: SET_INACTIVE_GFX,
        payload: data,
      })
    }
  },
  removeInactiveCard: (id) => {
    return (dispatch) => {
      dispatch({
        type: DELETE_INACTIVE_GFX,
        payload: id,
      })
    }
  },
  setQuill: (quill) => {
    return (dispatch) => {
      dispatch({
        type: SET_QUILL,
        payload: quill,
      })
    }
  },
  toggleGfx: (id, value = null) => {
    return (dispatch) => {

      dispatch({
        type: TOGGLE_DOCUMENT_GFX,
        payload: {
          id: id,
          value: value
        }
      })
    }
  },
  setLineSpacing: (id, value) => {
    return (dispatch) => {
      dispatch({
        type: SET_LINE_SPACING,
        payload: {
          docId: id,
          value: value
        }
      })
    }
  },
  connectivity: (cb) => {

    return (dispatch, getState, {service, pubSub}) => {
      return pubSub.connectivity(cb)
    }
  }
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(EditDocument)
