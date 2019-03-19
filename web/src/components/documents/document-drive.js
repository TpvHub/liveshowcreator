import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { store } from '../../store'
import {
  toggleDrive,
  getDownloadUrl,
  listFiles,
  uploadFiles,
  showMessage,
  downloadFile,
  deleteFile,
  updateGfxCard,
  toggleMiniPlayer,
  refreshDrive,
} from '../../redux/actions'
import { OrderedMap, Map } from 'immutable'
import FileList from '../drive/file-list'
import _ from 'lodash'
import moment from 'moment'
import styled, { keyframes } from 'styled-components'
import download from '../../helper/download'
import MessageUploadFile from '../message-upload-file'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  withMobileDialog,
} from '@material-ui/core'
import { FileUpload } from '@material-ui/icons'
import { ON_SUBMIT_ADD_GFX_CARD } from '../../redux/types'

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`

const Loading = styled.div `
  display: block;
  animation: ${rotate360} 2s linear infinite;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 1.2rem;
  padding: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  span{
    width: 30px;
    font-size: 30px;
    height: 30px;
    border-radius: 50%;
  }

`

const DivProgress = styled.div `
  display: flex;
  color: white;
  p {
    padding: 0 20px;
  }
`

const Container = styled.div `
  position: relative;
  flex: 0 0 300px;
  order: 2;
  color: #222;
  background: #fff;
  border-left: 1px solid #d9d9d9;
  border-right: 1px solid #d9d9d9;
  font-family: 'Roboto', sans-serif;

`

const Inner = styled.div `
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 300px;
  
`

const SidebarHeader = styled.div `
  background: rgba(97,97,97,1);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 11px 8px 10px;
  position: relative;
  flex: 0 0 auto;
`

const SidebarHeaderTop = styled.div `

  display: flex;
  .sidebar-title-text{
    cursor: pointer;
  }
  .sidebar-title{
    flex: 1;
    text-transform: uppercase;
  }
  .sidebar-toggle {
    border: 0 none;
    height: 18px;
    width: 18px;
    cursor: pointer;
    i{
      font-size: 18px;
    }
    &:hover{
      opacity: 0.7;
    }
  }

`

const Content = styled.div `
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: scroll;
  width: 100%;
  flex: 1 1 auto;
  height: ${props => props.isOpenMiniPlayer ? "calc(100vh - 430px);" : "calc(100vh - 175px);"}; // Mini player
`

const Actions = styled.div `
  flex: 0 0 auto;
  background: rgba(0, 0, 0, 0.1)

`

const UploadButton = styled.div `
  overflow: hidden;
  cursor: pointer;
  position: relative;
  display: inline-block;
  vertical-align: middle;
  text-transform: uppercase;
  font-weight: 500;

  label {
    display: block;
    cursor: pointer;
    padding: 8px 8px 4px;
  }
  input{
    position: absolute;
    left: -99999px;
  }
