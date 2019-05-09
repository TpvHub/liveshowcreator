import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { TextField, CircularProgress } from '@material-ui/core'
import Autocomplete from '../form/autocomplete'
import Select from '../form/select'
import _ from 'lodash'
import {
  EDIT_GFX,
  ON_SUBMIT_ADD_GFX_CARD,
} from '../../redux/types'
import { getCurrentUser, getDocument, getUserSearchList } from '../../redux/selectors'
import {
  downloadFile,
  searchUsers,
  toggleDrive,
  updateGfxCard,
  showMessage,
  setDriveEditGfx,
} from '../../redux/actions'
import { STATUSES, gfxTitleMaxLength } from '../../config'
import NoteInput from './gfx-note-input'
import AssetGrid from './asset-grid'
import { moment } from '../../config'
import download from '../../helper/download'
import { GfxCartTitle } from './gfx-list'

const Container = styled.div`
`

const GfxDate = styled.div`
  font-weight: 400;
  font-size: 11px;
  color: rgba(0,0,0,0.5);
  margin-top: 1em;

`

const DivProgress = styled.div`
  display: flex;
  color: white;
  p {
    padding-left: 20px;
  }
`

class EditGfxCard extends React.Component {

  constructor(props) {

    super(props)

    this.handleSubmit = this.handleSubmit.bind(this)
    this.getDefaultAssignValue = this.getDefaultAssignValue.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
    this.handleRemoveFile = this.handleRemoveFile.bind(this)
    this.handleOpenDrive = this.handleOpenDrive.bind(this)

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

  handleSubmit(files = null, old_files = null) {

    const { event, gfx, currentUser, users, docId } = this.props

    const userId = _.get(currentUser, '_id')
    const user = {
      _id: userId,
      firstName: _.get(currentUser, 'firstName'),
      lastName: _.get(currentUser, 'lastName'),
      avatar: _.get(currentUser, 'avatar'),
    }

    // save the previous data as history
    let gfxNonHistory = _.cloneDeep(gfx.data)
    if (old_files) _.set(gfxNonHistory, 'files', old_files)
    let history = _.cloneDeep(_.get(gfxNonHistory, 'history', []))
    _.unset(gfxNonHistory, 'history')
    history.unshift(gfxNonHistory)

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
      history: _.slice(history, 0, 10), // limit the history within 10 items
    }

    event.emit(ON_SUBMIT_ADD_GFX_CARD, {
      payload: card,
      range: {
        index: _.get(gfx, 'index', 0),
        length: _.get(gfx, 'length', 0),
      },
    })

  }

  handleCancel() {

    this.props.cancel()
  }

  handleOpenDrive() {

    this.props.toggleDrive(null, {
      gfxEdit: _.get(this, 'props.gfx')
    })
  }

  componentWillMount() {

    this.props.searchUsers('', { limit: 50, skip: 0 })
  }

  componentDidMount() {

    const { gfx, docId } = this.props

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

    // reset the drive.gfxEdit
    this.props.setDriveEditGfx(gfx)
  }

  getDefaultAssignValue() {

    return this.state.assign
  }

  handleRemoveFile(file) {

    let files = this.state.files.filter(
      (i) => _.get(i, 'id') !== _.get(file, 'id'))

    this.setState({
      files: files,
    })
  }

  isUserThisTeam = (u) => {
    const { doc } = this.props
    if (doc && _.get(doc, 'client')) {
      return _.includes(_.get(doc, 'client.teamMembers'), u._id)
    } else return false
  }

