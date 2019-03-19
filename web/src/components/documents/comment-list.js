import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  withStyles,
  CardContent,
  Typography
} from '@material-ui/core'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getCurrentUser, getDocumentCommentItems } from '../../redux/selectors'
import commentAvatar from '../../assets/images/comment_avatar.png'
import _ from 'lodash'
import moment from 'moment'
import { ON_EDITOR_SET_MY_CURSOR, ON_SUBMIT_ADD_COMMENT } from '../../redux/types'
import CommentReplies from './comment-replies'

const styles = {
  card: {
    minWidth: 300,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    marginBottom: 16,
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
}

const Container = styled.div `
  min-width: 300px;
  @media (min-width: 991px){
    min-width: 434px;
  }
`

const List = styled.div `
  max-height: 550px;
  overflow-y: auto;
`

const ListItem = styled.div `
  display: flex;
  flex-direction: row;
  padding: 18px 0 7px 0;
  border-bottom: 1px solid #e8e8e8;
  &:last-child {
    border-bottom: 0;
  }
`

const CommentAvatar = styled.div `
  width: 48px;
  height: 48px;

  img {
    max-width: 100%;
    max-height: 100%;
    width: 48px;
    height: 48px;
    object-fit: cover;
  }
`

const CommentContent = styled.div `
    min-height: 51px;
    padding: 0 6px;
    flex-grow: 1;
`

const CommentHeader = styled.div `
   display: flex;
`
const CommentTitle = styled.div `
  font-weight: 700;
  flex-grow: 1;
  font-size: 12px;
`

const CommentBody = styled.div `
  color: #333;
  word-wrap: break-word;
  font-size: 12px;
  padding: 8px 0;
`

const CommentTime = styled.div `
  font-size: 11px;
  color: #999;
  padding: 0;

`

class CommentList extends React.Component {

  constructor (props) {
    super(props)

    this.handleSelectComment = this.handleSelectComment.bind(this)
    this.handleReply = this.handleReply.bind(this)
  }

  /**
   * Select comment
   * @param item
   */
  handleSelectComment (item) {

    const {gfxEdit} = this.props

    if (gfxEdit === _.get(item, 'id')) {
      return
    }
    const element = _.get(item, 'elements[0]')

    if (element) {
      this.props.event.emit(ON_EDITOR_SET_MY_CURSOR, {
        range: {
          index: _.get(item, 'index'),
          length: 0,
        },
        source: 'silent',
      })

      element.scrollIntoView({block: 'center', behavior: 'smooth'})

    }

  }

  handleReply (item, message) {

    const {currentUser} = this.props

    let comment = _.get(item, 'data')
    let replies = _.get(comment, 'replies', [])

    const userId = _.get(currentUser, '_id')
    const user = {
      _id: userId,
      firstName: _.get(currentUser, 'firstName', ''),
      lastName: _.get(currentUser, 'lastName', ''),
      avatar: _.get(currentUser, 'avatar', null)

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
        index: _.get(item, 'index'),
        length: _.get(item, 'length')
      },
      comment: comment,
    })
  }

  render () {

    const {classes, comments, currentUser} = this.props

    return (
      <Container>
        <Card className={classes.card}>
          <CardContent>
            {
              comments.size > 0 ? <List>
                {comments.map((payload, index) => {

                  const comment = _.get(payload, 'data')
                  const user = _.get(comment, 'user')
                  const avatar = _.get(user, 'avatar', null)
                  const name = `${_.get(user, 'firstName', '')} ${_.get(user,
                    'lastName', '')}`
                  const created = _.get(comment, 'created', new Date())

                  return (
                    <ListItem onClick={() => this.handleSelectComment(payload)}
                              key={name+index+avatar}>
                      <CommentAvatar className={'comment-avatar'}>
                        <img src={avatar ? avatar : commentAvatar} alt={''}/>
                      </CommentAvatar>
                      <CommentContent className={'comment-content'}>
                        <CommentHeader>
                          <CommentTitle
                            className={'comment-user-name'}>{name}</CommentTitle>
                          <CommentTime>{moment(created).format('LLL')}</CommentTime>
                        </CommentHeader>
                        <CommentBody className={'comment-body'}>{_.get(comment,
                          'body', '')}</CommentBody>

                        <CommentReplies currentUser={currentUser} onReply={(message) => this.handleReply(payload, message)} comment={comment}/>
                      </CommentContent>
                    </ListItem>)
                })}
              </List> : <Typography>There is no comment.</Typography>
            }
          </CardContent>
        </Card>
      </Container>
    )
  }

}

CommentList.propTypes = {
  classes: PropTypes.object.isRequired,
}

const ComponentStyle = withStyles(styles)(CommentList)

const mapStateToProps = (state, props) => ({
  currentUser: getCurrentUser(state),
  comments: getDocumentCommentItems(state, props),
  event: state.event,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ComponentStyle)
