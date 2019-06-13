import React from 'react'
import styled from 'styled-components'
import { statusColors } from '../../config'
import _ from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getDocumentGfxItems, getGfxEdit } from '../../redux/selectors'
import {
  EDIT_GFX,
  ON_EDITOR_SET_MY_CURSOR, ON_REMOVE_FORMAT,
} from '../../redux/types'

import EditGfxCard from './edit-gfx-card'
import MenuAction from '../menu-action'
import {
  getDownloadUrl,
  setInactiveGfx,
  updateGfxCard,
  downloadFile,
  showMessage,
  toggleDrive,
} from '../../redux/actions'
import ContextMenu from './context-menu';

// components for ThumbnailSlider
import ThumbnailSlider from "components/documents/gfx-thumbnail-slider";

// utils
import {
  isDescendant,
} from "utils/func.util";

const Container = styled.div`
  .gfx-list-item{
    .gfx-list-left{
       width: 75px;
       height: 75px;
       background: #ddd;
       position: relative;
       cursor: pointer;
       .gfx-asset-count{
          z-index: 1;
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

const List = styled.div`
    padding: 0 8px 8px;
`

const ListItem = styled.div`
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

    .gfx-card-item-title {
      width: auto;
      height: 20px;
      display: flex;
      align-items: left;
      justify-content: left;
      color: #000;
      font-weight: bold;
      border-top: none;
      border-left: none;
      font-size: 14px;
      cursor: pointer;
      .gfx-card-item-index-number {
        border-bottom: solid 2px ${props => props.color};
        min-width: fit-content;
      }
      .gfx-card-item-title-content {
        margin-left: 5px;
        width: 180px;
        overflow: hidden;
      }
    }

    .gfx-card-item-heading {
      margin-bottom: 5px;
      display: flex;
      > div {
        flex-basis: 300px;
      }
      .menu-option {
        text-align: right;
        .menu-action {
          display: inline-block;

        }
      }
    }
`

const Assign = styled.div`
  display: inline-block;
  font-size: 12px;
  margin-bottom: 3px;
`

const Status = styled.div`
   background: ${props => props.background};
   color: ${props => props.color};
   padding: 3px 5px;
   text-transform: uppercase;
   text-align: center;
   display: inline-block;
   font-size: 10px;
`

// const VideoGfxContainer = styled.div`
//   width: 100%;
//   height: 100%;
// `

const AssetPlayholder = styled.div`
  width: 75px;
  height: 75px;
  text-align: center;

  .md-icon {
    margin: 0.4em 0 0;
  }

  .desc {
    font-size: 7px;
    font-weight: 400;
    margin: 0 5px;
  }
`

export const GfxCartTitle = props => (
  <div id={props.cardId} className={'gfx-card-item-title'}>
    <span className={'gfx-card-item-index-number'}>{props.headingOrder}</span>
    <span className={'gfx-card-item-title-content'}>{props.title}</span>
  </div>
)

class GfxList extends React.Component {

  constructor(props) {

    super(props)

    this.getStatusColor = this.getStatusColor.bind(this)
    this.handleOnSelectGfx = this.handleOnSelectGfx.bind(this)
    this.showEdit = this.showEdit.bind(this)
    this.handleRemoveGfx = this.handleRemoveGfx.bind(this)
    this.toggleGfxCard = this.toggleGfxCard.bind(this)

    this.state = {
      accessToken: '',
    }

    // Setting values for thumbnail slider
    this.max_thumbnail_items = 3;
    this.thumbnail_setting = {
      dots: false,
      infinite: true,
      speed: 200,
      slidesToShow: this.max_thumbnail_items,
      slidesToScroll: this.max_thumbnail_items,
    }
  }

  /**
   * Status color
   * @param status
   * @returns {*}
   */
  getStatusColor(status) {

    const statusClassName = _.join(_.split(_.toLower(_.trim(status)), ' '), '-')
    return _.get(statusColors, statusClassName, statusColors.default)
  }