  render() {

    const {
      gfx,
      users,
    } = this.props

    let options = users.toArray()
      .filter(this.isUserThisTeam)
      .map(u => ({
        label: `${u.firstName} ${u.lastName}`,
        key: u._id,
      }))

    const defaultStatus = _.get(gfx, 'data.status', '')

    const created = _.get(gfx, 'data.created')
    const updated = _.get(gfx, 'data.updated')
    return (
      <Container>
        <GfxCartTitle {...this.props.cardTitleProps} />
        {
          gfx && (
            <div>
              <AssetGrid
                gfx={gfx}
                onOpenDrive={this.handleOpenDrive}
                onSave={(files) => {

                  // let update gfx files
                  const _selection = {
                    index: _.get(gfx, 'index'),
                    length: _.get(gfx, 'length')
                  }
                  let card = JSON.parse(JSON.stringify(_.get(gfx, 'data')))
                  card = _.setWith(card, 'files', files)
                  card.updated = new Date()
                  this.props.updateGfxCard(card, _selection)
                }}
                onDownload={async (_files) => {
                  for (let i in _files) {
                    const itemFile = _files[i];
                    try {
                      this.props.showMessage({
                        isRawBody: true,
                        body: <DivProgress><CircularProgress /><p>Please wait while your file loads then downloads.</p></DivProgress>,
                        duration: 60000000,
                      })
                      await this.props.downloadFile(itemFile.id).then((data) => {
                        download(data, itemFile.name, data.type)
                        this.props.showMessage(null)
                      })
                    } catch (e) {
                      console.log('Anable download file', e)
                    }
                  }
                }}
              />

              <div>
                <div className={'gfx-form'}>
                  <TextField
                    onChange={(e) => {
                      this.setState({
                        title: e.target.value,
                      })
                    }}
                    // only save gfx title when blur the Title field
                    onBlur={(e) => {
                      this.setState({
                        title: e.target.value,
                      }, () => this.handleSubmit())
                    }}
                    fullWidth
                    label="Title"
                    id="gfx-input-title"
                    value={this.state.title}
                    inputProps={{
                      maxLength: gfxTitleMaxLength
                    }}
                  />
                  <Autocomplete
                    label={'Assign'}
                    defaultValue={this.getDefaultAssignValue()}
                    onChange={(selected) => {
                      console.log('On Select changed', selected)
                      this.setState({
                        assign: selected,
                      }, () => this.handleSubmit())

                    }} options={options} />

                  <Select
                    className={'gfx-status-select'}
                    label={'Status'}
                    defaultValue={_.toLower(defaultStatus) === 'todo' || _.toLower(defaultStatus) === 'to do' ? 'To do' : defaultStatus}
                    onChange={(selected) => {

                      this.setState({
                        status: selected,
                      }, () => this.handleSubmit()
                      )
                    }} options={STATUSES} />

                  <NoteInput
                    onChange={(value) => {
                      this.setState({
                        body: value,
                      })
                    }}
                    // only save gfx note when blur the Note field
                    onBlur={(e) => {
                      this.setState({
                        body: e.target.value,
                      }, () => this.handleSubmit())
                    }}
                    users={users}
                    value={_.get(gfx, 'data.body', '')} />

                  {

                    /* <GfxFiles
                       onDownload={(file) => {
                         this.props.downloadFile(_.get(file, 'id')).then((data) => {
                           // download file
                           download(data, _.get(file, 'name'), _.get(file, 'mimeType'))
                         })
                       }}
                       onRemoveFile={(file) => this.handleRemoveFile(file)}
                       files={this.state.files}/>
                       */

                  }
                  {/* <DrivePicker rootId={driveId} onClose={(event) => {

                    switch (event.type) {

                      case 'ok':

                        // handle update gfx with files
                        let files = this.state.files
                        const old_files = _.cloneDeep(this.state.files)

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
                          this.handleSubmit(files, old_files)
                        })

                        break

                      default:

                        break
                    }
                  }}/> */}

                </div>
                <GfxDate>
                  <div>Created: {moment(created).format('MM-DD-YYYY  HH:mm')}</div>
                  {updated && <div>Updated: {moment(updated).format('MM-DD-YYYY  HH:mm')}</div>}
                </GfxDate>
              </div>
              {
                /*
                <div className={'actions'}>
                <Button onClick={this.handleSubmit} color={'primary'}
                        size="small">Save</Button>
                <Button onClick={this.handleCancel} color={'default'}
                        size="small">Cancel</Button>

              </div>
                 */
              }
            </div>
          )
        }

      </Container>
    )
  }
}

const mapStateToProps = (state, props) => {
  return {
    // currentUser: getCurrentUser(state),
    event: state.event,
    users: getUserSearchList(state),
    doc: getDocument(state, props)
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  searchUsers,
  downloadFile,
  toggleDrive,
  updateGfxCard,
  showMessage,
  setDriveEditGfx,
  cancel: () => {
    return (dispatch) => {
      dispatch({
        type: EDIT_GFX,
        payload: null,
      })
    }
  },
  done: () => {
    return (dispatch) => {
      dispatch({
        type: EDIT_GFX,
        payload: null,
      })
    }
  },
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(EditGfxCard)
