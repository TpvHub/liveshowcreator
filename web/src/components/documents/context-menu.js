import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import _ from 'lodash'
import {
  hideContextMenu,
  toggleSidebar,
  showAddComment,
  removeGfxById,
  removeCommentById,
  setInactiveGfx, toggleInactiveGfxList
} from '../../redux/actions'
import { editorWidth } from '../../config'

const List = styled.div `
  border-radius: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: opacity 0.218s;
  background: #fff;
  border: 1px solid #ccc;
  border: 1px solid rgba(0,0,0,.2);
  cursor: default;
  font-size: 13px;
  margin: 0;
  outline: none;
  padding: 6px 0;
  position: absolute;
  min-width: 150px;
  min-height: 30px;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  z-index: 10003;
`

const ListItem = styled.div `
  cursor: pointer;
  position: relative;
  color: #333;
  padding: 6px 10px;
  border-bottom: 1px solid #ebebeb;
  &:hover{
    background: rgba(0,0,0,0.05);
  }
  &:last-child{
    border-bottom: 0 none;
  }
`

class ContextMenu extends React.Component {

  constructor (props) {
    super(props)

    this.handleClickMenuItem = this.handleClickMenuItem.bind(this)
    this.state = {
      containerBound: {}
    }

  }

  componentWillReceiveProps(nextProps) {
    try {
      const {parent, isRaw = false} = nextProps
      if (isRaw) {
        this.setState({ containerBound: ReactDOM.findDOMNode(parent.contentRef).getBoundingClientRect() })
      }
    } catch(e) {
      console.log(e);
    }
  }

  handleClickMenuItem (menu) {
    const {menuContext} = this.props
    const {selection, containerBound, bound, quill} = menuContext


    this.props.hideContextMenu()

    switch (menu.key) {

      case 'add_inactive_gfx':

        this.props.toggleInactiveGfxList(true)
        quill.setSelection(selection)

        break

      case 'add_gfx':
        // change to CUES tab
        this.props.toggleInactiveGfxList(false)

        // reset the newGFX
        this.props.toggleSidebar(true, { newGFX: null })

        // load the updated newGFX
        window.setTimeout(() => this.props.toggleSidebar(true, {
          newGFX: {
            range: selection,
            text: quill.getText(selection.index, selection.length)
          }
        }), 10)

        break

      case 'add_comment':

        if (containerBound && bound) {

          const position = {
            top: _.get(bound, 'top', 0),
            left: _.get(containerBound, 'left', 0) + editorWidth - 400,
          }
          this.props.showAddComment(selection, position, null)
        }

        break

      case 'remove_gfx':

        const gfxId = _.get(menu, 'params.id')
        if (gfxId) {
          this.props.removeGfxById(gfxId)
        }

        break

      case 'inactive_gfx':

        this.props.setInactiveGfx(_.get(menu, 'params.id'))

        break

      case 'remove_comment':
        const commentId = _.get(menu, 'params.id')
        if (commentId) {
          this.props.removeCommentById(commentId)
        }

        break

      case 'copy':

        quill.setSelection(selection)

        try {
          document.execCommand('copy')
        } catch (e) {
          console.log('An error copy', e)
        }

        break

      default:

        break
    }
  }

  render () {
    const {menuContext, isRaw = false} = this.props
    const {position, menu, whereNeedToShow = ''} = menuContext
    let top = 0, left = 0;
    const isShow = _.get(menuContext, 'show', false) && (whereNeedToShow === this.props.whereNeedToShow)
    if (isRaw) {
      const {containerBound} = this.state
      const height = _.get(position, 'height', 0)
      const width = _.get(position, 'width', 0)
      left = _.get(position, 'left', 0) - _.get(containerBound, 'left', 0) + (width / 2)
      top = _.get(position, 'top', 0) - _.get(containerBound, 'top', 0)
      top = top + (height / 2)
    } else {
      top = _.get(position, 'top', 0)
      left = _.get(position, 'left', 0)
    }

    return (
      isShow ? (
        <List className={'context-menu'} show={isShow} top={top} left={left}>
          {
            menu.map((item, index) => {
              return (
                <ListItem onClick={() => this.handleClickMenuItem(item)} key={item.label+index}>{item.label}</ListItem>
              )
            })
          }
        </List>
      ) : null
    )
  }
}

const mapStateToProps = (state) => ({
  menuContext: state.context,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleSidebar,
  hideContextMenu,
  showAddComment,
  removeGfxById,
  removeCommentById,
  setInactiveGfx,
  toggleInactiveGfxList

}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu)