  /**
   * Handle user select gfx
   * @param item
   */
  handleOnSelectGfx(item, e) {
    // check option button
    try {
      const list = document.getElementsByClassName("menu-option");
      for (let item of list) {
        if (item.contains(e.target)) return;
      }
      if (isDescendant(document.getElementById(`thumbnail-slider-${_.get(item, 'id')}`), e.target)) {
        return;
      }

      const { gfxEdit } = this.props

      if (gfxEdit === _.get(item, 'id')) {
        // close if click on gfx card title
        let cardId = `gfx-card-id-${_.get(item, 'id')}`;
        if (
          isDescendant(document.getElementById(cardId), e.target) ||
          cardId == e.target.id
        ) {
          this.showEdit(null);
        }
        return
      }
      const element = _.get(item, 'elements[0]')
      if (element) {
        // show edit
        this.showEdit(_.get(item, 'id'))

        this.props.event.emit(ON_EDITOR_SET_MY_CURSOR, {
          range: {
            index: _.get(item, 'index'),
            length: 0,
          },
          source: 'silent',
        })

      }
    } catch(err) {
      
    }

  }

  toggleGfxCard(item) {
    const { gfxEdit } = this.props

    if (gfxEdit === _.get(item, 'id')) {
      this.props.cancelEditCard()
    } else {
      this.showEdit(_.get(item, 'id'))
    }
  }

  /**
   * Handle remove gfx item
   * @param item
   */
  handleRemoveGfx(item) {
    const payload = {
      selection: {
        index: _.get(item, 'index'),
        length: _.get(item, 'length'),
      },
      format: 'livex',
      source: 'user',
    }
    this.props.event.emit(ON_REMOVE_FORMAT, payload)
  }

  showEdit(id) {
    this.props.selectEdit(id)
  }

  /**
   * Check if file is video
   * @param file
   * @returns {*|boolean}
   */
  isVideo(file) {

    const videoMimeTypes = [
      'video/mp4',
      'video/quicktime'
    ]
    const mimeType = _.get(file, 'mimeType', null)
    return mimeType && _.includes(videoMimeTypes, mimeType)
  }

  /**
   * Check if file is image
   * @param file
   * @returns {boolean}
   */

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

  handleOpenDrive(item) {
    this.props.toggleDrive(true, {
      gfxEdit: item
    })
  }

  componentWillReceiveProps(nextProps) {

    const nextEdit = _.get(nextProps, 'gfxEdit')
    if (nextEdit) {
      // let scroll to the top
      const element = document.getElementById(`gfx-item-${nextEdit}`)
      if (element) {
        // wait the card expanding before scroll
        window.setTimeout(() => element.scrollIntoView({ block: 'start', behavior: 'smooth' }), 10)
      }
    }
  }

  convertToNumberingScheme(number) {
    if (!number || number === '') return ''

    var baseChar = ("A").charCodeAt(0),
      letters = "";

    do {
      number -= 1;
      letters = String.fromCharCode(baseChar + (number % 26)) + letters;
      number = (number / 26) >> 0; // quick `floor`
    } while (number > 0);

    return letters;
  }

