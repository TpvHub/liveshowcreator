import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { store } from '../../store'
import {
  toggleMiniPlayer,
  toggleCinemaView,
  getDownloadUrl,
  listFiles,
  uploadFiles,
  showMessage,
  downloadFile,
  deleteFile,
  updateGfxCard,
} from '../../redux/actions'
// import { OrderedMap, Map } from 'immutable'
import _ from 'lodash'
// import moment from 'moment'
import styled, { keyframes } from 'styled-components'
// import download from '../../helper/download'
// import MessageUploadFile from '../message-upload-file'
import {
  Button,
  // CircularProgress
} from '@material-ui/core'
import { SkipNext, SkipPrevious, Fullscreen } from '@material-ui/icons'

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
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.2rem;
  padding: 0;
  position: absolute;
  top: 39%;
  left: 42%;
  z-index: 1;
  span{
    width: 50px;
    font-size: 50px;
    height: 50px;
    border-radius: 50%;
  }

`

// const DivProgress = styled.div `
//   display: flex;
//   color: white;
//   p {
//     padding: 0 20px;
//   }
// `

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
  // overflow-y: scroll;
  width: 100%;
  flex: 1 1 auto;
`

const Actions = styled.div `
  flex: 0 0 auto;
  background: rgba(0, 0, 0, 0.1)

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

class DocumentDrive extends React.Component {
  constructor (props) {
    super(props)
    const selectedOrderNumFromProps = props.listFilesMiniPlayer ? _.findIndex([...props.listFilesMiniPlayer.values()], _item => { return _item.id === props.fileId }) : 0
    this.state = {
      isLoading: true,
      selectedOrderNum: selectedOrderNumFromProps,
    }
  }

  componentWillMount() {
  }

  componentDidMount () {
  }

  componentWillReceiveProps(nextProps) {
    const {
      // isOpen,
      fileId,
      listFilesMiniPlayer = []
    } = nextProps
    const listFilesMiniPlayerFromProps = this.props.listFilesMiniPlayer || []
    if ((_.difference(listFilesMiniPlayer, listFilesMiniPlayerFromProps)).length !== 0 ||
      _.get(listFilesMiniPlayer, 'length', 0) !== _.get(listFilesMiniPlayerFromProps, 'length', 0) ||
      fileId !== this.props.fileId
    ) {
      const selectedOrderNumFromProps = _.findIndex([...listFilesMiniPlayer.values()], _item => { return _item.id === fileId })
      this.setState({ selectedOrderNum: selectedOrderNumFromProps, isLoading: true })
    }

  }

  componentWillUnmount() {
  }

  // shouldComponentUpdate (nextProps, nextState) {
  //   return true
  // }

  handleClickSkip = (type) => {
    const {listFilesMiniPlayer = []} = this.props
    const {selectedOrderNum} = this.state
    const maxIndexListFilesMiniPlayer = [...listFilesMiniPlayer.values()].length - 1
    let selectedOrderNumNew = 0

    if (type === 'next') {
      if (selectedOrderNum === maxIndexListFilesMiniPlayer) {
        selectedOrderNumNew = 0
      } else {
        selectedOrderNumNew = selectedOrderNum + 1
      }
    }
    if (type === 'previous') {
      if (selectedOrderNum === 0) {
        selectedOrderNumNew = maxIndexListFilesMiniPlayer
      } else {
        selectedOrderNumNew = selectedOrderNum - 1
      }
    }
    this.setState({ selectedOrderNum: selectedOrderNumNew, isLoading: true });
  }

  handleAddToGfx () {

    // only handle when editing a Gfx
    const state = store.getState()
    if (state.gfxEdit === null) return

    const { gfxEdit, listFilesMiniPlayer = [] } = this.props
    const { selectedOrderNum } = this.state
    const currentFileId = [...listFilesMiniPlayer.values()].length > 0 ? [...listFilesMiniPlayer.values()][selectedOrderNum].id : ''

    if (currentFileId !== '') {
      const gfx = gfxEdit.data

      const _selection = {
        index: _.get(gfxEdit, 'index', 0),
        length: _.get(gfxEdit, 'length', 0),
      }

      // update the files list
      let files = gfx.files
      const old_files = _.cloneDeep(gfx.files)

      const isFileExist = files.find((i) => _.get(i, 'id') === currentFileId)
      if (!isFileExist) {
        const file = listFilesMiniPlayer.find((i) => _.get(i, 'id') === currentFileId)
        files.push(file)
      }


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
      this.props.showMessage({
        body: <span style={{color: 'green'}}>Success</span>,
        duration: 2000,
      })
    }
  }

