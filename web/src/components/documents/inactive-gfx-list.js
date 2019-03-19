import React from 'react'
import styled from 'styled-components'
import { statusColors } from '../../config'
import _ from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getDocumentGfxItems } from '../../redux/selectors'
import Image from '../image'
// import VideoDialog from '../dialog/video-dialog'
import IframeDriveDialog from '../dialog/iframe-drive-dialog'
import {
  EDIT_INACTIVE_GFX,
} from '../../redux/types'

import EditInactiveGfxCard from './edit-inactive-gfx'
import MenuAction from '../menu-action'
import GfxAssetDialog from '../dialog/gfx-asset-dialog'
import {
  deleteInactiveGfx,
  ReactiveInactiveGfxCard,
  updateInactiveGfxItem,
  toggleMiniPlayer,
  showMessage
} from '../../redux/actions'
import GfxVideoThumbnail from './gfx-video-thumbnail'

const ActiveButton = styled.button `
  color: #FFF;
  padding: 5px 10px;
  text-align: center;
  font-size: 10px;
  background: #3f51b5;
  border-radius: 2px;
  border: 0 none;
  &:hover{
   background: #4f65e2;
  }
`
const Container = styled.div `

  .gfx-list-item{
    position: relative;
    .gfx-list-left{
       width: 75px;
       height: 75px;
       background: #ddd;
       position: relative;
       .gfx-asset-count{
          z-index: 2;
          position: absolute;
          cursor: pointer;
          right: -2px;
          top: -2px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          color: #FFF;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 10px;
       }
       img{
          max-width: 100%;
       }
    }
    .gfx-list-right{
      flex-grow: 1;
    }
  }
`

const List = styled.div `
    padding: 0 8px 8px;
`

const ListItem = styled.div `
    padding: 8px 0 0;

    .inner {
      border: 3px solid ${props => props.activeEdit ? props.color : '#f1f1f1'};
      background: ${props => props.activeEdit ? props.white : '#f1f1f1'};
      padding: 15px;
      position: relative;
    }

    &:hover .inner {
      background: #FFF;
      border-color: ${props => props.color};
    }
    .gfx-list-item-inner{
      display: flex;
      flex-direction: row;
      margin-bottom: 8px;
      margin-top: 8px;
    }
    .gfx-list-right{
      padding-left: 8px;
    }
    .gfx-status-select{
      .MuiSelect-root-156{
        font-size: 0.75em;
      }

    }

    .gfx-card-item-index-number{
      width: 15px;
      height: 15px;
      position: absolute;
      left: 0;
      top: 0;
      border: 0 none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${props => props.color};
      font-weight: bold;
      border-top: none;
      border-left: none;
      border-radius: 50%;
      font-size: 10px;
    }

`

// const PlayerIcon = styled.div `
//   position: absolute;
//   z-index: 1;
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

const Header = styled.div `
  display: flex;
`
const Title = styled.div `
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 3px;
  flex-grow: 1;
  cursor: pointer;
`

const Assign = styled.div `
  font-size: 12px;
  margin-bottom: 3px;
`

const Status = styled.div `
   background: ${props => props.background};
   color: ${props => props.color};
   padding: 3px 5px;
   text-transform: uppercase;
   text-align: center;
   display: inline-block;
   font-size: 10px;
`

const VideoGfxContainer = styled.div `
  width: 100%;
  height: 100%;
`

const InsertButton = styled.div `
  margin-top: 8px;
`

class InactiveGfxList extends React.Component {

  constructor (props) {

    super(props)

    this.getStatusColor = this.getStatusColor.bind(this)
    this.handleOnSelectGfx = this.handleOnSelectGfx.bind(this)
    this.showEdit = this.showEdit.bind(this)
    this.toggleGfxCard = this.toggleGfxCard.bind(this)
    this.handleOpenAssetModal = this.handleOpenAssetModal.bind(this)
    this.handleInsertGFX = this.handleInsertGFX.bind(this)

    this.state = {
      accessToken: '',
      openVideoFile: null,
      openGfxAsset: null
    }

  }

  /**
   * Status color
   * @param status
   * @returns {*}
   */
  getStatusColor (status) {

    const statusClassName = _.join(_.split(_.toLower(_.trim(status)), ' '), '-')
    return _.get(statusColors, statusClassName, statusColors.default)
  }

  /**
   * Handle user select gfx
   * @param item
   */
  handleOnSelectGfx (item) {
    const {gfxEdit} = this.props

    if (gfxEdit === _.get(item, 'id')) {
      return
    }
    this.showEdit(item.id)
  }

  toggleGfxCard (item) {
    const {gfxEdit} = this.props

    if (gfxEdit === _.get(item, 'id')) {
      this.props.cancelEditCard()
    } else {
      this.showEdit(_.get(item, 'id'))
    }
  }

  showEdit (id) {
    this.props.selectEdit(id)
  }

  /**
   * Check if file is video
   * @param file
   * @returns {*|boolean}
   */
  isVideo (file) {

    const videoMimeTypes = [
      'video/mp4',
    ]
    const mimeType = _.get(file, 'mimeType', null)
    return mimeType && _.includes(videoMimeTypes, mimeType)
  }

  /**
   * Check if file is image
   * @param file
   * @returns {boolean}
   */

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

  handleOpenAssetModal (item) {

    this.setState({
      openGfxAsset: item,
    })
  }

  handleInsertGFX (item) {

    const quill = this.props.quill

    const selection = quill.getSelection()

    if (selection === null) {
      alert('Select text to insert GFX')

      return
    }

    this.props.ReactiveInactiveGfxCard(item.data, selection)
  }

