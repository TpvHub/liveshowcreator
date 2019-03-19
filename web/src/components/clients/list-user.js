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
// import { moment } from '../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import { getUserFromClientList } from '../../redux/selectors'
import { deleteUser, getUsersFromClient } from '../../redux/actions'
import { history } from '../../hostory'
// import { config } from '../../config'
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
    }
  }

  componentDidMount() {
    // const { currentUser } = this.props
    const idTeamDrive = _.get(this.props, 'match.params.id')
    // if (idTeamDrive) {
    //   this.setState({ idTeamDrive })
    // }
    // // TODO: refactor using redux + service
    // axios.get(`${config.api}/teamdrive/list`, {
    //   // headers: {
    //   //   'Content-Type': 'multipart/form-data',
    //     // 'Authorization': token,
    //   // },
    // }).then((res) => {

    //   const users = _.get(res, 'data.result', [])
    //   this.setState({ users })

    // }).catch((err) => {
    //   console.log('err', err)
    // })

    const filter = { teamdriveId: idTeamDrive }
    this.props.getUsersFromClient(filter)
  }

  goToProfile(user) {
    history.push(`${window.location.pathname}/${user._id}/edit`)
  }

  goToUserPage = (user) => {
    history.push(`/users/${user._id}/users`)
  }

  handleCreateAccount() {
    history.push(`${window.location.pathname}/create`)
  }

  render() {

    const { idTeamDrive } = this.state
    const { users } = this.props
    let teamDrive, permission = []
    if (idTeamDrive) {
      teamDrive = users && users.filter(_user => _user.id === idTeamDrive)
      permission = _.get(teamDrive, '[0].permission', [])
    }

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
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Online</TableCell>
                <TableCell>Shows</TableCell>
                <TableCell>Last Access</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!idTeamDrive && users && users.map((n, index) => {
                const userAvatar = _.get(n, 'avatar', null)
                let name = _.get(n, 'firstName') + ' ' + _.get(n, 'lastName')
                let email = _.get(n, 'email')
                return (
                  <TableRow key={'TableRow' + name}>
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
                      {name}
                    </TableCell>
                    <TableCell>
                      {email}
                    </TableCell>
                    {/* <TableCell style={{ cursor: "pointer" }} onClick={() => this.goToUserPage(n)}>{_.get(n, 'isOnline', 0)}</TableCell> */}
                    <TableCell>{_.get(n, 'isOnline', 0)}</TableCell>
                    <TableCell>{_.get(n, 'showsCount', 0)}</TableCell>
                    <TableCell>{'N/A'}</TableCell>
                    <TableCell numeric>
                      <MenuAction onSelect={(op) => {
                        switch (op.key) {
                          
                          case 'edit':
                            history.push(`/clients/${_.get(this.props, 'match.params.id')}/users/${n._id}/edit`)
                            break

                          case 'delete':
                            this.setState({
                              deleteModel: n,
                            })

                            break

                          default:

                            break
                        }
                      }} options={menuOptions}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}

              {idTeamDrive && permission && permission.map((n, index) => {
                let id = _.get(n, 'id')
                let name = _.get(n, 'displayName')
                let email = _.get(n, 'email')
                let role = _.get(n, 'role')

                return (
                  <TableRow key={'TableRow' + id}>
                    <TableCell>
                      {id}
                    </TableCell>
                    <TableCell>
                      {name}
                    </TableCell>
                    {/* <TableCell onClick={() => this.goToUserPage(n)}>{_.get(n, 'permission.length', 0)}</TableCell> */}
                    <TableCell>{email}</TableCell>
                    <TableCell>{role}</TableCell>
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
  currentUser: _.get(state.app, 'currentUser') || {},
  users: getUserFromClientList(state),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getUsersFromClient,
  deleteUser,
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Users)
