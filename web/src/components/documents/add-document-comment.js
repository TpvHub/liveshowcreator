import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import _ from 'lodash'
import { getCurrentUser } from '../../redux/selectors'
import {
  ON_HIDE_ADD_COMMENT,
  ON_SHOW_ADD_COMMENT,
  ON_SHOW_COMMENT,
  ON_SUBMIT_ADD_COMMENT,
} from '../../redux/types'
import commentAvatar from '../../assets/images/comment_avatar.png'

const Container = styled.div `
  display: ${props => props.isDisplay ? 'block' : 'none'};
  position: absolute;
  top: ${props => props.top ? props.top : 0}px;
  left: ${props => props.left}px;
  box-shadow: 0px 3px 6px rgba(0,0,0,0.2);
  background: #FFF;
  width: 240px;
  z-index: 1011;

`

const CommentHeader = styled.div `
  display: flex;
  padding: 8px 8px 0 8px;
  flex-direction: row;
  .comment-avatar{
    width: 30px;
    height: 30px;
    img{
      max-width: 100%;
      width: 100%;
      height: auto;
     }
  }
  .comment-author{
    flex: 1;
    padding-left: 8px;
  }

`

const CommentForm = styled.div `
  padding: 8px;
  .comment-buttons{
    margin-top: 8px;
    button {
      margin-right: 10px;
      box-shadow: none;
      background-color: #4d90fe;
      background-image: linear-gradient(top,#4d90fe,#4787ed);
      border: 1px solid #3079ed;
      color: #fff;
      height: 27px;
      line-height: 27px;
      min-width: 54px;
      outline: 0px;
      padding: 0 8px;
      border-radius: 2px;
      text-align: center;
      white-space: nowrap;
      font-size: 11px;
      &.disabled{
        background: #4d90fe;
        filter: alpha(opacity=50);
        opacity: 0.5;
      }
      &.default{
        background-color: #f5f5f5;
        box-shadow: none;
        background-image: linear-gradient(top,#f5f5f5,#f1f1f1);
        color: #333;
        border: 1px solid #dcdcdc;
        border: 1px solid rgba(0,0,0,0.1);
      }
      &:hover{
        opacity: 0.7;
      }
    }
  }

  textarea{
    border: 1px solid #c8c8c8;
    box-sizing: border-box;
    color: #999;
    font-family: Arial,sans-serif;
    font-size: 13px;
    margin: 0;
    overflow-y: hidden;
    outline-width: 0;
    padding: 4px;
    resize: none;
    width: 100%;
  }

`

class AddDocumentComment extends React.Component {

  constructor (props) {
    super(props)

    this.onShowAddComment = this.onShowAddComment.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onHideAddComment = this.onHideAddComment.bind(this)
    this.handleDismiss = this.handleDismiss.bind(this)

    this.state = {
      text: '',
      position: null,
      display: false,
      disabled: true,
      selection: null,
      quill: null,
      onCancel: null,
    }

  }

  componentDidMount () {
    const {event} = this.props

    this._onShow = event.addListener(ON_SHOW_ADD_COMMENT, this.onShowAddComment)
    this._onHide = event.addListener(ON_HIDE_ADD_COMMENT, this.onHideAddComment)
  }

  componentWillUnmount () {
    this._onShow.remove()
    this._onHide.remove()
  }

  onShowAddComment (message) {

    const position = _.get(message, 'position')
    this.setState({
      display: true,
      position: position,
      selection: _.get(message, 'selection'),
      quill: _.get(message, 'quill'),
      onCancel: message.onCancel ? message.onCancel : null,
    })
  }

  onHideAddComment () {

    if (this.state.onCancel) {
      this.state.onCancel()
    }
    this.setState({
      display: false,
      selection: null,
      text: '',
      position: null,
    })
  }

  handleSubmit (e) {

    const {event, currentUser, docId} = this.props
    e.preventDefault()

    const userId = _.get(currentUser, '_id')
    const user = {
      _id: userId,
      firstName: _.get(currentUser, 'firstName'),
      lastName: _.get(currentUser, 'lastName'),
      avatar: _.get(currentUser, 'avatar'),
    }

    const comment = {
      body: this.state.text,
      user: user,
      userId: userId,
      documentId: docId,
      created: new Date(),
      updated: null,
      replies: [],
    }
    event.emit(ON_SUBMIT_ADD_COMMENT, {
      selection: this.state.selection,
      comment: comment,
    })
    event.emit(ON_HIDE_ADD_COMMENT, true)
    // then show a comment on this selection
    event.emit(ON_SHOW_COMMENT, {
      comment: comment,
      selection: this.state.selection,
      position: this.state.position,
    })

  }

  handleDismiss () {
    this.onHideAddComment()
  }

  render () {
    const {text, position, disabled} = this.state
    const {currentUser} = this.props

    const author = `${_.get(currentUser, 'firstName', '')} ${_.get(currentUser,
      'lastName', '')}`
    const userAvatar = _.get(currentUser, 'avatar', null)

    return (
      <Container
        isDisplay={this.state.display} top={_.get(position, 'top', 0)}
        left={_.get(position, 'left', 916)}>
        <CommentHeader className={'comment-header'}>
          <div className={'comment-avatar'}>
            <img src={userAvatar ? userAvatar : commentAvatar} alt={''}/>
          </div>

          <div className={'comment-author'}>{author}</div>
        </CommentHeader>
        <CommentForm className={'comment-form'}>
          <form onSubmit={this.handleSubmit}>
            <textarea onChange={(e) => {
              const value = e.target.value
              this.setState({
                text: value,
                // eslint-disable-next-line
                disabled: !value || value === '' && _.trim(value) === '',
              })
            }} value={text}/>
            <div className={'comment-buttons'}>
              <button className={disabled ? 'disabled' : 'enabled'}
                      disabled={disabled} type={'submit'}>Comment
              </button>
              <button onClick={this.handleDismiss} type={'button'}
                      className={'default'}>Cancel
              </button>
            </div>
          </form>
        </CommentForm>
      </Container>
    )
  }
}

const mapStateTopProps = (state) => ({
    currentUser: getCurrentUser(state),
    event: state.event,
  }
)

const mapDispatchToProps = (dispatch) => bindActionCreators({
}, dispatch)
export default connect(mapStateTopProps, mapDispatchToProps)(AddDocumentComment)
