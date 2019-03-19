import React from 'react'
import styled from 'styled-components'
import { Button } from '@material-ui/core'
import _ from 'lodash'
import commentAvatar from '../../assets/images/comment_avatar.png'
import moment from 'moment/moment'

const Container = styled.div `
  width: 100%;
  margin-top: 20px;
  
  .reply-form{
    width: 100%;
  }
  .reply-form{
    background-color: #eff2f9;
    border-radius: 0 0 6px 6px;
    padding: 6px;
    position: relative;
  }
  textarea{
    background-color: #fff;
    border: 1px solid #c9d4ec;
    min-height: 23px;
    font-size: 12px;
    width: 100%;
    padding: 5px 4px;
    margin: 0;
  }
  .reply-form-actions{
    margin-top: 10px;
    padding-bottom: 10px;
    button{
      margin-right: 8px;
    }
  }
`

const ListItem = styled.div `
  display: flex;
  flex-direction: row;
  margin: 4px 12px 3px 0;
  padding: 6px 6px 0 6px;
  background: ${props => props.isMe ? '#FFF' : 'eff2f9'};
 
`

const CommentAvatar = styled.div `
  width: 24px;
  height: 24px;
  
  img {
    max-width: 100%;
    max-height: 100%;
    width: 24px;
    height: 24px;
    object-fit: cover;
  }
`

const CommentContent = styled.div `
    min-height: 24px;
    padding: 0 6px;
    flex-grow: 1;
`

const CommentTitle = styled.div `
  font-weight: 700;
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

class CommentReplies extends React.Component {

  constructor (props) {

    super(props)

    this.onSubmit = this.onSubmit.bind(this)
    this.onChange = this.onChange.bind(this)

    this.state = {
      value: '',
      active: false
    }
  }

  /**
   * Handle submit reply
   * @param e
   */
  onSubmit (e) {
    e.preventDefault()

    if (this.props.onReply) {
      this.props.onReply(this.state.value)
    }

    this.setState({
      value: '',
      active: false,
    })

  }

  /**
   * on Value change
   * @param e
   */
  onChange (e) {
    this.setState({
      value: e.target.value,
    })
  }

  render () {
    const {value} = this.state
    const {comment, currentUser} = this.props

    const replies = _.get(comment, 'replies', [])

    return (
      <Container>

        <div className={'list-relies'}>
          {replies.map((comment, index) => {

            const user = _.get(comment, 'user')
            const avatar = _.get(user, 'avatar', null)
            const name = `${_.get(user, 'firstName', '')} ${_.get(user,
              'lastName', '')}`
            const created = _.get(comment, 'created', new Date())

            const isMe = _.get(currentUser, '_id') === _.get(user, '_id')
            return (

              <ListItem className={'comment-reply-item'} isMe={isMe} key={'comment-reply-item'+index}>
                <CommentAvatar>
                  <img src={avatar ? avatar : commentAvatar} alt={''}/>
                </CommentAvatar>
                <CommentContent>
                  <CommentTitle>{name}</CommentTitle>
                  <CommentTime>{moment(created).format('LLL')}</CommentTime>
                  <CommentBody className={'comment-body'}>{_.get(comment,
                    'body', '')}</CommentBody>
                </CommentContent>

              </ListItem>
            )

          })}

        </div>

        <div className={'reply-form'}>

          <form onSubmit={this.onSubmit}>
            <textarea onClick={() => {
              this.setState({
                active: true
              })
            }} placeholder={'Add a comment'} value={value} onChange={this.onChange}/>
            {
              this.state.active && (
                <div className={'reply-form-actions'}>
                  <Button disabled={!value || value === ''} variant={'raised'} type={'submit'} size={'small'}
                          color={'primary'}>Reply</Button>
                  <Button onClick={() => {

                    this.setState({
                      active: false
                    })
                  }} type={'button'} size={'small'}>Cancel</Button>
                </div>
              )
            }
          </form>
        </div>

      </Container>
    )
  }

}

export default CommentReplies