  render() {
    const { items, gfxEdit, docId, headings, sortGfxListBy } = this.props
    let itemsAfterSort = [];
    items.forEach((item, indexItem) => {
      let headingOrder = ''
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i]
        const nextHeading = headings[i + 1]
        if (item.index >= heading.index && (!nextHeading || item.index < nextHeading.index)) {
          headingOrder = i + 1
          break;
        }
      }
      headingOrder = this.convertToNumberingScheme(headingOrder) + ' ' + (indexItem + 1)
      item['idSort'] = Date.parse(item.data.created)
      item['headingOrder'] = headingOrder
      itemsAfterSort.push(item)
    });

    if (sortGfxListBy === 'Sort by newest') itemsAfterSort = _.sortBy(itemsAfterSort, [function (o) { return -o.idSort; }]);

    return (
      <Container innerRef={(ref) => this.contentRef = ref}>
        <List>
          {
            itemsAfterSort.map((item, index) => {
              const title = _.get(item, 'data.title', '')
              const assignUser = _.get(item, 'data.assign')
              const status = _.get(item, 'data.status')
              const isEdit = gfxEdit === _.get(item, 'id')
              const assets = _.get(item, 'data.files', [])
              const file = _.get(assets, '[0]', null)
              const color = this.getStatusColor(status)
              const cardId = `gfx-card-id-${_.get(item, 'id')}`

              return (
                <ListItem
                  activeEdit={isEdit}
                  white={'#fff'}
                  color={color.background}
                  id={`gfx-item-${_.get(item, 'id')}`}
                  onClick={(e) => this.handleOnSelectGfx(item, e)}
                  key={'ListItem' + index + title}
                  className={'gfx-list-item'}
                >
                  <div className={'inner'}>
                    {
                      !isEdit && (
                        <div>
                          <div className={'gfx-card-item-heading'}>
                            <GfxCartTitle
                              cardId
                              headingOrder={item.headingOrder}
                              title={title}
                            />
                            <div className={'menu-option'}>
                              <MenuAction
                                onSelect={(option) => {
                                  switch (option.key) {
                                    case 'delete':
                                      this.handleRemoveGfx(item)
                                      break
                                    case 'inactive':
                                      this.props.setInactiveGfx(item.id)
                                      break
                                    default:
                                      break
                                  }
                                }}
                                size={'small'} options={[
                                  {
                                    label: 'Remove GFX cue',
                                    key: 'inactive'
                                  },
                                  {
                                    label: 'Delete GFX cue',
                                    key: 'delete',
                                  },

                                ]} />
                            </div>
                          </div>
                          {
                            file && (
                              <ThumbnailSlider
                                id={_.get(item, 'id')}
                                thumbnail_setting={this.thumbnail_setting}
                                max_thumbnail_items={this.max_thumbnail_items}
                                assets={assets}
                              />
                            )
                          }
                          {!file && (
                            <div className={'gfx-list-left'} onClick={() => this.handleOpenDrive(item)}>
                              <AssetPlayholder>
                                <i className={'md-icon'}>add</i>
                                <div className={'desc'}>Add GFX files</div>
                              </AssetPlayholder>
                            </div>
                          )}

                          <div>
                            <Status color={'#FFF'} background={color.background}>{status ? status :
                              <i>None</i>}</Status> {assignUser && <Assign>@{_.get(assignUser, 'firstName')}</Assign>}
                          </div>
                        </div>
                      )
                    }
                    {
                      isEdit && (
                        <EditGfxCard
                          docId={docId}
                          gfx={item}
                          cardTitleProps={{
                            cardId,
                            title,
                            headingOrder: item.headingOrder,
                          }}
                        />
                      )
                    }
                  </div>
                </ListItem>
              )
            })
          }
        </List>
        <ContextMenu
          whereNeedToShow="gfx-assets"
          parent={this}
          isRaw
        />
      </Container>
    )
  }
}

const mapStateToProps = (state, props) => ({
  items: getDocumentGfxItems(state, props),
  event: state.event,
  gfxEdit: getGfxEdit(state),
  headings: state.docNavigation.headings,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  setInactiveGfx,
  updateGfxCard,
  selectEdit: (id) => {
    return (dispatch) => {
      dispatch({
        type: EDIT_GFX,
        payload: id,
      })
    }
  },
  cancelEditCard: () => {
    return (dispatch) => {
      dispatch({
        type: EDIT_GFX,
        payload: null,
      })
    }
  },
  getGoogleAccessToken: () => {
    return (dispatch, getState, { service, pubSub, google }) => {
      return google.authorize()
    }
  },
  getDownloadUrl,
  downloadFile,
  showMessage,
  toggleDrive,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(GfxList)
