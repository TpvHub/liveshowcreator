import React from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import moment from 'moment'
import fileSizeFormat from '../../helper/fileSizeFormat'
import { OrderedMap } from 'immutable'
import { Typography } from '@material-ui/core'
import UploadProgress from '../drive/upload-progress'
import Image from '../image'
import GfxVideoThumbnail from '../documents/gfx-video-thumbnail'
import IframeDriveDialog from '../dialog/iframe-drive-dialog'
import ContextMenu from '../documents/context-menu'

const Container = styled.div `

`

const List = styled.div `
  position: relative;
`

const ListItem = styled.div `
  display: flex;
  flex-direction: row;
  background: ${props => props.selected ? '#4285f4' : '#FFF'}
  color: ${props => props.selected ? '#FFF' : 'rgba(0,0,0,0.8)'};
  cursor: pointer;
  padding: 0 8px;
  border-bottom: 1px solid rgba(0,0,0,0.065);
  &:last-child {
    border-bottom: 0 none;
  }
  &:hover{
    opacity: 0.8;
  }
  .list-cell{
    line-height: 40px;
    display: flex;
    align-items: center;
    padding: 3px 8px;
  }
  .folder {
    line-height: 40px;
    display: flex;
    align-items: center;
    padding: 3px 8px;

    .md-icon {
      font-size: 3em;
    }
  }
  .drive-download-btn {
    padding: 0;
  }
`

// const OpenLink = styled.div`
//   min-width: 30px;
//   a{
//     height: 25px;
//   }
//   i{
//     font-size: 20px;
//   }
// `

const Thumbnail = styled.div`
  flex: 0 0 60px;
  padding: 1px;
`

const VideoGfxContainer = styled.div `
  width: 100%;
  position: relative;
  height: 100%;
`

// const PlayerIcon = styled.div `
//   position: absolute;
//   z-index: 0;
//   left: 0;
//   top: 0;
//   cursor: pointer;
//   display: flex;
//   width: 90%;
//   height: 90%;
//   justify-content: center;
//   align-items: center;
//   i{
//     font-size: 30px;
//   }
//   &:hover{
//     opacity: 0.7;
//   }

// `

const FileName = styled.div `

  flex-grow: 1 !important;
  display: block !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

`
const MineType = styled.div `

`

const FileDate = styled.div `
  flex: 0 0 30px;
  font-size: 0.8em;
  font-weight: 500;
  white-space: nowrap;
  flex-direction: column;
  justify-content: center;
  line-height: 1.2 !important;

`

const FileSize = styled.div `

`

const Breadcrumb = styled.div `
  border-bottom: 1px solid rgba(0,0,0,0.065);
  width: 100%;
  margin: 2px 0;

`

const BreadcrumbItem = styled.div `
  display: inline-block;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0,0,0,0.9);
  padding: 3px 5px;
  line-height: 25px;
  i{
    float: left;
    font-size: 15px;
    line-height: 26px;
    color: rgba(0,0,0,0.5);
  }
  &:before, &:after{
    display: table;
  }
  &:after{
    clear: both;
  }
`

const RootItem = styled.div `
  display: inline-block;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0,0,0,0.9);
  padding: 3px 5px;
  line-height: 25px;
`

const DownloadButton = styled.button`
  border: 0 none;
  padding: 3px;
  background: none;
  cursor: pointer;
  outline: 0 none;
  &:active{
    outline: 0 none;
  }
`

const ProgressItem = styled.div `
  padding: 8px 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.065);
`

class FileList extends React.Component {

  constructor (props) {
    super(props)

    this.handleOnClick = this.handleOnClick.bind(this)
    this.handleSelectParent = this.handleSelectParent.bind(this)
    this.handleDownload = this.handleDownload.bind(this)

    this.state = {
      parents: [],
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.files.size < this.props.files.size) {
      this.props.handleFileSelectChange(new OrderedMap())
    }
  }

  handleOnClick (e, file) {
    // check if click list-cell
    if (e.target.classList.contains('list-cell')) {
      const mimeType = _.get(file, 'mimeType')
      if (mimeType === 'application/vnd.google-apps.folder') {
        let parents = this.state.parents
        const isAdded = parents.find((f) => f.id === file.id)
        if (isAdded) {
          return
        }

        this.setState({
          parents: [...this.state.parents, file],
        }, () => {
          if (this.props.onOpenFolder) {
            this.props.onOpenFolder(file)
          }
        })

        return
      }

      const fileId = _.get(file, 'id')
      const isSelected = this.props.selected.get(fileId)

      this.props.handleFileSelectChange(isSelected
        ? this.props.selected.remove(fileId)
        : this.props.selected.set(fileId, file))
    }
  }

  handleSelectParent (folder, index) {
    let {parents} = this.state
    if (folder) {
      // we only keep left items until current
      for (let i = (index + 1); i < parents.length; i++) {
        _.unset(parents, i)
      }

    } else {
      // empty
      parents = []
    }
    this.setState({
      parents: parents,
    }, () => {

      if (this.props.onOpenFolder) {
        this.props.onOpenFolder(folder)
      }
    })

  }

