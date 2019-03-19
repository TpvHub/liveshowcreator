import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  withMobileDialog,
} from '@material-ui/core'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getDownloadUrl, listFiles, uploadFiles, showMessage, downloadFile, deleteFile, toggleMiniPlayer } from '../../redux/actions'
import { OrderedMap, Map } from 'immutable'
import FileList from '../drive/file-list'
import _ from 'lodash'
import moment from 'moment'
import styled, { keyframes } from 'styled-components'
import download from '../../helper/download'
import MessageUploadFile from '../message-upload-file';
import { ON_SUBMIT_ADD_GFX_CARD } from '../../redux/types';

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

const Content = styled.div `

`

const ROOT_ID = '0AE9JZVb6UBe3Uk9PVA'
const DRIVE_FIELDS = `id, name,size, mimeType, description,createdTime,modifiedTime,webViewLink,parents,hasThumbnail,thumbnailLink,webContentLink`

// Handle show SnackBar upload when close dialog
if (!window.LiveXDataLayer) {
  window.LiveXDataLayer = {
    driveDialog : {} 
  }
}
let { driveDialog } = window.LiveXDataLayer;
let intervalCheckUpload;

class DriveDialog extends React.Component {

  constructor (props) {
    super(props)

    this.handleOpenFolder = this.handleOpenFolder.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    this.handleOnFileSelectChange = this.handleOnFileSelectChange.bind(this)
    this.handleDownloadFile = this.handleDownloadFile.bind(this)

    this._onDragEnter = this._onDragEnter.bind(this)
    this._onDragLeave = this._onDragLeave.bind(this)
    this._onDragOver = this._onDragOver.bind(this)
    this._onDrop = this._onDrop.bind(this)

    this.state = {
      isLoading: true,
      files: new OrderedMap(),
      root: null,
      selected: [],
      uploading: new Map(),
      className: '',
      isOpenDialogDelete: false,
    }

    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      this.handleClose('close');
    };
  }

  componentWillMount() {
    this._ismounted = true;
    // Show again message
    if (_.get(driveDialog, 'message', 0) === 0) {
      driveDialog.message = 1
    }
    // Check if have file uploading
    const prevNumOfFileUploading = _.get(driveDialog, 'payloadFileUploading', []).length
    if (prevNumOfFileUploading !== 0) { // Uploading...
      intervalCheckUpload = setInterval(() => {
        const nextNumOfFileUploading = _.get(driveDialog, 'payloadFileUploading', []).length
        if (nextNumOfFileUploading == 0) {
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

  componentWillUnmount() {
    this._ismounted = false;
    if (intervalCheckUpload) clearInterval(intervalCheckUpload)
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

  handleClose (op) {

    if (this.props.onClose) {
      window.onpopstate = null;
      if (window.history.state === null) {
        window.history.back(); // Clear state
      }
      this.props.onClose({
        type: op,
        payload: {
          selected: this.state.selected,
        },
      })
    }

  }

  handleOnFileSelectChange (files) {
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
    this.setState({ isOpenDialogDelete: false })
    const { selected, files } = this.state;
    let newFiles = files;
    selected.forEach(async _itemSelected => {
      newFiles = newFiles.filter(_itemFile => _itemFile.id !== _itemSelected.id);
      await this.props.deleteFile(_itemSelected.id);
    })
    this.setState({ files: newFiles, selected: [] });
  }

  componentDidMount () {

    const {rootId} = this.props

    const query = `'${rootId}' in parents and trashed != true`
    const fields = `nextPageToken, files(${DRIVE_FIELDS})`

    this.props.listFiles(query, fields).then((data) => {

      let _files = this.state.files

      _.each(_.get(data, 'files', []), (file) => {

        _files = _files.set(_.get(file, 'id'), file)
      })

      this.setState({
        files: _files,
        isLoading: false,
      })
    })
  }

  setUploadProgress (id, data, done = false) {
    let uploading = this.state.uploading
    if (this._ismounted) {
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

  handleUpload (files, existingFiles) {

    const {rootId} = this.props
    const parentId = this.state.root ? this.state.root.id : rootId
    if (_.get(driveDialog, 'payloadFileUploading', []).length === 0) {
      driveDialog.payloadFileUploading = [];
    }
    this.props.uploadFiles(files, existingFiles, parentId, (e) => {

      const event = e.event
      const payload = e.payload

      switch (event) {

        case 'begin':

          this.setUploadProgress(payload.id, {
            file: payload.file,
            total: payload.file.size,
            loaded: 0,
          })
          // Save list file in queue
          files.forEach(_itemFile => {
            driveDialog.payloadFileUploading.push(payload);
          })

          break

        case 'complete':

          if (parentId === _.get(payload, 'parent')) {

            const file = _.get(payload, 'data')

            const fileId = _.get(file, 'id')

            if (this._ismounted) this.setState({
              files: this.state.files.set(fileId, file),
              uploading: this.state.uploading.remove(payload.id)
            })
          }
          if (!this._ismounted) {
            this.props.showMessage(null)
            this.props.showMessage({
              isRawBody: true,
              body: <MessageUploadFile isFinished />,
              duration: 1000,
            })
          }

          break

        case 'progress':

          this.setUploadProgress(payload.id, {
            file: payload.file,
            total: payload.file.size,
            loaded: payload.loaded,
          })
          if (!this._ismounted && _.get(driveDialog, 'message') !== 0) {
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

          break

        default:

          break
      }

      if (event === 'complete' && parentId ===
        _.get(payload, 'parent')) {
        // Default state message show
        driveDialog.message = -1

        const file = _.get(payload, 'data')

        if (this._ismounted) this.setState({
          files: this.state.files.set(_.get(file, 'id'), file),
        })

        // TODO
        if (!driveDialog.payloadFileUploadingSuccess) driveDialog.payloadFileUploadingSuccess = [];
        driveDialog.payloadFileUploadingSuccess = [...driveDialog.payloadFileUploadingSuccess, payload]
        driveDialog.payloadFileUploading = driveDialog.payloadFileUploading.filter(_itemPayload => _itemPayload.id !== payload.id);
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

      })

    })

  }

  onClosePreview = () => {
    window.history.pushState(null, null, window.location.href);
    setTimeout(() => {
      window.onpopstate = () => {
        this.handleClose('close');
      };
    }, 0)
  }

  render () {
    
    const {fullScreen, title, okButton, cancelButton, open} = this.props
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

    }).valueSeq()

    return (
      <div
        onDrop={this._onDrop} onDragOver={this._onDragOver} onDragEnter={this._onDragEnter}
        onMouseUp={this._onDragLeave} className={this.state.className ? this.state.className : 'drive-dialog'}
        onDragLeave={this._onDragLeave}
      >
        <Dialog
          className={'drive-dialog'}
          fullScreen={true}
          maxWidth={false}
          open={open}
          onClose={() => this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle className={'drive-dialog-title'}
                       id="responsive-dialog-title">{title}</DialogTitle>
          <DialogContent
            className={'drive-dialog-content'}>
            <Content>

              {this.state.isLoading && (<Loading>
                <span className={'md-icon'}>access_time</span>
              </Loading>)}
              <FileList
                onDownload={this.handleDownloadFile}
                uploading={this.state.uploading}
                isLoading={this.state.isLoading}
                onFileSelectChange={this.handleOnFileSelectChange}
                onUpload={(files) => this.handleUpload(files, existingFiles)}
                onOpenFolder={(file) => this.handleOpenFolder(file)}
                files={existingFiles}
                showMessage={this.props.showMessage}
                onClose={this.onClosePreview}
                toggleMiniPlayer={this.props.toggleMiniPlayer}
              />
            </Content>
          </DialogContent>
          <DialogActions className={'drive-dialog-actions'}>
            <Button
              disabled={this.state.selected.length < 1}
              onClick={() => this.setState({ isOpenDialogDelete: true })} color="secondary"
            >
              Delete
            </Button>

            <Button disabled={this.state.selected.length < 1}
                    onClick={() => this.handleClose('ok')} color="primary"
                    autoFocus>
              {okButton}
            </Button>

            <Button onClick={() => this.handleClose('close')}>
              {cancelButton}
            </Button>

          </DialogActions>
        </Dialog>
        <DialogAlertDeleteComponent
          isOpenDialogDelete={isOpenDialogDelete}
          selected={selected}
          handleDeleteFiles={() => this.handleDeleteFiles()}
          handleCloseDialogDelete={() => this.setState({ isOpenDialogDelete: false })}
        />
      </div>
    )
  }
}

DriveDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  okButton: PropTypes.string,
  cancelButton: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
}

const DialogComponent = withMobileDialog()(DriveDialog)

const mapStateToProps = (state) => ({
  message: state.message,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  listFiles,
  uploadFiles,
  getDownloadUrl,
  showMessage,
  downloadFile,
  deleteFile,
  toggleMiniPlayer,
}, dispatch)
export default connect(mapStateToProps, mapDispatchToProps)(DialogComponent)

class DialogAlertDelete extends React.Component {
  constructor (props) {
    super(props)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.gfxList.size < this.props.gfxList.size) return false;
    return true;
  }

  arSelectedFileWithNumOfGfxUsed = () => {
    const {gfxList, selected} = this.props
    let selectedFile = _.cloneDeep(selected)
    gfxList.forEach(_itemGfx => {
      selectedFile = selectedFile.map(_itemSelected => {
        const listFiles = _.get(_itemGfx, "data.files", [])
        listFiles.forEach(_itemFile => {
          if(_.includes(_itemFile, _itemSelected.id)) _itemSelected.inGfx = (_itemSelected.inGfx || 0) + 1;
        })
        return _itemSelected
      })
    })
    return selectedFile
  }

  handleDeleteFiles = () => {
    this.props.handleDeleteFiles();
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
    });
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