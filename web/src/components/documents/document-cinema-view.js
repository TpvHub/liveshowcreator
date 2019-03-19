import React from 'react'
import moment from 'moment'
import { store } from '../../store'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import _ from 'lodash'
import styled, { keyframes } from 'styled-components'
import {
  toggleCinemaView,
  showMessage,
  updateGfxCard,
} from '../../redux/actions'
import { getImageByFileId } from '../../redux/selectors';
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from 'react-sortable-hoc'
import BgImage from '../../assets/images/bg_asset.png'
import Image from '../image'
// import { CheckCircle, RadioButtonUnchecked } from '@material-ui/icons'
import GfxVideoThumbnail from './gfx-video-thumbnail'
import ContextMenu from './context-menu'

// Expansion Panel
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

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
  width: 100px;
  height: 100px;
  border-radius: 50%;
  font-size: 1.2rem;
  padding: 0;
  position: absolute;
  top: 40%;
  left: 45%;
  z-index: 1;
  span{
    width: 100px;
    font-size: 100px;
    height: 100px;
    border-radius: 50%;
  }

`

const HidePopOut = styled.div `
  width: 80px;
  height: 80px;
  position: absolute;
  opacity: 0;
  right: 0px;
  top: 0px;
  cursor: pointer;
`

const Title = styled.h2 `
  font-size: 15px;
  margin: 0;
  padding: 0;

`

const SortListContainer = styled.div `
  display: table;
  margin: 0 auto;
  position: relative;

`

const Grid = styled.div `

  display: flex;
  width: 900px;
  overflow-y: hidden;
  overflow-x: scroll;
  white-space: nowrap;
  z-index: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  counter-reset: asset-counter;

  .gfx-assets-sort-item::before {
    counter-increment: asset-counter;
    content: counter(asset-counter, lower-alpha);
    display: block;
    position: absolute;
    top: -1.5em;
    left: 0;
    z-index: 3;
  }

`

const GridItem = styled.div `
  position: relative;
  list-style: none
  float: left;
  width: 120px;
  height: 105px;
  border: 1px solid rgba(0,0,0,0.05);
  border-top: 1px solid ${props => props.index === 0 ? 'red' : 'rgba(0,0,0,0.05)'};
  z-index: 1301;
  margin: 2em 8px 8px;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  textarea{
    border: 0 none;
    min-height: 20px;
    background: none;
    color: #FFF;
    resize: none;
    max-width: 100%;
  }
  .gfx-asset-info{
    padding: 5px;
    font-size: 11px;
    position: relative;
    z-index: 1;
    background: rgba(0,0,0,0.6);
    color: #FFF;

  }
  .gfx-image, .gfx-video{
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    left: 0;
    z-index: 0;
    user-select: none;
    img{
      user-select: none;
      user-drag: none;
      user-select: none;
    }
  }
  .gfx-image {
    background: url('${BgImage}') repeat 0 0 transparent;
  }
  &.active{
    border: 3px dotted red;
  }

`

// const Actions = styled.div `

//   display: flex;
//   flex-direction: row;
//   margin: 10px 0;
//   button {
//     margin-right: 10px;
//   }
// `

const Filename = styled.div `
  font-weight: 700;
  font-size: 11px;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
`

