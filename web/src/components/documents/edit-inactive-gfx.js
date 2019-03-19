import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { TextField } from '@material-ui/core'
import Autocomplete from '../form/autocomplete'
import Select from '../form/select'
import _ from 'lodash'
//import DrivePicker from '../form/drive-picker'
import {
  EDIT_INACTIVE_GFX,
} from '../../redux/types'
import { getCurrentUser, getDocument, getUserSearchList } from '../../redux/selectors'
import { downloadFile, searchUsers, updateInactiveGfxItem } from '../../redux/actions'
import { STATUSES } from '../../config'

const Container = styled.div `


`

class EditInactiveGfxCard extends React.Component {

  constructor (props) {

    super(props)

    this.handleSubmit = this.handleSubmit.bind(this)
    this.getDefaultAssignValue = this.getDefaultAssignValue.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.handleRemoveFile = this.handleRemoveFile.bind(this)
    this.handleUpdate = this.handleUpdate.bind(this)

    this.update = _.debounce(this.handleUpdate, 500)

    this.state = {
      id: null,
      title: '',
      body: '',
      status: '',
      assign: [],
      userId: '',
      user: null,
      files: [],
      documentId: null,
      created: null,
      updated: null,
    }

  }

  handleSubmit (files = null) {

    const {gfx, currentUser, users, docId} = this.props

    const userId = _.get(currentUser, '_id')
    const user = {
      _id: userId,
      firstName: _.get(currentUser, 'firstName'),
      lastName: _.get(currentUser, 'lastName'),
      avatar: _.get(currentUser, 'avatar'),
    }

    let card = {
      id: _.get(gfx, 'id'),
      title: this.state.title,
      body: this.state.body,
      status: this.state.status,
      assign: users.find(
        u => u._id === _.get(this.state.assign, '[0].key', '')),
      userId: this.state.userId ? this.state.userId : userId,
      user: this.state.user ? this.state.user : user,
      documentId: docId,
      files: files ? files : _.get(gfx, 'data.files', []), // this.state.files,
      created: this.state.created ? this.state.created : new Date(),
      updated: this.state.created ? new Date() : null,
    }

    const data = {
      id: card.id,
      documentId: docId,
      data: card
    }

    this.update(data)

  }

  handleUpdate (data) {
    this.props.updateInactiveGfxItem(data)
  }

  handleCancel () {

    this.props.cancel()
  }

  componentWillMount () {

    this.props.searchUsers('', {limit: 50, skip: 0})
  }

  componentDidMount () {
    const {gfx, docId} = this.props

    const payload = _.get(gfx, 'data')

    const assignUser = _.get(payload, 'assign', null)

    let assign = []

    if (assignUser) {
      assign.push({
        label: `${_.get(assignUser, 'firstName', '')} ${_.get(assignUser,
          'lastName', '')}`,
        key: _.get(assignUser, '_id'),
      })
    }

    this.setState({
      id: _.get(payload, 'id'),
      title: _.get(payload, 'title', ''),
      body: _.get(payload, 'body', ''),
      status: _.get(payload, 'status', ''),
      assign: assign,
      assignUserId: _.get(assignUser, '_id'),
      userId: _.get(payload, 'userId'),
      user: _.get(payload, 'user', null),
      documentId: _.get(payload, 'documentId', docId),
      files: _.get(payload, 'files', []),
      created: _.get(payload, 'created', null),
      updated: _.get(payload, 'updated', null),
    })
  }

  getDefaultAssignValue () {

    return this.state.assign
  }

  handleRemoveFile (file) {

    let files = this.state.files.filter(
      (i) => _.get(i, 'id') !== _.get(file, 'id'))

    this.setState({
      files: files,
    })
  }

  render () {

    const {
      gfx,
      users,
      // doc
    } = this.props

    let options = []

    users.forEach((u) => {
      options.push({
        label: `${u.firstName} ${u.lastName}`,
        key: u._id,
      })
    })

    //const driveId = _.get(doc, 'driveId', null)

    return (
      <Container>

        {
          gfx && (
            <div>
              <div>
                <div className={'gfx-form'}>
                  <TextField
                    onChange={(e) => {
                      this.setState({
                        title: e.target.value,
                      }, () => this.handleSubmit())
                    }}
                    fullWidth
                    label="Title"
                    id="gfx-input-title"
                    value={this.state.title}
                  />
                  <Autocomplete
                    label={'Assign'}
                    defaultValue={this.getDefaultAssignValue()}
                    onChange={(selected) => {
                      console.log('On Select changed', selected)
                      this.setState({
                        assign: selected,
                      }, () => this.handleSubmit())

                    }} options={options}/>

                  <Select
                    className={'gfx-status-select'}
                    label={'Status'}
                    defaultValue={_.get(gfx, 'data.status', '')}
                    onChange={(selected) => {

                      this.setState({
                          status: selected,
                        }, () => this.handleSubmit()
                      )
                    }} options={STATUSES}/>

                  <TextField
                    fullWidth
                    multiline={true}
                    rows={2}
                    onChange={(e) => {
                      this.setState({
                        body: e.target.value,
                      }, () => this.handleSubmit())
                    }}
                    label={'Note'}
                    id={'gfx-note'}
                    value={_.get(this.state, 'body', '')}
                  />

                  {/* <DrivePicker rootId={driveId} onClose={(event) => {

                    switch (event.type) {

                      case 'ok':

                        // handle update gfx with files
                        let files = this.state.files

                        _.each(_.get(event, 'payload.selected'), (file) => {

                          const isFileExist = files.find(
                            (i) => _.get(i, 'id') === _.get(file, 'id'))
                          if (!isFileExist) {
                            files.push(file)
                          }

                        })

                        this.setState({
                          files: files,
                        }, () => {
                          this.handleSubmit(files)
                        })

                        break

                      default:

                        break
                    }
                  }}/> */}

                </div>
              </div>
            </div>
          )
        }

      </Container>
    )
  }
}

const mapStateToProps = (state, props) => ({
  currentUser: getCurrentUser(state),
  users: getUserSearchList(state),
  doc: getDocument(state, props)
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  searchUsers,
  downloadFile,
  updateInactiveGfxItem,
  cancel: () => {
    return (dispatch) => {
      dispatch({
        type: EDIT_INACTIVE_GFX,
        payload: null,
      })
    }
  },
  done: () => {
    return (dispatch) => {
      dispatch({
        type: EDIT_INACTIVE_GFX,
        payload: null,
      })
    }
  },
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(EditInactiveGfxCard)
