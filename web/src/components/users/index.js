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

import CustomTable from '../tables'
import CustomSelect from '../form/select'


const columnData = [
  { id: 'avatar', numeric: false, disablePadding: true, label: '#' },
  { id: 'name', numeric: false, disablePadding: false, label: 'Name' },
  { id: 'email', numeric: false, disablePadding: false, label: 'Email' },
  { id: 'role', numeric: false, disablePadding: false, label: 'Roles' },
  { id: 'status', numeric: false, disablePadding: false, label: 'Status' },
  { id: 'updated', numeric: false, disablePadding: false, label: 'Last modified' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions' },
];

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
      dataTable: [],
      filter: {
        role: 'all',
        status: 'all'
      }
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
      this.setDataTable(nextProps.users)
    }
  }

  componentDidMount() {
    this.getUsers(this.props)
  }

  get clientId() {
    return _.get(this.props.match.params, 'clientId', null)
  }

  filterUsers = u => {
    const { filter } = this.state
    let check = Object.entries(filter).reduce((acc, [key, value]) => {
      return value !== 'all' ? (
        u[key] === value ? acc === null ? true : acc && true : false 
      )
        : acc
    }, null)

    return check == null ? true : check
  }

  setDataTable = (users) => {
    this.setState({
      dataTable: users.toArray().map((n, index) => {
        return {
          id: index + 1,
          avatar: this.geAvatar(n),
          name: `${_.get(n, 'firstName', '')} ${_.get(n, 'lastName', '')}`,
          email: _.get(n, 'email', null),
          role: _.join(_.get(n, 'roles', []), ', '),
          status: _.get(n, 'status', null),
          updated: _.get(n, 'updated', null),
          actions: this.getActions(n)
        }
      }).filter(this.filterUsers)
    })
  }

  geAvatar = (n) => {
    const userAvatar = _.get(n, 'avatar', null)
    return (
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
    )
  }

  getActions = (n) => {
    const menuOptions = [
      { label: 'Edit', key: 'edit' },
      { label: 'Delete', key: 'delete' },
    ]
    return (
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
    )
  }

  getUsers = (props) => {
    const { currentUser } = this.props
    const filter = { limit: 50, skip: 0 }

    const clientId = this.clientId || _.get(currentUser, 'client._id', null)

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
    if (this.clientId) {
      history.push(`/clients/${this.clientId}/users/create`)
    } else {
      history.push('/users/create')
    }
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

  setFilter = (filter) => data => {
    this.setState({
      filter: {
        ...this.state.filter,
        [filter]: data
      }
    })
  }

  render() {

    const { users, dataTable } = this.state
    const { currentUser } = this.props

    const menuOptions = [
      { label: 'Edit', key: 'edit' },
      { label: 'Delete', key: 'delete' },
    ]

    return (
      <Layout>
        <Container>
          <CustomTable
            tableName='Users table'
            tableColumnData={columnData}
            data={dataTable.filter(this.filterUsers)}
            ExtraFilter={{
              numExtra: 2,
              Component: <React.Fragment>
                <CustomSelect
                  name='filerRole'
                  className='selector-filerRole'
                  options={['all', 'administrator', 'staff', 'user', 'client']}
                  label='Select Role'
                  required
                  onChange={this.setFilter('role')}
                  value={this.state.filter.role}
                />
                <CustomSelect
                  name='filerStatus'
                  className='selector-filerStatus'
                  options={['all', 'pending', 'actived', 'blocked']}
                  label='Select Status'
                  required
                  onChange={this.setFilter('status')}
                  value={this.state.filter.status}
                />
              </React.Fragment>
            }}
          />

          {/* <Table>
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
              {users.filter(this.filterUsers).map((n, index) => {
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
          </Table> */}


          <ConfirmDeleteDialog onClose={(action) => {
            switch (action) {
              case 'delete':
                this.props.deleteUser(
                  _.get(this.state, 'deleteModel._id'),
                  this.clientId || _.get(currentUser, 'client._id', null)
                )

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
  currentUser: state.app.currentUser,
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