const VideoGfxContainer = styled.div `
  width: 100%;
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

class DocumentCinemaView extends React.Component {
  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)

    this.state = {
      items: [],
      selected: [],
      openVideoFile: null,
      isLoading: true,
      fullScreen: false,
      expanded: true,
      cursor: 0,
    }

    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      this.handleClose();
    };
  }

  componentWillReceiveProps(nextProps) {
    const {fileId, listFiles = []} = nextProps
    const items = listFiles ? [...listFiles.values()] : []
    if (
      fileId !== this.props.fileId
    ) {
      this.setState({ isLoading: true });
    }

    // compare if different source
    if (_.difference(this.state.items, items).length > 0) {
      this.setState({ items });
    }

  }

  componentDidMount() {
    this.updatePositionHighlightImage()
  }

  componentDidUpdate() {
    this.updatePositionHighlightImage()
  }

  updatePositionHighlightImage = () => {
    const elementHighLights = document.getElementsByClassName('gfx-assets-sort-item active');
    if (elementHighLights.length > 0) {
      elementHighLights[0].scrollIntoView({inline: 'center'});
    }
  }

  handleClose = () => {
    // window.onpopstate = null;
    // if (window.history.state === null) {
    //   window.history.back(); // Clear state
    // }
    // this.setState({open: false}, () => {
    //   if (this.props.onClose) {
    //     this.props.onClose()
    //   }
    // })
    this.props.toggleCinemaView(false)
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

  toggleFullScreen = () => {
    this.setState({ fullScreen: !{...this.state}.fullScreen })
  }

  // TODO
  handleDescriptionChange = (e, item) => {

  }

  onSortEnd = ({oldIndex, newIndex}) => {

    const {listFiles, disableSort = false} = this.props
    if (disableSort) {
      this.props.showMessage({
        body: <span style={{color: 'red'}}>Can not sort in the list file from Drive!</span>,
        duration: 2000,
      })
      return
    }
    let items = this.state.items.length > 0 ? this.state.items : listFiles

    const newArr = arrayMove(items, oldIndex, newIndex)


    this.setState({
      items: newArr,
    }, () => {
      this.forceUpdate(() => {
        this.notifyChange()
      })
    })
  }

  notifyChange () {
    // only handle when editing a Gfx
    const state = store.getState()

    if (state.gfxEdit === null) return

    const { gfxEdit } = this.props
    const gfx = gfxEdit.data

    const _selection = {
      index: _.get(gfxEdit, 'index', 0),
      length: _.get(gfxEdit, 'length', 0),
    }

    // update GFX card with new files list
    let card = _.cloneDeep(gfx)
    card = _.setWith(card, 'files', this.state.items)
    card.updated = new Date()

    this.props.updateGfxCard(card, _selection)
    this.props.showMessage({
      body: <span style={{color: 'green'}}>Success</span>,
      duration: 2000,
    })
  }

  handleKeyDown = (e) => {
    const {listFiles, fileId, disableSort} = this.props
    let items = this.state.items.length > 0 ? this.state.items : [...listFiles.values()]
    const selectedOrderNumFromProps = _.findIndex(items, _item => { return _item.id === fileId })
    let nextFile = items[0];

    // arrow up/down button should select next/previous list element
    if (e.keyCode === 37 || e.keyCode === 40) { // Sub
      if (selectedOrderNumFromProps !== 0) {
        nextFile = items[selectedOrderNumFromProps - 1];
      } else {
        nextFile = items[items.length - 1];
      }
    } else if (e.keyCode === 38 || e.keyCode === 39) { // Add
      if (selectedOrderNumFromProps === (items.length - 1)) {
        nextFile = items[0];
      } else {
        nextFile = items[selectedOrderNumFromProps + 1];
      }
    }

    this.props.toggleCinemaView(true, {fileId: nextFile.id, listFiles: items, disableSort});
  }

  render () {
    const { isLoading } = this.state
    const {isOpen, listFiles = []} = this.props

    const filename = ''

    // const {selected} = this.state

    let items = this.state.items.length > 0 ? this.state.items : listFiles

    const SortableItem = SortableElement(({value}) => {

      const index = value.index
      const item = value.value
      const fileId = _.get(item, 'id', '')

      const name = _.get(item, 'name', '')

      // const isSelected = selected.find((i) => i === fileId)

      return (
        <GridItem
          index={this.isVideoFile(item) ? `video-${index}` : `image-${index}`}
          className={`gfx-assets-sort-item ${this.props.fileId === fileId ? 'active' : ''}`}>
          {
            this.isImageFile(item) && (
              <Image
                className={'gfx-image'}
                file={item}
                fileId={fileId}
                view={true}
                items={items}
                cinemaView
                whereNeedToShowContextMenu='document-cinema-view'
              />
            )
          }
          {
            this.isVideoFile(item) && (
              <VideoGfxContainer className={'gfx-video'}>
                <GfxVideoThumbnail cinemaView items={items} fileId={fileId}/>
                {/* <PlayerIcon onClick={() => {
                  this.props.toggleCinemaView(true, {fileId, listFiles: items});
                }} className={'player-thumbnail'}>
                  <i className={'md-icon'}>play_arrow</i>
                </PlayerIcon> */}
              </VideoGfxContainer>
            )
          }

          {/* <div onClick={() => { this.handleSelectAssetFile(item) }} className={'selected-asset-file'}>
            {
              isSelected ? <CheckCircle color={'primary'}/> : <RadioButtonUnchecked color={'primary'}/>
            }
          </div> */}

          <div className={'gfx-asset-info'}>
            <Filename title={name}>{name}</Filename>
            <textarea
              placeholder={'Asset file description'}
              defaultValue={_.get(item, 'description')}
              onChange={(e) => this.handleDescriptionChange(e, item)} className={'file-description'}
            />
          </div>
        </GridItem>
      )
    })

    const SortableList = SortableContainer(({items}) => {
      return (
        <Grid className={'gfx-assets-sort-container'}>
          {items.map((value, index) => (
            <SortableItem key={`SortableItem-${value.id}`} index={index} value={{index: index, value: value}}/>
          ))}
        </Grid>
      )
    })

    const richInfo = _.get(this.props.imageSelected, 'richInfo', false)
    return (
      <div>
        { isOpen && this.props.fileId !== '' &&
        <Dialog
          fullScreen={true || this.state.fullScreen} // New behavior
          fullWidth
          maxWidth={'md'}
          open={isOpen}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
          onKeyDown={(e) => this.handleKeyDown(e) }
        >
          <DialogContent
            style={{
              margin: 0,
              padding: 0,
            }}
          >
            <div style={{position:'relative', paddingTop:'35%'}}>
              {isLoading && (<Loading>
                <span className={'md-icon'}>access_time</span>
              </Loading>)}
              <iframe
                title={"Document Cinema View"}
                onLoad={e => this.setState({ isLoading: false })}
                src={`https://drive.google.com/file/d/${this.props.fileId}/preview`}
                frameBorder="0"
                allowFullScreen
                style={{position:'absolute',top:'0',left:'0',width:'100%', height:'100%'}}
              />
              <HidePopOut onClick={() => this.toggleFullScreen()}>&nbsp;</HidePopOut>
            </div>
            <SortListContainer
              innerRef={(ref) => this.contentRef = ref}
            >
              <SortableList
                distance={2}
                axis={'xy'} items={items}
                onSortEnd={this.onSortEnd}
              />
              <ContextMenu
                whereNeedToShow="document-cinema-view"
                parent={this}
                isRaw
              />
            </SortListContainer>
            {richInfo && <div style={{ width: '100%'}}>
              <ExpansionPanel expanded={this.state.expanded} onClick={() => this.setState({ expanded : !this.state.expanded })}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{richInfo.name}</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails style={{ display: 'block' }}>
                  <Typography>
                    Type: {richInfo.mimeType}
                  </Typography>
                  <Typography>
                    Size: {bytesToSize(richInfo.size)}
                  </Typography>
                  <Typography>
                    Dimensions: {_.get(richInfo, 'imageMediaMetadata.width', _.get(richInfo, 'videoMediaMetadata.width', '?'))} x {_.get(richInfo, 'imageMediaMetadata.height', _.get(richInfo, 'videoMediaMetadata.height', '?'))}
                  </Typography>
                  <Typography>
                    Modified: {moment(richInfo.modifiedTime).format('hh:mm A MMM D')}
                  </Typography>
                </ExpansionPanelDetails>
              </ExpansionPanel>
            </div>}
          </DialogContent>
          {(true || this.state.fullScreen) && <DialogActions>
            <Title>{filename}</Title>
            <Button onClick={this.handleClose} color="primary">Close</Button>
          </DialogActions>}
        </Dialog>
        }
      </div>
    )
  }
}

DocumentCinemaView.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  file: PropTypes.any,
}

const mapStateToProps = (state, props) => {
  return {
  isOpen: _.get(state, 'cinemaView.open', false),
  fileId: _.get(state, 'cinemaView.fileId'),
  listFiles: _.get(state, 'cinemaView.listFiles', []),
  disableSort: _.get(state, 'cinemaView.disableSort', false),
  imageSelected: getImageByFileId(state, {fileId: _.get(state, 'cinemaView.fileId')}),
  gfxEdit: state.drive.gfxEdit,
}}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleCinemaView,
  showMessage,
  updateGfxCard,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(withMobileDialog()(DocumentCinemaView))

// TODO: reuse it
function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};