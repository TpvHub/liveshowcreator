import React, { Component } from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  downloadFile,
  getFileInfo,
  setImageUrlWithFileId,
  toggleMiniPlayer,
  toggleCinemaView,
  showContextMenu,
} from '../redux/actions'
import _ from 'lodash'
import BgImage from '../assets/images/bg_asset.png'
import { getImageByFileId } from '../redux/selectors';

const Wrapper = styled.div `
  background: url('${BgImage}') repeat 0 0 transparent;
  width: 100%;
  height: 100%;

`
const Img = styled.img `
  max-width: 100%;
  height: 100%;
  width: 100%;
  object-fit: cover;
`

const FileNotFoundBase64 = `data:image/png;base64,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`;

class Image extends Component {

  constructor (props) {
    super(props)
    this.handleView = this.handleView.bind(this)

    this.state = {
      downloading: true,
      fileId: null,
      openViewDialog: false,
      src: null,
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.fileId !== _.get(nextProps, 'fileId'))
      this.setState({
        fileId: nextProps.fileId,
      }, () => {
        this.fetchFile(nextProps.fileId)
      })
  }

  componentDidMount () {
    const {fileId, image} = this.props
    if (!image) {
      this.fetchFile(fileId)
    }
  }

  /**
   * Fetch file info
   * @param fileId
   */
  fetchFile (fileId) {
    if (!!fileId) {
      let intervalCheckLoadImage;

      const downloadFile = () => {
        this.props.getFileInfo(fileId).then((res) => {

          const thumbnailLink = _.get(res.data, 'thumbnailLink')
          if (this.ref) {
            this.ref.setAttribute('src', thumbnailLink)
            this.props.setImageUrlWithFileId({
              fileId,
              src: thumbnailLink,
              richInfo: res.data,
            });
          }
          clearInterval(intervalCheckLoadImage)
        }).catch((err) => {
          const { code, message } = err.response.data.error
          // console.log({ code, message })
          switch (code) {
            case 403:
              if (message.indexOf("User Rate Limit Exceeded. Please upload fewer than 10 files at once.") > -1) { // User Rate Limit Exceeded.
                
              }
              break;
            case 404:
              if (message.indexOf("File not found") > -1) { // File not found
                if (this.ref) {
                  this.ref.setAttribute('src', FileNotFoundBase64)
                  this.props.setImageUrlWithFileId({
                    fileId,
                    src: FileNotFoundBase64,
                  });
                }
              }
              clearInterval(intervalCheckLoadImage)
              break;
            default:
              break;
          }
        })
      }

      downloadFile()
      intervalCheckLoadImage = setInterval(downloadFile, 3000)
    }
  }

  handleRightClick = (e) => {
    // console.log(e);
    e.preventDefault()
    const {
      fileId,
      items,
      // cinemaView,
      // toggleMiniPlayer = {},
      // whereNeedToShowContextMenu = '',
      isFromDrive = false
    } = this.props
    this.props.toggleCinemaView(true, {fileId, listFiles: items, disableSort: isFromDrive});

    /* // Open this code for right click image
    this.props.showContextMenu({
      menu: [
        {
          label: 'Open in Cinema View',
          key: 'open-in-cinema-view',
        },{
          label: 'Add to GFX',
          key: 'add-to-gfx',
        },
      ],
      position: ReactDOM.findDOMNode(this.imageContainerRef).getBoundingClientRect(),
      whereNeedToShow: whereNeedToShowContextMenu
    });
    */
  }

  handleView = () => {
    const {
      view,
      fileId,
      // downloadFile,
      items,
      cinemaView,
      toggleMiniPlayer = {},
      toggleCinemaView = {},
      isFromDrive = false
    } = this.props
    
    if (view) {
      if (cinemaView) {
        toggleCinemaView(true, {fileId, listFiles: items, disableSort: isFromDrive});
      } else {
        toggleMiniPlayer(true, {fileId, listFiles: items});
      }
      // this.setState({
      //   // downloading: true,
      //   openViewDialog: true,
      // }, () => {
      //   // downloadFile(fileId).then((data) => {
      //   //   const ref = this.ref
      //   //   let reader = new window.FileReader()
      //   //   reader.readAsDataURL(data)
      //   //   reader.onload = () => {
      //   //     let imageDataUrl = reader.result
      //   //     if (ref) {
      //   //       ref.setAttribute('src', imageDataUrl)
      //   //       this.setState({
      //   //         downloading: false,
      //   //         src: imageDataUrl,
      //   //       })
      //   //     }
      //   //   }
      //   // })
      // });
      // window.history.pushState(null, null, window.location.href);
      // window.onpopstate = () => {
      //   this.handleClose();
      // };
    }
    
  }

  handleClose = () => {
    // window.onpopstate = null;
    // if (window.history.state === null) {
    //   window.history.back(); // Clear state
    // }
    this.setState({openViewDialog: false})
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render () {

    const {className, view, image} = this.props
    let stylesImage = this.props.stylesImage || {};
    return (
      <React.Fragment>
        <Wrapper
          onClick={this.handleView}
          onContextMenu={this.handleRightClick}
          className={className ? className : 'img'}
          style={{cursor: view ? 'pointer': 'inherit', ...stylesImage}}
          ref={(ref) => this.imageContainerRef = ref}
        >
          <Img innerRef={(ref) => this.ref = ref} src={image && image.src} alt={''}/>
        </Wrapper>
      </React.Fragment>
    )

  }
}

const mapStateToProps = (state, props) => {
  return {
    gfx: state.gfx,
    image: getImageByFileId(state, props),
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  downloadFile,
  getFileInfo,
  setImageUrlWithFileId,
  toggleMiniPlayer,
  toggleCinemaView,
  showContextMenu,
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Image)