  handleDownload (file) {

    if (this.props.onDownload) {
      this.props.onDownload(file)
    }
  }

  isImageFile (file) {

    let imagesMineTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/jpg',
      'image/bmp',
    ]

    if (_.includes(imagesMineTypes, _.get(file, 'mimeType'))) {
      return true
    }

    return false

  }

  // TODO: re-use this function for everywhere
  isVideoFile (file) {

    const videoMimeTypes = [
      'video/mp4',
      'video/quicktime'
    ]
    const mimeType = _.get(file, 'mimeType', null)
    return mimeType && _.includes(videoMimeTypes, mimeType)
  }

  render () {
    const {
      files,
      isLoading,
      selected,
      // toggleMiniPlayer
    } = this.props
    const {parents} = this.state

    return (
      <Container>

        {parents.length > 0 && (
          <Breadcrumb>
            <RootItem onClick={() => this.handleSelectParent(null,
              null)}>Drive:</RootItem>
            {parents.map((item, index) => {
              return (
                <BreadcrumbItem
                  onClick={() => this.handleSelectParent(item, index)}
                  key={`BreadcrumbItem-${_.get(item, 'name')}`}>
                  <i className={'md-icon'}>keyboard_arrow_right</i>
                  {_.get(item, 'name')}
                </BreadcrumbItem>
              )
            })}
          </Breadcrumb>

        )}

        {
          this.props.uploading.valueSeq().map((uploading, index) => {

            const complete = (uploading.loaded / uploading.total) * 100
            const label = _.get(uploading, 'file.name')

            return (
              <ProgressItem key={`UploadProgress-${label}`}>
                <UploadProgress completed={complete} label={label}/>
              </ProgressItem>
            )
          })
        }
        <List innerRef={(ref) => this.contentRef = ref}>
          <ContextMenu
            whereNeedToShow="file-list"
            parent={this}
            isRaw
          />
          {files.size > 0 ? files.map((file, index) => {

            const fileId = _.get(file, 'id')
            const mineType = _.get(file, 'mimeType')
            const modifiedTime = _.get(file, 'modifiedTime')
            const size = _.get(file, 'size', 0)

            const isSelected = selected.find((f) => f.id === fileId)

            return (
              <ListItem
                selected={!!isSelected}
                title={_.get(file, 'name')}
                onClick={(e) => this.handleOnClick(e, file)} key={`ListItem-${fileId}`}
              >
                
                {/* <OpenLink
                  className={'list-cell'}>
                  <a target={'_blank'} href={_.get(file, 'webViewLink')}><i className={'md-icon'}>open_in_new</i></a>
                </OpenLink> */}
                <Thumbnail>
                  {(mineType === 'application/vnd.google-apps.folder') &&
                    <MineType className={'folder'}>
                      <i className={'md-icon'}>folder</i>
                    </MineType>
                  }
                  {
                    this.isImageFile(file) && (
                      <Image
                        className={'gfx-image'}
                        file={file}
                        fileId={fileId}
                        view={true}
                        onClose={this.props.onClose}
                        items={files}
                        whereNeedToShowContextMenu='file-list'
                        isFromDrive
                      />
                    )
                  }
                  {
                    this.isVideoFile(file) && (
                      <VideoGfxContainer className={'gfx-video'}>
                        <GfxVideoThumbnail
                          items={files}
                          fileId={fileId}
                          isFromDrive
                        />
                        {/* <PlayerIcon onClick={() => {
                          if (file.hasThumbnail) {
                            // this.setState({
                            //   openVideoFile: file,
                            // })
                            toggleMiniPlayer(true, {fileId, listFiles: files});
                          } else {
                            this.props.showMessage({
                              isRawBody: true,
                              body: <p>This file doesn't ready yet, please check again later.</p>,
                              duration: 1000,
                            })
                          }
                        }} className={'player-thumbnail'}>
                          <i className={'md-icon'}>play_arrow</i>
                        </PlayerIcon> */}
                      </VideoGfxContainer>
                    )
                  }
                </Thumbnail>
                <FileName className={'list-cell filename'}>{_.get(file, 'name')}</FileName>
                <FileDate className={'list-cell'}>
                  {moment(modifiedTime).format('MMM D')}
                  <FileSize>{size ? fileSizeFormat(size) : '--'}</FileSize>
                </FileDate>
                <div className={'list-cell drive-download-btn'}>
                  <DownloadButton title={'Download'} onClick={(e) => {
                    this.handleDownload(file)
                  }}><i className={'md-icon'}>cloud_download</i></DownloadButton>
                </div>
              </ListItem>
            )
          }) : <Typography variant="caption" align="center" style={{ padding: '10px' }}>
              {!isLoading && ('There are no files in this document\'s drive.')}
            </Typography>
          }
        </List>
        {
          this.state.openVideoFile && (
            <IframeDriveDialog onClose={() => {
              if (this.props.onClose) {
                this.props.onClose()
              }
              this.setState({
                openVideoFile: null,
              })
            }} file={this.state.openVideoFile}/>
          )
        }
      </Container>
    )
  }
}

export default FileList
