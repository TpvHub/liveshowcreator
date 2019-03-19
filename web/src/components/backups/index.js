import React from 'react'
import Layout from '../../layout'
import _ from 'lodash'
import { Add } from '@material-ui/icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Tooltip,
} from '@material-ui/core'
import { moment } from '../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import MenuAction from '../menu-action'
import { loadBackups } from '../../redux/actions'
import CreateBackupDialog from '../dialog/create-backup-dialog'
import RestoreDialog from '../dialog/restore-dialog'
import LoadMore from '../documents/load-more'

const Container = styled.div `
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

const CreateButton = styled.div `
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2;
  height: 56px;
  width: 56px;
`

const LIMIT = 50

class Backups extends React.Component {

  constructor (props) {
    super(props)

    this.handleCreate = this.handleCreate.bind(this)
    this.loadMore = this.loadMore.bind(this)

    this.state = {
      deleteModel: null,
      openCreateBackupDialog: false,
      restore: null,
      count: 0,

    }
  }

  componentWillMount () {

    const filter = {limit: LIMIT, skip: 0}
    this.loadMore(filter)
  }

  loadMore (filter) {
    this.setState({
      isLoadMore: true
    }, () => {
      this.props.loadBackups(filter).then((data) => {

        this.setState({
          count: data.count,
          isLoadMore: false,
        })
      }).catch(err => {
        this.setState({
          isLoadMore: false
        })
      })
    })

  }

  handleCreate () {

    this.setState({
      openCreateBackupDialog: true
    })
  }

  render () {

    const {models} = this.props

    const menuOptions = [
      {label: 'Restore', key: 'restore'},
    ]
    return (
      <Layout>
        <Container>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Snapshot</TableCell>
                <TableCell>Type</TableCell>
                <TableCell numeric>Status</TableCell>
                <TableCell numeric>Created</TableCell>
                <TableCell numeric>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((n, index) => {

                const status = _.get(n, 'status')
                return (
                  <TableRow key={`TableRow-${index}`}>
                    <TableCell>{_.get(n, 'snapshot')}</TableCell>
                    <TableCell>{_.get(n, 'backupType')}</TableCell>
                    <TableCell numeric>{status}</TableCell>
                    <TableCell numeric>{n.createdAt &&
                    moment(_.get(n, 'createdAt')).format('LLL')}</TableCell>
                    <TableCell numeric>
                      {status === 'Done' && (<MenuAction onSelect={(op) => {
                        switch (op.key) {

                          case 'restore':

                            this.setState({
                              restore: n
                            })

                            break

                          default:

                            break
                        }
                      }} options={menuOptions}/>)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>


          <LoadMore
            hideButton={false}
            count={this.props.models.size}
            maxCount={this.state.count}
            onLoad={() => {
              // need request load more document
              this.loadMore({
                limit: LIMIT,
                skip: this.props.models.size,
              })
            }} loading={this.state.isLoadMore}/>

          <CreateButton>
            <Tooltip id="tooltip-left-end" title="Create backup snapshot"
                     placement="left-end">
              <Button onClick={this.handleCreate} variant="fab"
                      color="primary" aria-label="add">
                <Add/>
              </Button>
            </Tooltip>
          </CreateButton>
          {
            this.state.openCreateBackupDialog && (
              <CreateBackupDialog
                onClose={() => {
                  this.setState({
                    openCreateBackupDialog: false
                  })
                }}
                open={this.state.openCreateBackupDialog}/>
            )
          }
          {
            this.state.restore && (
              <RestoreDialog
                onClose={() => this.setState({restore: null})}
                backup={this.state.restore}
                open={!!this.state.restore}/>
            )
          }
        </Container>
      </Layout>
    )
  }
}

const mapStateToProps = (state) => ({
  models: state.backup.valueSeq()
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  loadBackups,
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Backups)
