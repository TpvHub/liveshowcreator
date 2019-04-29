import React from 'react'
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import DashboardIcon from '@material-ui/icons/Dashboard'
import SupervisorAccount from '@material-ui/icons/SupervisorAccount'
import { Computer } from '@material-ui/icons'
import { history } from '../hostory'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import _ from 'lodash'

class Sidebar extends React.Component {

  checkAccess(roles) {

    const { user } = this.props
    let userRoles = _.get(user, 'roles', [])

    if (userRoles === null) {
      userRoles = []
    }

    let allow = false

    if (_.includes(roles, '*')) {
      return true
    }

    _.each(roles, (r) => {
      if (_.includes(userRoles, r)) {
        allow = true
      }
    })

    return allow
  }

  render() {

    const items = [
      // Teams, Members, Shows
      {
        label: 'Shows',
        icon: <DashboardIcon />,
        path: '/',
        roles: ['*']
      },
      {
        label: 'Clients',
        icon: <SupervisorAccount />,
        path: '/clients',
        roles: ['administrator', 'staff']
      },
      {
        label: 'Users',
        icon: <SupervisorAccount />,
        path: '/users',
        roles: ['administrator', 'staff']
      },
      {
        label: 'Members',
        icon: <SupervisorAccount />,
        path: '/users',
        roles: ['client']
      },
    ]

    return (
      <List style={{ width: 250 }}>
        {
          items.map((item, index) => {

            const accessible = this.checkAccess(_.get(item, 'roles', []))
            return accessible ? (
              <ListItem key={'ListItem' + item.label} button onClick={() => {
                history.push(`${item.path}`)
              }}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={`${item.label}`} />
              </ListItem>
            ) : null
          })
        }
      </List>
    )
  }
}

const mapStateToProps = (state) => ({
  user: state.app.currentUser,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)
export default connect(mapStateToProps, mapDispatchToProps)(Sidebar)