`

//const ROOT_ID = '0AE9JZVb6UBe3Uk9PVA'
const DRIVE_FIELDS = `id, name,size, mimeType, description,createdTime,modifiedTime,webViewLink,parents,hasThumbnail,thumbnailLink,webContentLink`

// Handle show SnackBar upload when close dialog
if (!window.LiveXDataLayer) {
  window.LiveXDataLayer = {
    driveDialog : {}
  }
}
let { driveDialog } = window.LiveXDataLayer
let intervalCheckUpload


class DocumentDrive extends React.Component {
  constructor (props) {
    super(props)

    this.handleOpenFolder = this.handleOpenFolder.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.handleDownloadFile = this.handleDownloadFile.bind(this)
    this.handleLoadFiles = this.handleLoadFiles.bind(this)
    this.handleAddToGfx = this.handleAddToGfx.bind(this)
    this.handleFileSelectChange = this.handleFileSelectChange.bind(this)

    this._onDragEnter = this._onDragEnter.bind(this)
    this._onDragLeave = this._onDragLeave.bind(this)
    this._onDragOver = this._onDragOver.bind(this)
    this._onDrop = this._onDrop.bind(this)

    this.state = {
      isLoading: true,
      files: new OrderedMap(),
      root: null,
      selected: new OrderedMap(),
      uploading: new Map(),
      className: '',
      isOpenDialogDelete: false,
    }
  }

  componentWillMount() {

    // Show again message
    if (_.get(driveDialog, 'message', 0) === 0) {
      driveDialog.message = 1
    }
    // Check if have file uploading
    const prevNumOfFileUploading = _.get(driveDialog, 'payloadFileUploading', []).length
    if (prevNumOfFileUploading !== 0) { // Uploading...
      intervalCheckUpload = setInterval(() => {
        const nextNumOfFileUploading = _.get(driveDialog, 'payloadFileUploading', []).length
        if (nextNumOfFileUploading === 0) {
          clearInterval(intervalCheckUpload)
          const payloadFileUploadingSuccess = _.get(driveDialog, 'payloadFileUploadingSuccess', [])
          payloadFileUploadingSuccess.forEach(_itemPrevFile => {
            const file = _.get(_itemPrevFile, 'data')
            this.setState({
              files: this.state.files.set(_.get(file, 'id'), file),
            })
          })
          driveDialog.payloadFileUploadingSuccess = []
        }
      }, 1000)
    }
  }

  componentWillReceiveProps(nextProps) {
    /**
      * Handle copy asset if different drive folder
      *
      */
    
    if (nextProps.driveRefreshId !== null && nextProps.driveRefreshId !== this.props.driveRefreshId) {
      this.handleOpenFolder()
    }
  }

  componentWillUnmount() {

    if (intervalCheckUpload) clearInterval(intervalCheckUpload)
  }

  componentDidMount () {
    this.handleLoadFiles()
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (_.get(this.props, 'rootId') !== _.get(nextProps, 'rootId')) {
      this.handleLoadFiles(_.get(nextProps, 'rootId'))
    }

    return true
  }

  _onDragEnter (e) {

    e.stopPropagation()
    e.preventDefault()
    return false
  }

  _onDragOver (e) {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  _onDragLeave (e) {

    e.stopPropagation()
    e.preventDefault()
    return false
  }

  _onDrop (e) {

    e.preventDefault()
    let files = e.dataTransfer.files
    // Upload files
    if (files && files.length) {
      this.handleUpload(files)
    }

    return false
  }

  handleFileSelectChange (files) {
    this.setState({
      selected: files,
    })
  }

  async handleDownloadFile (file) {
    this.props.showMessage({
      isRawBody: true,
      body: <DivProgress><CircularProgress /><p>Please wait while your file loads then downloads.</p></DivProgress>,
      duration: 60000000,
    })
    await this.props.downloadFile(file.id).then((data) => {
      download(data, file.name, data.type)
      this.props.showMessage(null)
    })
    // this.props.getDownloadUrl(file.id).then(url => {
    //   window.open(url, '_blank')
    // })
  }

  handleDeleteFiles () {
    window.setTimeout(() => this.setState({ isOpenDialogDelete: false }), 10)
    const { selected, files } = this.state
    let newFiles = files
    selected.forEach(async _itemSelected => {
      newFiles = newFiles.filter(_itemFile => _itemFile.id !== _itemSelected.id)
      await this.props.deleteFile(_itemSelected.id)
    })
    this.setState({ files: newFiles, selected: new OrderedMap() })
  }

  handleAddToGfx () {

    // only handle when editing a Gfx
    const state = store.getState()
    if (state.gfxEdit === null) return

    const { gfxEdit } = this.props
    const gfx = gfxEdit.data

    const _selection = {
      index: _.get(gfxEdit, 'index', 0),
      length: _.get(gfxEdit, 'length', 0),
    }

    // update the files list
    let files = gfx.files
    const old_files = _.cloneDeep(gfx.files)

    this.state.selected.forEach((file) => {

      const isFileExist = files.find(
        (i) => (_.get(i, 'name') + _.get(i, 'size')) === (_.get(file, 'name')) + _.get(file, 'size')) // Handle for copy file from another document
      if (!isFileExist) {
        files.push(file)
      }
    })

    // save the previous data as history
    let gfxNonHistory = _.cloneDeep(gfxEdit.data)
    if (old_files) _.set(gfxNonHistory, 'files', old_files)
    let history = _.cloneDeep(_.get(gfxNonHistory, 'history', []))
    _.unset(gfxNonHistory, 'history')
    history.unshift(gfxNonHistory)

    // update GFX card with new files list
    let card = _.cloneDeep(gfx)
    card = _.setWith(card, 'files', files)
    card = _.setWith(card, 'history', _.slice(history, 0, 10)) // limit the history within 10 items
    card.updated = new Date()
    this.props.updateGfxCard(card, _selection)

    // TODO: not scroll the gfx to top
    // clear selection
    this.handleFileSelectChange(new OrderedMap())
  }

  handleLoadFiles (rootId = null) {

    if (!rootId) rootId = this.props.rootId

    if (!rootId) {
      // TODO: clear the files list
      return
    }

    const query = `'${rootId}' in parents and trashed != true`
    const fields = `nextPageToken, files(${DRIVE_FIELDS})`
    let intervalLoadDrive;

    const job = () => {
      this.props.listFiles(query, fields).then((data) => {

        let _files = this.state.files

        _.each(_.get(data, 'files', []), (file) => {

          _files = _files.set(_.get(file, 'id'), file)
        })

        this.setState({
          files: _files,
          isLoading: false,
        })
        clearInterval(intervalLoadDrive)

      }).catch((err) => {
        console.log('Drive error:', err)
      })
    }
    job();
    intervalLoadDrive = setInterval(job, 2000)
  }

  handleUpload (files, existingFiles, isFirstTime = false) {

    if (isFirstTime) {
      this.setState({ totalFilesUploading: files.length });
    }

    const {rootId} = this.props
    const parentId = this.state.root ? this.state.root.id : rootId
    if (_.get(driveDialog, 'payloadFileUploading', []).length === 0) {
      driveDialog.payloadFileUploading = []
    }
    this.props.uploadFiles(files, existingFiles, parentId, (e) => {

      const event = e.event
      const payload = e.payload

      switch (event) {

        case 'begin':

          // this.setUploadProgress(payload.id, {
          //   file: payload.file,
          //   total: payload.file.size,
          //   loaded: 0,
          // })
          // Save list file in queue
          files.forEach(_itemFile => {
            driveDialog.payloadFileUploading.push(payload)
          })

          break

        case 'complete':

          if (parentId === _.get(payload, 'parent')) {

            const file = _.get(payload, 'data')

            const fileId = _.get(file, 'id')

            if (this.props.isOpen)
              this.setState({
                files: this.state.files.set(fileId, file),
                uploading: this.state.uploading.remove(payload.id),
              })
          }
          if (true || !this.props.isOpen) {
            const {numOfFileDone = 0, totalFilesUploading} = this.state
            this.setState({ numOfFileDone: numOfFileDone + 1 })
            this.props.showMessage(null)
            this.props.showMessage({
              isRawBody: true,
              body: <MessageUploadFile isFinished total={totalFilesUploading} numOfFileDone={numOfFileDone+1} />,
              duration: 5000,
            })
            // Reset when done
            if (numOfFileDone + 1 >= totalFilesUploading) {
              this.setState({ numOfFileDone: 0 })
            }
          }

          break

        case 'progress':

          // this.setUploadProgress(payload.id, {
          //   file: payload.file,
          //   total: payload.file.size,
          //   loaded: payload.loaded,
          // })
          if (_.get(driveDialog, 'message') !== 0) {
            this.props.showMessage({
              isRawBody: true,
              body: <MessageUploadFile payload={payload} />,
              duration: 60000000,
              onClose: () => { driveDialog.message = 0 },
            })
          } else {
            // Remove message + prevent remove another message
            if (this.props.message && this.props.message.duration === 60000000) this.props.showMessage(null)
          }

          break

        case 'error':

          // Try to upload again
          setTimeout(() => { this.handleUpload([_.get(payload, 'file')], existingFiles); }, 1000);

          // this.setState({
          //   uploading: this.state.uploading.remove(payload.id)
          // })

          // // display error message
          // const error = JSON.parse(_.get(payload, 'error'))
          // let msg = `Can not upload file ${_.get(payload, 'file.name')}`
          // const reason = _.get(error, 'error.errors[0].reason', null)
          // if (reason != null) {
          //   msg += `. Reason: ${reason}`
          // }
          // this.props.showMessage({
          //   body: msg,
          //   duration: 30000,
          // })
          break

        default:

          break
      }

      if (event === 'complete' && parentId ===
        _.get(payload, 'parent')) {
        // reload
        this.props.refreshDrive()
        // Default state message show
        driveDialog.message = -1

        const file = _.get(payload, 'data')

        if (this.props.isOpen) this.setState({
          files: this.state.files.set(_.get(file, 'id'), file),
        })

        // TODO
        if (!driveDialog.payloadFileUploadingSuccess) driveDialog.payloadFileUploadingSuccess = []
        driveDialog.payloadFileUploadingSuccess = [...driveDialog.payloadFileUploadingSuccess, payload]
        driveDialog.payloadFileUploading = driveDialog.payloadFileUploading.filter(_itemPayload => _itemPayload.id !== payload.id)
      }
    })
  }

  handleOpenFolder (folder) {

    const {rootId} = this.props
    const parentId = _.get(folder, 'id')

    let query = null
    if (folder) {
      // we do need custom query for parents
      query = `'${parentId}' in parents and trashed != true and '${parentId}' in parents`

    } else {

      query = `'${rootId}' in parents and trashed != true`
    }

    const fields = `nextPageToken, files(${DRIVE_FIELDS})`

    this.setState({
      isLoading: true,
      root: folder,
    }, () => {

      let intervalLoadDrive;

      const job = () => {
        this.props.listFiles(query, fields).then((data) => {

        let _files = this.state.files

        _files = _files.clear()

        _.each(_.get(data, 'files', []), (file) => {

          _files = _files.set(_.get(file, 'id'), file)
        })

        this.setState({
          files: _files,
          isLoading: false,
        })
        clearInterval(intervalLoadDrive)

        }).catch((err) => {
          console.log('Drive error:', err)
        })
      }

      job();
      intervalLoadDrive = setInterval(job, 2000)

    })

  }

  setUploadProgress (id, data, done = false) {
    let uploading = this.state.uploading
    if (this.props.isOpen) {
      if (done) {
        this.setState({
          uploading: uploading.remove(id)
        })
      } else {

        this.setState({
          uploading: uploading.set(id, data)
        })
      }
    }
  }

  /**
   * Files is added by use selected
   * @param e
   */
  onFileAdded (e, existingFiles) {
    let files = []
    for (let i = 0; i < e.target.files.length; i++) {
      files.push(e.target.files[i])
    }
    if (files.length) {
      this.handleUpload(files, existingFiles, true)
    }

  }

  render () {

    const {isOpen, isOpenMiniPlayer} = this.props
    const {isOpenDialogDelete, selected} = this.state

    const existingFiles = this.state.files.sort((a, b) => {

      const modifiedTimeA = moment(_.get(a, 'modifiedTime')).toDate()
      const modifiedTimeB = moment(_.get(b, 'modifiedTime')).toDate()

      const mimeTypeA = _.get(a, 'mimeType')
      const mimeTypeB = _.get(b, 'mimeTYpe')

      if (mimeTypeA === 'application/vnd.google-apps.folder' || mimeTypeB ===
        'application/vnd.google-apps.folder') {
        return -1
      }
      if (modifiedTimeA < modifiedTimeB) { return 1 }
      if (modifiedTimeA > modifiedTimeB) { return -1 }
      if (modifiedTimeA === modifiedTimeB) { return 0 }
      return 0

    }).valueSeq()

    return (
      isOpen || isOpenMiniPlayer ? (
        <Container>
          <Inner>
            <SidebarHeader>
              <SidebarHeaderTop>
                <div className={'sidebar-title'}>Drive</div>

                <div onClick={() => {
                  this.props.toggleDrive(null)
                }} title={'Close sidebar'} className={'sidebar-toggle'}>
                  <i className={'md-icon'}>chevron_right</i>
                </div>
              </SidebarHeaderTop>
            </SidebarHeader>

            <Content
              isOpenMiniPlayer={isOpenMiniPlayer}
            >
              {this.state.isLoading && (<Loading>
                  <span className={'md-icon'}>access_time</span>
                </Loading>)}
                <FileList
                  onDownload={this.handleDownloadFile}
                  uploading={this.state.uploading}
                  isLoading={this.state.isLoading}
                  onOpenFolder={(file) => this.handleOpenFolder(file)}
                  files={existingFiles}
                  selected={selected}
                  handleFileSelectChange={this.handleFileSelectChange}
                  showMessage={this.props.showMessage}
                  toggleMiniPlayer={this.props.toggleMiniPlayer}
                />
            </Content>

            <Actions>
              <UploadButton>
                <label title={'Upload files'} htmlFor={'file-input'}>
                  <FileUpload color={'primary'} style={{ verticalAlign: 'middle' }} /> Upload
                </label>
                <input
                  onChange={e => this.onFileAdded(e, existingFiles)}
                  id={'file-input'}
                  type={'file'}
                  accept={'*'}
                  multiple={true}
                  name={'file'}/>
              </UploadButton>

              <Button
                disabled={this.state.selected.count() < 1}
                onClick={() => this.setState({ isOpenDialogDelete: true })} color="secondary"
                style={{ fontSize: '0.7rem' }}
              >
                Delete
              </Button>

              <Button disabled={this.state.selected.count() < 1}
                      onClick={() => this.handleAddToGfx()} color="primary"
                      style={{ fontSize: '0.7rem' }}
                      autoFocus>
                {'Add to GFX'}
              </Button>
            </Actions>
          </Inner>
          <DialogAlertDeleteComponent
            isOpenDialogDelete={isOpenDialogDelete}
            selected={selected.toArray()}
            handleDeleteFiles={() => this.handleDeleteFiles()}
            handleCloseDialogDelete={() => this.setState({ isOpenDialogDelete: false })}
          />
        </Container>
      ) : null
    )
  }
}

const mapStateToProps = (state, props) => ({
  isOpenMiniPlayer: state.miniPlayer.open,
  isOpen: state.drive.open,
  rootId: state.drive.rootId,
  gfxEdit: state.drive.gfxEdit,
  driveRefreshId: state.drive.driveRefreshId,
  message: state.message,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleDrive,
  listFiles,
  uploadFiles,
  getDownloadUrl,
  showMessage,
  downloadFile,
  deleteFile,
  updateGfxCard,
  toggleMiniPlayer,
  refreshDrive,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentDrive)

class DialogAlertDelete extends React.Component {
  // constructor (props) {
  //   super(props)
  // }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.gfxList.size < this.props.gfxList.size) return false
    return true
  }

  arSelectedFileWithNumOfGfxUsed = () => {
    const {gfxList, selected} = this.props
    let selectedFile = _.cloneDeep(selected)
    gfxList.forEach(_itemGfx => {
      selectedFile = selectedFile.map(_itemSelected => {
        const listFiles = _.get(_itemGfx, "data.files", [])
        listFiles.forEach(_itemFile => {
          if(_.includes(_itemFile, _itemSelected.id)) _itemSelected.inGfx = (_itemSelected.inGfx || 0) + 1
        })
        return _itemSelected
      })
    })
    return selectedFile
  }

  handleDeleteFiles = () => {
    this.props.handleDeleteFiles()
    const {gfxList, event, selected} = this.props
    gfxList.forEach(_gfx => {
      let files = _.get(_gfx, "data.files", [])
      selected.forEach(_selectedFile => {
        files = files.filter(_file => _file.id !== _selectedFile.id)
      })
      _.set(_gfx, "data.files", files)
      event.emit(ON_SUBMIT_ADD_GFX_CARD, {
        payload: _gfx.data,
        range: {
          index: _.get(_gfx, 'index', 0),
          length: _.get(_gfx, 'length', 0),
        },
      })
    })
  }

  render() {
    const {isOpenDialogDelete, selected, handleCloseDialogDelete} = this.props
    return isOpenDialogDelete ? (
      <Dialog
        open
        onClose={() => this.setState({ isOpenDialogDelete: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{`Are you sure you want to delete ${selected.length} file${selected.length > 1 ? 's' : ''} below?`}</DialogTitle>
        <DialogContent>
          <ul>
            {this.arSelectedFileWithNumOfGfxUsed().map((_itemFile, index) =>
              (
              <li key={_itemFile.name + index}>
                {_itemFile.name}
                <br/>{_itemFile.inGfx && <span style={{color: "red"}}>There are {_itemFile.inGfx} gfx{_itemFile.inGfx > 1 && "s"} are using this file</span>}
              </li>
              )
            )}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialogDelete()} color="primary">
            No
          </Button>
          <Button onClick={() => this.handleDeleteFiles()} color="secondary" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    ) : null
  }
}

const mapStateToPropsD = (state) => ({
  gfxList: state.gfx,
  event: state.event,
})

const DialogAlertDeleteComponent = connect(mapStateToPropsD, null)(withMobileDialog()(DialogAlertDelete))
