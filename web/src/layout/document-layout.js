import React from 'react'
import styled from 'styled-components'
import { AccountCircle, InsertComment, Notifications } from '@material-ui/icons'
import { Manager, Target, Popper } from 'react-popper'
import {
  withStyles,
  IconButton,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Grow,
  Paper,
  Badge,
} from '@material-ui/core'
import PropTypes from 'prop-types'
import _ from 'lodash'
import classNames from 'classnames'
import { history } from '../hostory'
import LogoImage from '../assets/images/logo.png'
import DocumentHeaderTitle from '../components/documents/document-header-title'
import { logout, setNotificationCounter, setNotificationLastTime } from '../redux/actions'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getCurrentUser } from '../redux/selectors'
import CommentList from '../components/documents/comment-list'
import NotificationList from '../components/documents/notification-list'
import DocumentMenu from '../components/documents/document-menu'
import ShareDocument from '../components/documents/share-document'
import { statusColors } from '../config'

// const HeaderHeight = '100px'

const Container = styled.div`
    position: fixed;
    top: 0;
    bottom: 0;
    left: 15px;
    right: 15px;
    display: flex;
    flex-direction: column;
    flex: 0 0 200px;
    .quill{
      flex: 1;
    }
    .document-viewer-container{
      background: ${props => props.printLayout ? '#FFF' : '#eee'};
      position: relative;
      flex-grow: 1;
      overflow-y: scroll;
      overflow-x: auto;
    }
    .ql-gfx-numbers {
      display: ${props => props.isHideGfx ? 'none' : 'block'};
    }
    .ql-editor{
      min-height: 1020px;
      line-height: ${props => props.lineSpacing};
      box-shadow: ${props => props.printLayout ? 'none' : '0 0 0 0.75pt #d1d1d1,0 0 3pt 0.75pt #ccc'};
      .livex-heading{
        text-align: center;
        text-transform: uppercase;
      }
      .livex-quill-gfx{

          border-bottom: ${props => props.isHideGfx ? 'none' : '3px solid'};
          border-color: ${props => props.isHideGfx ? 'none' : statusColors.default.background};

          &::before {
            ${props => props.isHideGfx ? '' : 'content: "\\25BA"; display: inline; margin-right: 0.2em;'}
          }

          &.todo{
            border-color: ${props => props.isHideGfx ? 'none' : statusColors.todo.background};
          }
          &.rejected{
            border-color: ${props => props.isHideGfx ? 'none' : statusColors.rejected.background};
          }
          &.in-show-engine, &.done {
            border-color: ${props => props.isHideGfx ? 'none' : statusColors["in-show-engine"].background};
          }
          &.show-ready {
            border-color: ${props => props.isHideGfx ? 'none' : statusColors["show-ready"].background};
          }
          &.pending,&.pending-review{
            border-color: ${props => props.isHideGfx ? 'none' : statusColors.pending.background};
          }
          &.gfx-hide{
            border-bottom: none;
          }

      }
      .livex-quill-gfx.livex-quill-gfx-no-arrow {
        &::before {
          content: "";
          display: inline;
          margin-right: 0.2em;
        }
      }
      .livex-quill-comment{
        ${props => props.printLayout || !props.showComments ? 'background: none !important;' : null}
        &::after {
          ${props => props.printLayout || !props.showComments ? 'display: none !important;' : null}
        }
      }
    }
    .document-comment-container{
      ${props => props.printLayout ? 'display: none' : null}
    }



`
const Header = styled.div`
  display: flex;
  min-height: 63px;
  padding: 9px 15px 0 15px;
  .user-profile-menu{
    z-index: 1000;
  }
`
const Title = styled.div`
  flex: 1;
  font-size: 18px;
  display: flex;
  flex-direction: row;
`

const TitleBar = styled.div`

`

const SavedStatus = styled.span`
  font-size: 0.7em;
  opacity: 0.5;
`

const Logo = styled.div`
  width: auto;
  height: 46.3px;
  cursor: pointer;
  margin-right: 10px;
  margin-left: 15px;
  img {
    max-width: 100%;
    width: auto;
    height: 100%;
    border-radius: 8px;
  }
`

