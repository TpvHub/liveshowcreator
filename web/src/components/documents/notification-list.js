import React from 'react'
import _ from 'lodash'
import moment from 'moment'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { EDIT_GFX } from '../../redux/types'
import { getCurrentUser } from '../../redux/selectors'
import { toggleSidebar, toggleMiniPlayer } from '../../redux/actions'
import {
  Card,
  CardContent,
  Typography
} from '@material-ui/core'
import styled from 'styled-components'
import commentAvatar from '../../assets/images/comment_avatar.png'


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
  cursor: pointer;
  &:last-child {
    border-bottom: 0;
  }
`

const Avatar = styled.div `
  .avatar {
    position: relative;
    height: 0;
    width: 30px;
    padding-bottom: 30px;
    overflow: hidden;
    border-radius: 50%;

    img {
      position: absolute;
      width: auto;
      height: 100%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%)
    }
  }
`

const NotificationBody = styled.div `
  min-height: 30px;
  padding: 0 10px;
  flex-grow: 1;

`

const NotificationTime = styled.div `
  font-size: 0.8em;
  line-height: 2;
  font-weight: bold;
  max-width: 70px;
  border-right: solid 1px #333;
  padding:0.8em;
  text-align:right;

`

class NotificationList extends React.Component {

  constructor (props) {
    super(props)

    this.handleClickItem = this.handleClickItem.bind(this)
  }

  handleClickItem (payload) {
    if (_.get(payload, 'type') === 'gfx') {
      this.showEditGfx(_.get(payload, 'data.id'))
    }
  }

  showEditGfx (id) {
    if (id) {
      this.props.toggleSidebar(true)
      this.props.selectEditGfx(id)
      this.props.toggleMiniPlayer(true)
    }
  }

  formatNotificationMessage (payload) {

    const { currentUser } = this.props
    const data = _.get(payload, 'data')
    const user = _.get(payload, 'user')
    const name = `${_.get(user, 'firstName', '')} ${_.get(user, 'lastName', '')}`

    let message = ''
    if (_.get(payload, 'type') === 'gfx') {
      switch (_.get(payload, 'action')) {
        case 'new':
          message = `<strong>${name}</strong> has added the GFX <strong >${_.get(data, 'title')}</strong>.`
          break;

        case 'update_status':
          if (data.status)
            message = `<strong>${name}</strong> has changed the status of GFX <strong>${_.get(data, 'title')}</strong> to <strong>${_.get(data, 'status')}</strong>.`
          else
            message = `<strong>${name}</strong> has remove the status of GFX <strong>${_.get(data, 'title')}</strong>.`
          break;

        case 'update_assign':
          const assign = _.get(data, 'assign._id') === _.get(currentUser, '_id')
            ? 'you' : `<strong>${_.get(data, 'assign.firstName', '')} ${_.get(data, 'assign.lastName', '')}</strong>`
          message = `<strong>${name}</strong> has assigned the GFX <strong>${_.get(data, 'title')}</strong> to ${assign}.`
          break;

        case 'update_title':
          message = `<strong>${name}</strong> has changed the title of GFX to <strong>${_.get(data, 'title')}</strong>.`
          break;

        case 'update_files':
          message = `<strong>${name}</strong> has updated the assets of GFX <strong>${_.get(data, 'title')}</strong>.`
          break;

        default:
          message = `<strong>${name}</strong> has updated the GFX <strong>${_.get(data, 'title')}</strong>.`
          break;
      }
    }

    // TODO: find a safer way to render HTML
    return (
      <div dangerouslySetInnerHTML={{__html: message}} />
    )
  }

  render () {
    const {
      // docId,
      // currentUser,
      notification
    } = this.props
    return (
      <Container>
        <Card>
          <CardContent>
            {
              notification.items.length > 0 ? <List>
                {notification.items.map((payload, index) => {

                  const user = _.get(payload, 'user')
                  const avatar = _.get(user, 'avatar', null)
                  const time = _.get(payload, 'time', new Date())

                  return (
                    <ListItem key={'ListItem'+index+user} onClick={() => this.handleClickItem(payload)}>
                      <Avatar>
                        <div className={'avatar'}>
                          <img src={avatar ? avatar : commentAvatar} alt={''}/>
                        </div>
                      </Avatar>
                      <NotificationBody className={'notification-body'}>
                        {this.formatNotificationMessage(payload)}
                      </NotificationBody>
                      <NotificationTime>{moment(time).format('MMM D HH:mm')}</NotificationTime>
                    </ListItem>
                  )
                })}
              </List> : <Typography style={{ textAlign: 'center', opacity: '0.5' }}>All caught up!</Typography>
            }
          </CardContent>
        </Card>
      </Container>
    )
  }
}

const mapStateToProps = (state, props) => ({
  currentUser: getCurrentUser(state),
  notification: state.notification,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleSidebar,
  toggleMiniPlayer,
  selectEditGfx: (id) => {
    return (dispatch) => {
      dispatch({
        type: EDIT_GFX,
        payload: id,
      })
    }
  },
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(NotificationList)
