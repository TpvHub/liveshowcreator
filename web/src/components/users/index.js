import React from 'react'
import Layout from '../../layout'
import _ from 'lodash'
import { AccountCircle, Add } from '@material-ui/icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Tooltip,
} from '@material-ui/core'
import { moment } from '../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import { getVisibleUsers } from '../../redux/selectors'
import { 
  deleteUser, 
  getUsers,
  getUsersByClient
} from '../../redux/actions'
import { history } from '../../hostory'
import MenuAction from '../menu-action'
import ConfirmDeleteDialog from '../documents/confirm-delete-dialog'

const Container = styled.div`
  padding: 15px 0;
 @media (min-width: 992px){
    padding: 30px 0;
 }
 font-family: 'Roboto', sans-serif;
 img.user-avatar{
  max-width: 20px;
  height: 20px;
  border-radius: 50%;
 }

 thead tr th:hover {
   color: black;
   cursor: pointer;
 }
`

const CreateUserButton = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2;
  height: 56px;
  width: 56px;
`

class Users extends React.Component {

  constructor(props) {
    super(props)

    this.goToProfile = this.goToProfile.bind(this)
    this.handleCreateAccount = this.handleCreateAccount.bind(this)

    this.state = {
      modelName: 'user',
      deleteModel: null,
      users: [],
    }

    this.sortUsersMeta = {
      name: 1,
      email: 1,
      role: 1,
      updated: 1,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.users) {
      this.setState({
        users: nextProps.users.map(user => ({
          ...user,
          name: `${_.get(user, 'firstName', '')} ${_.get(user, 'lastName', '')}`,
          role: _.join(_.get(user, 'roles', []), ', ')
        }))
      })
    }
  }

  componentDidMount() {
    this.getUsers(this.props)
  }

  getUsers = (props) => {
    const filter = { limit: 50, skip: 0 }

    const clientId = _.get(props.match.params, 'clientId', null)
    if (clientId) {
      // Get Users by Client
      props.getUsersByClient(clientId, filter)

    } else {
      // Get all users
      props.getUsers(filter)
    }
  }

  goToProfile(user) {
    history.push(`/users/${user._id}/edit`)
  }

  handleCreateAccount() {
    history.push('/users/create')
  }

  handleSort = header_name => e => {
    this.setState((prevState) => {
      prevState.users = prevState.users.sort((a, b) => {
        if (a[header_name] > b[header_name]) return this.sortUsersMeta[header_name] * -1;
        else if (a[header_name] === b[header_name]) return 0;
        else return this.sortUsersMeta[header_name];
      });
      this.sortUsersMeta[header_name] *= -1;
      return prevState;
    })
  }

  render() {

    const { users } = this.state

    const menuOptions = [
      { label: 'Edit', key: 'edit' },
      { label: 'Delete', key: 'delete' },
    ]
    return (
      <Layout>
        <Container>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell onClick={this.handleSort('name')}>Name</TableCell>
                <TableCell onClick={this.handleSort('email')}>Email</TableCell>
                <TableCell onClick={this.handleSort('role')}>Roles</TableCell>
                <TableCell onClick={this.handleSort('status')}>Status</TableCell>
                <TableCell onClick={this.handleSort('updated')} numeric>Last modified</TableCell>
                <TableCell numeric>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((n, index) => {
                const userAvatar = _.get(n, 'avatar', null)
                let roles = _.get(n, 'roles', [])
                if (!roles) {
                  roles = []
                }
                return (
                  <TableRow key={'TableRow' + _.get(n, 'email')}>
                    <TableCell>
                      <IconButton
                        onClick={() => this.goToProfile(n)}
                        aria-haspopup="true"
                        color="primary">
                        {
                          userAvatar ?
                            (<img className={'user-avatar'} src={userAvatar}
                              alt={''} />) :
                            (<AccountCircle />)
                        }
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      {_.get(n, 'name')}
                    </TableCell>
                    <TableCell>{_.get(n, 'email')}</TableCell>
                    <TableCell>{_.get(n, 'role')}</TableCell>
                    <TableCell>{_.get(n, 'status')}</TableCell>
                    <TableCell numeric>{n.updated &&
                      moment(_.get(n, 'updated')).format('LLL')}</TableCell>
                    <TableCell numeric>
                      <MenuAction onSelect={(op) => {
                        switch (op.key) {

                          case 'edit':

                            history.push(`/users/${n._id}/edit`)

                            break

                          case 'delete':

                            this.setState({
                              deleteModel: n,
                            })

                            break

                          default:

                            break
                        }
                      }} options={menuOptions} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <ConfirmDeleteDialog onClose={(action) => {
            switch (action) {
              case 'delete':
                this.props.deleteUser(_.get(this.state, 'deleteModel._id'))

                break

              case 'cancel':

                break

              default:

                break
            }

            this.setState({
              deleteModel: null,
            })

          }} open={!!this.state.deleteModel} />
          <CreateUserButton>
            <Tooltip id="tooltip-left-end" title="Create user account"
              placement="left-end">
              <Button onClick={this.handleCreateAccount} variant="fab"
                color="primary" aria-label="add">
                <Add />
              </Button>
            </Tooltip>
          </CreateUserButton>
        </Container>
      </Layout>
    )
  }
}

const mapStateToProps = (state) => ({
  users: getVisibleUsers(state),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getUsers,
  getUsersByClient,
  deleteUser,
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Users)