  render () {

    const {
      isOpen,
      // fileId,
      listFilesMiniPlayer = [],
      disableSort = false
    } = this.props
    const { selectedOrderNum, isLoading } = this.state

    const currentFileId = [...listFilesMiniPlayer.values()].length > 0 ? [...listFilesMiniPlayer.values()][selectedOrderNum].id : ''
    return (
      isOpen ? (
        <Container>
          <Inner>
            <SidebarHeader>
              <SidebarHeaderTop>
                <div className={'sidebar-title'}>Preview</div>

                <div onClick={() => {
                  this.props.toggleMiniPlayer(null)
                }} title={'Close sidebar'} className={'sidebar-toggle'}>
                  <i className={'md-icon'}>chevron_right</i>
                </div>
              </SidebarHeaderTop>
            </SidebarHeader>
            <Content>
              {isLoading && currentFileId !== '' && (<Loading>
                  <span className={'md-icon'}>access_time</span>
                </Loading>)}
                <div style={{
                  marginBottom: '-43px',
                  overflow: 'hidden',
                  padding: 0
                }}>
                  <div
                    onContextMenu={() => false}
                    style={{
                      position:'relative',
                      paddingTop:'73%'
                    }}
                  >
                    {(currentFileId !== '') && <React.Fragment>
                      <iframe
                        title={"Document Mini Player"}
                        onLoad={e => this.setState({ isLoading: false })}
                        src={`https://drive.google.com/file/d/${currentFileId}/preview`}
                        frameBorder="0"
                        allowFullScreen
                        style={{
                          position:'absolute',
                          top: '0',
                          left: '0',
                          width: '100%',
                          height: '80%'
                        }}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      />
                      <HidePopOut
                        onClick={() => this.props.toggleCinemaView(true, {fileId: currentFileId, listFiles: [...listFilesMiniPlayer.values()], disableSort })}
                      >&nbsp;</HidePopOut>
                    </React.Fragment>}
                  </div>
                </div>
            </Content>
            <Actions>
            <Button
              // disabled
              onClick={() => this.handleClickSkip('previous')}
              color="primary"
              autoFocus>
              <SkipPrevious color={'primary'} style={{ verticalAlign: 'middle' }} />
            </Button>

            <Button
              // disabled
              onClick={() => this.handleClickSkip('next')}
              color="primary"
              autoFocus>
              <SkipNext color={'primary'} style={{ verticalAlign: 'middle' }} />
            </Button>

            <Button
              // disabled
              onClick={() => this.handleAddToGfx()}
              color="primary"
              autoFocus
              style={{ fontSize: '13.5px' }}
            >
              {'Add to GFX'}
            </Button>

            <Button
              // disabled
              onClick={() => this.props.toggleCinemaView(true, {fileId: currentFileId, listFiles: [...listFilesMiniPlayer.values()], disableSort })}
              color="primary"
              autoFocus
              style={{ float: 'right' }}
            >
              <Fullscreen color={'primary'} />
            </Button>
          </Actions>
          </Inner>
        </Container>
      ) : null
    )
  }
}

const mapStateToProps = (state, props) => ({
  isOpen: state.miniPlayer.open,
  fileId: state.miniPlayer.fileId,
  listFilesMiniPlayer: state.miniPlayer.listFiles,
  message: state.message,
  gfxEdit: state.drive.gfxEdit,
  disableSort: _.get(state, 'cinemaView.disableSort', false),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleMiniPlayer,
  toggleCinemaView,
  listFiles,
  uploadFiles,
  getDownloadUrl,
  showMessage,
  downloadFile,
  deleteFile,
  updateGfxCard,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentDrive)
