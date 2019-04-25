import React from 'react'
import { AccountCircle } from '@material-ui/icons'
import { Menu, MenuItem, IconButton, Toolbar, AppBar } from '@material-ui/core'
import DrawerButton from './drawer-button'
import HeaderTitle from './header-title'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getCurrentUser } from '../redux/selectors'
import { logout } from '../redux/actions'
import { history } from '../hostory'
import _ from 'lodash'
import HeaderSearch from './header-search'

const UserMenuContainer = styled.div `
  position: relative;
  z-index: 1000;
`

const UserAvatar = styled.div `
  
  img {
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }
`

const TitleContainer = styled.div `
 ${props => !props.search ? 'flex-grow: 1;' : null}
  padding-right: 50px;
  @media(max-width: 768px){
    // display: none;
  }

`

class Header extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      anchorEl: null,
    }
  }

  handleMenu = event => {
    this.setState({anchorEl: event.currentTarget})
  }

  handleClose = (op) => {

    const {user} = this.props

    const userId = _.get(user, '_id')

    this.setState({anchorEl: null}, () => {

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

  render () {
    const {user, useDrawer, useSearch} = this.props
    const {anchorEl} = this.state
    const open = Boolean(anchorEl)
    const avatar = _.get(user, 'avatar', null)
    return (
      <AppBar>
        <Toolbar>
          {useDrawer && (<DrawerButton/>)}
          <TitleContainer
            search={useSearch}
          >
            <HeaderTitle/>
          </TitleContainer>
          {useSearch && <HeaderSearch onSearch={(s) => {
            if (this.props.onSearch) {
              this.props.onSearch(s)
            }
          }}/>}
          {
            user ? (
              <UserMenuContainer>
                <IconButton
                  aria-owns={open ? 'menu-appbar' : null}
                  aria-haspopup="true"
                  onClick={this.handleMenu}
                  color="inherit"
                >
                  {avatar ? (
                    <UserAvatar className={'user-avatar'}>
                      <img src={avatar} alt={''}/>
                    </UserAvatar>
                  ) : <AccountCircle/>
                  }
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={open}
                  onClose={this.handleClose}
                >
                  <MenuItem
                    onClick={() => this.handleClose('profile')}>{_.get(
                    user, 'email', '')}</MenuItem>
                  <MenuItem
                    onClick={() => this.handleClose(
                      'logout')}>Logout</MenuItem>
                </Menu>
              </UserMenuContainer>
            ) : null
          }
        </Toolbar>
      </AppBar>
    )
  }
}

const mapStateToProps = (state) => ({
  user: getCurrentUser(state),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  logout,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Header)