const TitleWidget = styled.div`
  height: 27px;
  width: auto;
  position: relative;
`

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  position: relative;
  z-index: 2000;
`

const UserAvatar = styled.div`

  img {
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }
`

const UserName = styled.div`
  padding: 14px 0px;
  margin-left: 10px;
`

const styles = theme => ({
  root: {
    display: 'flex',
  },
  paper: {
    marginRight: theme.spacing.unit * 2,
  },
  popperClose: {
    pointerEvents: 'none',
  },
})

class DocumentLayout extends React.Component {

  constructor(props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.handleToggle = this.handleToggle.bind(this)

    this.handleToggleComment = this.handleToggleComment.bind(this)
    this.handleToggleNotification = this.handleToggleNotification.bind(this)

    this.state = {
      title: '',
      open: false,
      notificationOpen: false,
      commentOpen: false,
    }

  }

  handleToggle = () => {
    this.setState({
      open: !this.state.open,
      notificationOpen: false,
      commentOpen: false,
    })
  }

  handleToggleComment() {
    this.setState({
      open: false,
      notificationOpen: false,
      commentOpen: !this.state.commentOpen,
    })
  }

  handleToggleNotification() {
    this.setState({
      open: false,
      notificationOpen: !this.state.notificationOpen,
      commentOpen: false,
    })

    const { user, docId } = this.props
    this.props.setNotificationLastTime(_.get(user, '_id'), docId, new Date())

    // reset the counter
    if (this.props.notificationCounter > 0) {
      this.props.setNotificationCounter(0)
    }
  }

  handleClose = (event, op) => {

    if (this.isClickingInside(event)) {
      return
    }

    const { user } = this.props
    const userId = _.get(user, '_id')

    this.setState({
      open: false,
      notificationOpen: false,
      commentOpen: false,
    }, () => {

      switch (op) {

        case 'profile':

          history.push(`/users/${userId}/edit`)

          break

        case 'logout':

          this.props.logout()

          break

        default:

          break
      }

    })
  }

  handleCloseComment = (event, op) => {

    if (this.isClickingInside(event)) {
      return
    }
    this.setState({
      open: false,
      notificationOpen: false,
      commentOpen: false,
    })
  }

  handleCloseNotification = (event, op) => {

    if (this.isClickingInside(event)) {
      return
    }
    this.setState({
      open: false,
      notificationOpen: false,
      commentOpen: false,
    })
  }

  isClickingInside = (event) => {

    const target = event.target
    if (!this.notificationTarget || !this.commentTarget || !this.target1) return false

    if (this.notificationTarget.contains(target)
      || this.commentTarget.contains(target)
      || this.target1.contains(target)) {

      return true
    }

    return false
  }

  componentDidMount() {
    this.setState({
      title: _.get(this.props, 'doc.title'),
    })

  }

  render() {
    const { classes, docId, user, printLayout, access, isHideGfx, lineSpacing, savedStatus, showComments, notificationCounter } = this.props
    const { open, notificationOpen, commentOpen } = this.state
    const avatar = _.get(user, 'avatar', null)
    const fullname = `${_.get(user, 'firstName', null)} ${_.get(user, 'lastName', null)}`
    const canEdit = _.get(access, 'write')

    return (
      <Container
        lineSpacing={lineSpacing ? lineSpacing : 1.5}
        isHideGfx={isHideGfx}
        printLayout={printLayout ? true : false}
        showComments={showComments}>
        {!printLayout && <Header id={'document-header'}>
          <Title>
            <Logo onClick={() => {
              history.push('/')
            }}>
              <img src={LogoImage} alt={'LiveX'} />
            </Logo>
            <TitleBar>
              <TitleWidget>
                <DocumentHeaderTitle docId={docId} />
                {savedStatus && <SavedStatus>{savedStatus}</SavedStatus>}
              </TitleWidget>
              <DocumentMenu onSelect={(item) => {

                if (this.props.onMenuSelect) {
                  this.props.onMenuSelect(item)
                }
              }} docId={docId} />
            </TitleBar>

          </Title>
          <Buttons>
            {/* <div ref={node => {
              this.notificationTarget = node
            }}
            >
              <Manager>
                <Target>
                  <IconButton
                    aria-owns={notificationOpen ? 'menu-notification-grow' : null}
                    aria-haspopup="true"
                    onClick={this.handleToggleNotification}
                  >
                    {
                      notificationCounter > 0 ? <Badge color="secondary" badgeContent={notificationCounter}>
                        <Notifications />
                      </Badge> : <Notifications />
                    }
                  </IconButton>
                </Target>
                <Popper
                  placement="bottom-end"
                  eventsEnabled={notificationOpen}
                  className={classNames('notification-list-menu',
                    { [classes.popperClose]: !notificationOpen })}
                >
                  <ClickAwayListener onClickAway={this.handleCloseNotification}>
                    <Grow in={notificationOpen} id="menu-notification-grow"
                      style={{ transformOrigin: '0 0 0' }}>
                      <Paper>
                        <NotificationList docId={docId} />
                      </Paper>
                    </Grow>
                  </ClickAwayListener>
                </Popper>
              </Manager>
            </div> */}

            {/* <div ref={node => {
              this.commentTarget = node
            }}
            >
              <Manager>
                <Target>
                  <IconButton
                    aria-owns={commentOpen ? 'menu-list-grow' : null}
                    aria-haspopup="true"
                    onClick={this.handleToggleComment}
                  >
                    <InsertComment />
                  </IconButton>
                </Target>
                <Popper
                  placement="bottom-end"
                  eventsEnabled={commentOpen}
                  className={classNames('comment-list-menu',
                    { [classes.popperClose]: !commentOpen })}
                >
                  <ClickAwayListener onClickAway={this.handleCloseComment}>
                    <Grow in={commentOpen} id="menu-list-grow"
                      style={{ transformOrigin: '0 0 0' }}>
                      <Paper>
                        <CommentList docId={docId} />
                      </Paper>
                    </Grow>
                  </ClickAwayListener>
                </Popper>
              </Manager>
            </div> */}

            {/* {canEdit ? <ShareDocument docId={docId} /> : null} */}
            <UserName>
              <b>{fullname}</b>
            </UserName>
            <Manager>
              <Target>
                <div
                  ref={node => {
                    this.target1 = node
                  }}
                >
                  <IconButton
                    aria-owns={open ? 'menu-list-grow' : null}
                    aria-haspopup="true"
                    onClick={this.handleToggle}
                  >
                    {avatar ? (
                      <UserAvatar className={'user-avatar'}>
                        <img src={avatar} alt={''} />
                      </UserAvatar>
                    ) : <AccountCircle />
                    }
                  </IconButton>
                </div>
              </Target>
              <Popper
                placement="bottom-end"
                eventsEnabled={open}
                className={classNames('user-profile-menu',
                  { [classes.popperClose]: !open })}
              >
                <ClickAwayListener onClickAway={this.handleClose}>
                  <Grow in={open} id="menu-list-grow"
                    style={{ transformOrigin: '0 0 0' }}>
                    <Paper>
                      <MenuList role="menu">
                        <MenuItem onClick={(event) => this.handleClose(event,
                          'profile')}>{_.get(
                            user, 'email', '')}</MenuItem>
                        <MenuItem onClick={(event) => this.handleClose(event,
                          'logout')}>Logout</MenuItem>
                      </MenuList>
                    </Paper>
                  </Grow>
                </ClickAwayListener>
              </Popper>
            </Manager>
          </Buttons>
        </Header>
        }
        {this.props.children}
      </Container>
    )
  }
}

DocumentLayout.propTypes = {
  classes: PropTypes.object.isRequired,
  onMenuSelect: PropTypes.func,
}

const Layout = withStyles(styles)(DocumentLayout)

const mapStateToProps = (state, props) => ({
  user: getCurrentUser(state),
  printLayout: state.layout.printLayout,
  access: state.documentPermission.get(_.get(props, 'docId')),
  isHideGfx: state.toggleGfx.get(_.get(props, 'docId')),
  lineSpacing: _.get(state.lineSpacing, _.get(props, 'docId')),
  savedStatus: state.layout.savedStatus,
  showComments: state.layout.showComments,
  notificationCounter: state.notification.counter,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  logout,
  setNotificationCounter,
  setNotificationLastTime,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Layout)
