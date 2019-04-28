import React from 'react'
import Layout from '../../layout'
import _ from 'lodash'
// import axios from 'axios'
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
import {
  getVisibleClients,
  // getUsersOnlineList,
  // getClientRichInfoList
} from '../../redux/selectors'
import {
  getClients,
  deleteClient,
  // getListUsersOnline,
  // getClientRichInfo,
  // deleteClientRichInfo
} from '../../redux/actions'
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

class Clients extends React.Component {

  constructor(props) {
    super(props)

    this.goToProfile = this.goToProfile.bind(this)
    this.handleCreateAccount = this.handleCreateAccount.bind(this)

    this.state = {
      modelName: 'user',
      deleteModel: null,
      teamDriveModel: new Map()
    }
  }

  componentWillReceiveProps(nextProps) {
    // const {
    //   clientRichInfoList,
    //   clients,
    //   usersOnlineList
    // } = nextProps

    // const { teamDriveModel } = this.state
    // if (clients.size == 0) {
    //   teamDriveModel.clear();
    // } else {
    //   clientRichInfoList.toArray().forEach(_item => {
    //     if (teamDriveModel.get(_item._id)) {
    //       teamDriveModel.set(_item._id, Object.assign(teamDriveModel.get(_item._id), _item))
    //     }
    //   })

    //   clients.toArray().forEach(_item => {
    //     teamDriveModel.set(_item.teamdriveId, Object.assign(teamDriveModel.get(_item.teamdriveId) || {}, _item))
    //   })

    //   usersOnlineList.toArray().forEach(_item => {
    //     const lastItem = teamDriveModel.get(_item.teamdriveId) || {}
    //     const totalOnline = _.get(lastItem, 'totalOnline', 0) + 1
    //     const oldUsersOnline = _.get(lastItem, 'usersOnline', [])
    //     if (oldUsersOnline.filter(u => u._id === _item._id).length === 0) {
    //       const usersOnline = [...oldUsersOnline, _item]
    //       teamDriveModel.set(_item.teamdriveId, Object.assign(lastItem, { totalOnline, usersOnline }))
    //     }
    //   })
    // }

    // teamDriveModel.delete('0')

    // this.setState({ teamDriveModel })

  }

  componentDidMount() {
    const filter = { limit: 50, skip: 0 }
    this.props.getClients(filter)
    // this.props.getListUsersOnline()
    // this.props.getClientRichInfo()

  }

  setClients = (clients) => {
    this.setClients({
      clients
    })
  }

  goToProfile(client) {
    history.push(`/clients/${client._id}/edit`)
  }

  goToUserPage = (client) => {
    history.push(`/clients/${client._id}/users`)
  }

  handleCreateAccount() {
    history.push('/clients/create')
  }

  render() {
    const { teamDriveModel } = this.state
    const { clients } = this.props
    // let teamDrive, permission = []

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
                <TableCell>Team's Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Online</TableCell>
                <TableCell>Shows</TableCell>
                <TableCell>Drive Use</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((n, index) => {
                const _id = _.get(n, '_id', null)
                const teamName = _.get(n, 'teamName', null)
                const email = _.get(n, 'email', null)
                const numOfUsers = _.get(n, 'numOfUsers', 0)
                const numOfUsersOnline = _.get(n, 'numOfUsersOnline', 0)
                const numOfShows = _.get(n, 'numOfShows', 0)
                const driveUsed = _.get(n, 'driveUsed', 0.00)
                const status = _.get(n, 'status', 'pending')

                const userAvatar = _.get(n, 'avatar', null)

                // let name = `${_.get(n, 'firstName')} ${_.get(n, 'lastName')}`

                return (
                  <TableRow key={'Table_Client_' + teamName + _id}>
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
                      {teamName}
                    </TableCell>
                    <TableCell>
                      {email}
                    </TableCell>

                    <TableCell style={{ cursor: "pointer" }} onClick={() => this.goToUserPage(n)}>{numOfUsers}</TableCell>
                    <TableCell>{numOfUsersOnline}</TableCell>
                    <TableCell>{numOfShows}</TableCell>
                    <TableCell>{driveUsed}</TableCell>
                    
                    <TableCell>{status}</TableCell>

                    <TableCell numeric>
                      <MenuAction onSelect={(op) => {
                        switch (op.key) {

                          case 'edit':

                            history.push(`/clients/${n._id}/edit`)

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
            </TableBody>
          </Table>
          <ConfirmDeleteDialog onClose={(action) => {
            switch (action) {
              case 'delete':
                this.props.deleteClient(
                  _.get(this.state, 'deleteModel._id'),
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
            <Tooltip id="tooltip-left-end" title="Create client account"
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
  clients: getVisibleClients(state),
  // clientRichInfoList: getClientRichInfoList(state),
  // usersOnlineList: getUsersOnlineList(state),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getClients,
  deleteClient,
  // getListUsersOnline,
  // getClientRichInfo,
  // deleteClientRichInfo
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Clients)
