import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import {
  ON_SUBMIT_ADD_COMMENT,
} from '../../redux/types'
import _ from 'lodash'
import commentAvatar from '../../assets/images/comment_avatar.png'
import { getCurrentUser, getSelectedComment } from '../../redux/selectors'
import CommentReplies from './comment-replies'
import { removeCommentById } from '../../redux/actions'
import { moment } from '../../config'

const Container = styled.div `
  display: ${props => props.isDisplay ? 'block' : 'none'};
  position: absolute;
  top: ${props => props.top ? props.top : 0}px;
  left: ${props => props.left ? props.left : 916}px;
  box-shadow: 0px 3px 6px rgba(0,0,0,0.2);
  background: #FFF;
  width: 240px;
  z-index: 1010;
  .comment-reply-item{
    border-top: 1px solid #e5e5e5;
    padding: 3px 8px 5px 8px;
    background: #f5f5f5;
    margin: 0;
  }
  textarea {
    border: 1px solid #c8c8c8;
  }
  .reply-form-actions{
    padding-bottom: 0;
  }

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
  .comment-date{
    font-size: 11px;
    color: rgba(0,0,0,0.5);
  }
  .comment-actions{
     button{
      box-shadow: none;
      background-color: #f5f5f5;
      background-image: linear-gradient(top,#f5f5f5,#f1f1f1);
      border: 1px solid rgba(0,0,0,0.1);
      color: #333;
      height: 27px;
      line-height: 27px;
      min-width: 54px;
      outline: 0px;
      padding: 0 8px;
      border-radius: 2px;
      text-align: center;
      white-space: nowrap;
      font-size: 11px;
      &.comment-resolve{
        display: inline-block;
        margin: 0;
        opacity: 0.2;
        padding-left: 2px;
        position: relative;
        padding: 0 4px 0 4px;
        min-width: 50px;
        height: 28px;
        vertical-align: top;
      }
      &:hover{
        opacity: 1;
      }
     }

  }
`

const CommentContent = styled.div `
  word-wrap: break-word;
  color: #333;
  padding: 8px;

`

class DocumentComment extends React.Component {

  constructor (props) {
    super(props)

    this.handleReply = this.handleReply.bind(this)

  }

  handleReply (selectedComment, message) {

    const {currentUser} = this.props

    let comment = _.get(selectedComment, 'data')
    let replies = _.get(comment, 'replies', [])

    const userId = _.get(currentUser, '_id')
    const user = {
      _id: userId,
      firstName: _.get(currentUser, 'firstName', ''),
      lastName: _.get(currentUser, 'lastName', ''),
      avatar: _.get(currentUser, 'avatar', null),

    }

    const reply = {
      parent: _.get(comment, 'id'),
      body: _.trim(message),
      created: new Date(),
      updated: null,
      userId: userId,
      user: user,

    }
    replies.push(reply)

    comment = _.setWith(comment, 'replies', replies)

    this.props.event.emit(ON_SUBMIT_ADD_COMMENT, {
      selection: {
        index: _.get(selectedComment, 'index'),
        length: _.get(selectedComment, 'length'),
      },
      comment: comment,
    })
  }

  render () {

    const {currentUser, selectedComment, position} = this.props
    const comment = _.get(selectedComment, 'data')
    const user = _.get(comment, 'user')
    const created = _.get(comment, 'created')
    const userAvatar = _.get(user, 'avatar', null)
    const author = `${_.get(user, 'firstName', '')} ${_.get(user,
      'lastName', '')}`

    return (
      <Container
        className={'document-comment-container'}
        isDisplay={selectedComment} top={_.get(position, 'top',0)-50}
        left={_.get(position, 'left', 916)}>
        <CommentHeader>
          <div className={'comment-avatar'}>
            <img src={userAvatar ? userAvatar : commentAvatar} alt={''}/>
          </div>
          <div className={'comment-author'}>
            <div className={'author-name'}>{author}</div>
            <div className={'comment-date'}>{moment(created).format('LLL')}</div>
          </div>
          <div className={'comment-actions'}>
            <button onClick={() => {
              this.props.removeCommentById(_.get(selectedComment, 'id'))
            }} type={'button'} className={'comment-resolve'}>Resolve
            </button>
          </div>
        </CommentHeader>
        <CommentContent className={'comment-content'}>
          {_.get(comment, 'body', '')}

        </CommentContent>
        <CommentReplies currentUser={currentUser}
                        onReply={(message) => this.handleReply(
                          selectedComment,
                          message)} comment={comment}/>

      </Container>
    )
  }
}

const mapStateToProps = (state) => ({
  currentUser: getCurrentUser(state),
  event: state.event,
  selectedComment: getSelectedComment(state),
  position: _.get(state, 'selectedComment.position', null),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  removeCommentById
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentComment)
