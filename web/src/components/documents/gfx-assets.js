import React from 'react'
import styled from 'styled-components'
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc'
import _ from 'lodash'
import Image from '../image'
import { CheckCircle, RadioButtonUnchecked } from '@material-ui/icons'
import { Button } from '@material-ui/core'
import GfxVideoThumbnail from './gfx-video-thumbnail'
// import VideoDialog from '../dialog/video-dialog'
import IframeDriveDialog from '../dialog/iframe-drive-dialog'
import BgImage from '../../assets/images/bg_asset.png'

const Container = styled.div`

`

const Actions = styled.div`

  display: flex;
  flex-direction: row;
  margin: 10px 0;
  button {
    margin-right: 10px;
  }
`

const SortListContainer = styled.div`
    display: flex;
    margin-left: -15px;
    margin-right: -15px;

`

const Grid = styled.div`

  display: inline-block;
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

const GridItem = styled.div`
  position: relative;
  list-style: none
  float: left;
  width: 120px;
  height: 105px;
  border: 1px solid rgba(0,0,0,0.05);
  border-top: 1px solid ${props => props.index === 0 ? 'red' : 'rgba(0,0,0,0.05)'};
  z-index: 1301;
  margin: 2em 4px 4px;
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

  .selected-asset-file{
      cursor: pointer;
      position: absolute;
      z-index: 2;
      top: 0;
      right: 0;
    }

`

const Filename = styled.div`
  font-weight: 700;
  font-size: 11px;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
`

const VideoGfxContainer = styled.div`
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

class GfxAssets extends React.Component {

  constructor(props) {
    super(props)

    this.handleDescriptionChange = this.handleDescriptionChange.bind(this)
    this.notifyChange = this.notifyChange.bind(this)
    this.handleSelectAssetFile = this.handleSelectAssetFile.bind(this)
    this.handleRemoveSelectedFiles = this.handleRemoveSelectedFiles.bind(this)
    this.handleDownloadFiles = this.handleDownloadFiles.bind(this)

    this.state = {
      items: [],
      selected: [],
      openVideoFile: null,
    }
  }

  componentDidMount() {
    const { gfx } = this.props

    this.setState({
      items: _.get(gfx, 'data.files', [])
    })
  }

  onSortEnd = ({ oldIndex, newIndex }) => {

    let items = this.state.items

    const newArr = arrayMove(items, oldIndex, newIndex)

    this.setState({
      items: newArr,
    }, () => {
      this.forceUpdate(() => {
        this.notifyChange()
      })
    })
  }

  notifyChange() {
    if (this.props.onChange) {
      this.props.onChange(this.state.items)
    }
  }

  handleDescriptionChange(e, file) {

    let files = this.state.items

    for (let i = 0; i < files.length; i++) {
      if (_.get(files[i], 'id') === _.get(file, 'id')) {
        files[i].description = e.target.value
      }
    }

    this.setState({
      items: files
    }, () => {

      this.notifyChange()
    })
  }

  handleSelectAssetFile(file) {

    let selected = this.state.selected

    let find = selected.find((i) => i === file.id)

    if (find) {
      selected = selected.filter((i) => i !== file.id)
    } else {
      selected.push(file.id)
    }

    this.setState({
      selected: selected
    }, () => this.forceUpdate())
  }

  handleRemoveSelectedFiles() {

    let items = this.state.items
    this.state.selected.forEach((id) => {
      items = items.filter(i => i.id !== id)
    })

    this.setState({
      items: items
    }, () => {
      this.forceUpdate(() => {
        this.notifyChange()
      })
    })
  }

  handleDownloadFiles() {
    const { selected, items } = _.cloneDeep(this.state)
    let itemDownload = [];
    selected.forEach((id) => {
      items.forEach(_item => {
        if (_item.id === id) {
          itemDownload.push(_item);
        }
      })
    })
    itemDownload = itemDownload.filter(i => i)
    if (this.props.onDownload) {
      this.props.onDownload(itemDownload)
    }
  }

  isImageFile(file) {

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
  isVideoFile(file) {

    const videoMimeTypes = [
      'video/mp4',
      'video/quicktime'
    ]
    const mimeType = _.get(file, 'mimeType', null)
    return mimeType && _.includes(videoMimeTypes, mimeType)
  }

  shouldComponentUpdate(nextProps, nextState) {

    if (nextState.openVideoFile !== this.state.openVideoFile) return true;

    return this.state.items.length === 0 && nextProps.gfx
  }

  render() {

    const { selected } = this.state

    let items = this.state.items

    const SortableItem = SortableElement(({ value }) => {

      const index = value.index
      const item = value.value

      const name = _.get(item, 'name', '')
      const fileId = _.get(item, 'id')

      const isSelected = selected.find((i) => i === fileId)

      return (
        <GridItem
          index={index}
          className={'gfx-assets-sort-item'}
        >
          {
            this.isImageFile(item) && (
              <Image
                className={'gfx-image'}
                file={item}
                fileId={fileId}
                view={true}
                items={items}
                whereNeedToShowContextMenu='gfx-assets'
              />
            )
          }
          {
            this.isVideoFile(item) && (
              <VideoGfxContainer className={'gfx-video'}>
                <GfxVideoThumbnail fileId={fileId} items={items} />
                {/* <PlayerIcon onClick={() => {
                  // this.setState({
                  //   openVideoFile: item,
                  // })
                  console.log('clicked PlayerIcon');
                }} className={'player-thumbnail'}>
                  <i className={'md-icon'}>play_arrow</i>
                </PlayerIcon> */}
              </VideoGfxContainer>
            )
          }
          <div onClick={() => { this.handleSelectAssetFile(item) }} className={'selected-asset-file'}>
            {
              isSelected ? <CheckCircle color={'primary'} /> : <RadioButtonUnchecked color={'primary'} />
            }
          </div>

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

    const SortableList = SortableContainer(({ items }) => {
      return (
        <Grid className={'gfx-assets-sort-container'}>
          {items.map((value, index) => (
            <SortableItem key={`SortableItem-${index}-${value}`} index={index} value={{ index: index, value: value }} />
          ))}
        </Grid>
      )
    })

    const ActionsControl = (props) => (
      <Actions>
        <Button
          onClick={() => {
            if (this.props.onOpenDrive) this.props.onOpenDrive()
          }}
          variant={'raised'}
          size={'small'}
          color={'secondary'}>
          Drive
          </Button>

        <Button
          onClick={this.handleDownloadFiles}
          variant={'raised'}
          disabled={selected.length < 1}
          size={'small'}
          color={'primary'}>
          Download
          </Button>

        <Button
          onClick={this.handleRemoveSelectedFiles}
          variant={'raised'}
          disabled={selected.length < 1}
          size={'small'}
          color={'secondary'}>
          Remove
          </Button>
      </Actions>
    )

    return (
      <Container>
        <SortListContainer>
          <SortableList
            distance={2}
            axis={'xy'} items={items} onSortEnd={this.onSortEnd} />
        </SortListContainer>

        <ActionsControl />
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
            }} file={this.state.openVideoFile} />
          )
        }
      </Container>
    )
  }
}

export default GfxAssets