  componentWillReceiveProps (nextProps) {

    const nextEdit = _.get(nextProps, 'gfxEdit')
    if (nextEdit && nextEdit !== _.get(this.props, 'gfxEdit')) {
      // let scroll to the bottom
      const element = document.getElementById(`gfx-item-${nextEdit}`)
      if (element) {
        // wait the card expanding before scroll
        window.setTimeout(() => element.scrollIntoView({block: 'start', behavior: 'smooth'}), 10)
      }
    }
  }

  render () {

    const {
      items,
      gfxEdit,
      docId,
      // toggleMiniPlayer
    } = this.props

    return (
      <Container>
        <List>
          {
            items.map((item, index) => {

              const title = _.get(item, 'data.title', '')
              const assignUser = _.get(item, 'data.assign')
              const status = _.get(item, 'data.status')
              const isEdit = gfxEdit === _.get(item, 'id')
              const assets = _.get(item, 'data.files', [])
              const file = _.get(assets, '[0]', null)
              // const fileId = _.get(file, 'id')

              const color = this.getStatusColor(status)
              const assetCount = assets.length
              return (
                <ListItem
                  activeEdit={isEdit}
                  color={color.background}
                  white={'#fff'}
                  id={`gfx-item-${_.get(item, 'id')}`}
                  onClick={() => this.handleOnSelectGfx(item)}
                  key={title+index} className={'gfx-list-item'}>
                  <div className={'inner'}>
                    <div className={'gfx-list-item-inner'}>
                      {
                        file && (
                          <div className={'gfx-list-left'}>
                            <span
                              title={'Open GFX Assets'}
                              onClick={() => this.handleOpenAssetModal(item)}
                              className={'gfx-asset-count'}>
                              {assetCount > 1 ? assetCount : 'X'}

                            </span>
                            {
                              this.isImageFile(file) && (
                                <Image view={true} fileId={file.id} whereNeedToShowContextMenu='document-sidebar' />
                              )
                            }

                            {this.isVideo(file) && (
                              <VideoGfxContainer>
                                <GfxVideoThumbnail items={assets} fileId={file.id}/>
                                {/* <PlayerIcon onClick={() => {
                                  if (file.hasThumbnail) {
                                    // this.setState({
                                    //   openVideoFile: file,
                                    // })
                                    toggleMiniPlayer(true, {fileId, listFiles: assets});
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

                            )}


                          </div>
                        )
                      }
                      <div className={'gfx-list-right'}>
                        <Header>
                          <Title onClick={() => this.toggleGfxCard(
                            item)}>{title}</Title>
                          <MenuAction
                            onSelect={(option) => {

                              switch (option.key) {

                                case 'insert':

                                  this.handleInsertGFX(item)

                                  break

                                case 'delete':

                                  this.props.deleteInactiveGfx(item.id)

                                  break

                                default:

                                  break
                              }
                            }}
                            size={'small'} options={[
                            {
                              label: 'Insert GFX',
                              key: 'insert'
                            },
                            {
                              label: 'Delete',
                              key: 'delete',
                            },

                          ]}/>
                        </Header>
                        <Assign>@{_.get(assignUser, 'firstName')}</Assign>
                        <Status color={'#FFF'} background={color.background}>{status ? status :
                          <i>None</i>}</Status>
                        {!isEdit && (<InsertButton>
                          <ActiveButton
                            onClick={() => this.handleInsertGFX(item)}
                          >Insert GFX</ActiveButton>
                        </InsertButton>)
                        }

                      </div>
                    </div>
                    {isEdit && (<EditInactiveGfxCard
                      docId={docId} gfx={item}/>)}
                    {isEdit && (<InsertButton>
                      <ActiveButton
                        onClick={() => this.handleInsertGFX(item)}
                      >Insert GFX</ActiveButton>
                    </InsertButton>)
                    }
                  </div>
                </ListItem>
              )
            })
          }
        </List>

        {
          this.state.openVideoFile && (
            // <VideoDialog onClose={() => {
            //   this.setState({
            //     openVideoFile: null,
            //   })
            // }} file={this.state.openVideoFile}/>
            <IframeDriveDialog onClose={() => {
              this.setState({
                openVideoFile: null,
              })
            }} file={this.state.openVideoFile}/>
          )
        }
        {this.state.openGfxAsset && (
          <GfxAssetDialog
            onClose={(option, files) => {

              // if option is save let update gfx files
              const _selection = {
                index: _.get(this.state, 'openGfxAsset.index'),
                length: _.get(this.state, 'openGfxAsset.length')
              }
              let card = JSON.parse(JSON.stringify(_.get(this.state, 'openGfxAsset.data')))
              if (option === 'save') {
                card = _.setWith(card, 'files', files)
                card.updated = new Date()

                this.props.updateInactiveGfxItem(card, _selection)
              }

              this.setState({
                openGfxAsset: null
              }, () => {

              })
            }}
            gfx={this.state.openGfxAsset}/>
        )}

      </Container>
    )
  }
}

const mapStateToProps = (state, props) => ({
  items: getDocumentGfxItems(state, props, true),
  event: state.event,
  gfxEdit: state.inactiveGfx.get(state.inactiveGfxEdit) ? state.inactiveGfxEdit : null,
  quill: state.quill
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  deleteInactiveGfx,
  updateInactiveGfxItem,
  ReactiveInactiveGfxCard,
  toggleMiniPlayer,
  showMessage,
  selectEdit: (id) => {
    return (dispatch) => {
      dispatch({
        type: EDIT_INACTIVE_GFX,
        payload: id,
      })
    }
  },
  cancelEditCard: () => {
    return (dispatch) => {
      dispatch({
        type: EDIT_INACTIVE_GFX,
        payload: null,
      })
    }
  },
  getGoogleAccessToken: () => {
    return (dispatch, getState, {service, pubSub, google}) => {
      return google.authorize()
    }
  },

}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(InactiveGfxList)
