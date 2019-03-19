import React from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import {
  getFileInfo,
  setImageUrlWithFileId,
  toggleMiniPlayer,
  toggleCinemaView,
  showMessage,
} from '../../redux/actions'
import { getImageByFileId } from '../../redux/selectors';

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  
  img{
    max-width: 100%;
    height: 100%;
    width: 100%;
    object-fit: cover;
  }
`

const FileNotFoundBase64 = `data:image/png;base64,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`;
const FileLoadingPreview = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4yLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iTGF5ZXJfMSIKICAgeD0iMHB4IgogICB5PSIwcHgiCiAgIHdpZHRoPSIzODQiCiAgIGhlaWdodD0iMzg0IgogICB2aWV3Qm94PSIwIDAgMzg0IDM4NCIKICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45MSByMTM3MjUiCiAgIHNvZGlwb2RpOmRvY25hbWU9IkxvYWRpbmdfaWNvbl93aXRoX2ZhZGUuc3ZnIj48dGl0bGUKICAgaWQ9InRpdGxlNDE2MSI+Q2lyY3VsYXIgZGFzaGVzIGxvYWRpbmcgaWNvbjwvdGl0bGU+PG1ldGFkYXRhCiAgIGlkPSJtZXRhZGF0YTMzIj48cmRmOlJERj48Y2M6V29yawogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPkNpcmN1bGFyIGRhc2hlcyBsb2FkaW5nIGljb248L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICBpZD0iZGVmczMxIiAvPjxzb2RpcG9kaTpuYW1lZHZpZXcKICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgYm9yZGVyb3BhY2l0eT0iMSIKICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTI4MCIKICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iNzQ0IgogICBpZD0ibmFtZWR2aWV3MjkiCiAgIHNob3dncmlkPSJmYWxzZSIKICAgZml0LW1hcmdpbi10b3A9IjAiCiAgIGZpdC1tYXJnaW4tbGVmdD0iMCIKICAgZml0LW1hcmdpbi1yaWdodD0iMCIKICAgZml0LW1hcmdpbi1ib3R0b209IjAiCiAgIGlua3NjYXBlOnpvb209IjAuNDYwOTM3NSIKICAgaW5rc2NhcGU6Y3g9IjE5MiIKICAgaW5rc2NhcGU6Y3k9IjE4OS44MzA1MSIKICAgaW5rc2NhcGU6d2luZG93LXg9Ii00IgogICBpbmtzY2FwZTp3aW5kb3cteT0iLTQiCiAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkxheWVyXzEiIC8+CjxnCiAgIGlkPSJnMyIKICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY0LC02NCkiPgoJPHBhdGgKICAgZD0ibSA0MzIsMjQwIC04MCwwIGMgLTguOCwwIC0xNiw3LjIgLTE2LDE2IDAsOC44IDcuMiwxNiAxNiwxNiBsIDgwLDAgYyA4LjgsMCAxNiwtNy4yIDE2LC0xNiAwLC04LjggLTcuMiwtMTYgLTE2LC0xNiB6IgogICBpZD0icGF0aDUiCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjAuNjA3ODQzMTYiIC8+Cgk8cGF0aAogICBkPSJtIDE3NiwyNTYgYyAwLC04LjggLTcuMiwtMTYgLTE2LC0xNiBsIC04MCwwIGMgLTguOCwwIC0xNiw3LjIgLTE2LDE2IDAsOC44IDcuMiwxNiAxNiwxNiBsIDgwLDAgYyA4LjgsMCAxNiwtNy4yIDE2LC0xNiB6IgogICBpZD0icGF0aDciCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgIHN0eWxlPSJmaWxsOiMwMDAwMDAiIC8+Cgk8cGF0aAogICBkPSJtIDI1NiwzMzYgYyAtOC44LDAgLTE2LDcuMiAtMTYsMTYgbCAwLDgwIGMgMCw4LjggNy4yLDE2IDE2LDE2IDguOCwwIDE2LC03LjIgMTYsLTE2IGwgMCwtODAgYyAwLC04LjggLTcuMiwtMTYgLTE2LC0xNiB6IgogICBpZD0icGF0aDkiCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjAuOTAxOTYwNzkiIC8+Cgk8cGF0aAogICBkPSJtIDI1Niw2NCBjIC04LjgsMCAtMTYsNy4yIC0xNiwxNiBsIDAsODAgYyAwLDguOCA3LjIsMTYgMTYsMTYgOC44LDAgMTYsLTcuMiAxNiwtMTYgbCAwLC04MCBjIDAsLTguOCAtNy4yLC0xNiAtMTYsLTE2IHoiCiAgIGlkPSJwYXRoMTEiCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgIHN0eWxlPSJmaWxsOiMwMDAwMDAiIC8+Cgk8cGF0aAogICBkPSJtIDMyNS4zLDIxNiBjIDQuNCw3LjcgMTQuMiwxMC4zIDIxLjksNS45IGwgNjkuMywtNDAgYyA3LjcsLTQuNCAxMC4zLC0xNC4yIDUuOSwtMjEuOSAtNC40LC03LjcgLTE0LjIsLTEwLjMgLTIxLjksLTUuOSBsIC02OS4zLDQwIGMgLTcuNyw0LjUgLTEwLjMsMTQuMiAtNS45LDIxLjkgeiIKICAgaWQ9InBhdGgxMyIKICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgc3R5bGU9ImZpbGw6IzAwMDAwMCIgLz4KCTxwYXRoCiAgIGQ9Im0gMTg2LjcsMjk2IGMgLTQuNCwtNy43IC0xNC4yLC0xMC4zIC0yMS45LC01LjkgbCAtNjkuMyw0MCBjIC03LjcsNC40IC0xMC4zLDE0LjIgLTUuOSwyMS45IDQuNCw3LjcgMTQuMiwxMC4zIDIxLjksNS45IGwgNjkuMywtNDAgYyA3LjcsLTQuNSAxMC4zLC0xNC4yIDUuOSwtMjEuOSB6IgogICBpZD0icGF0aDE1IgogICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICBzdHlsZT0iZmlsbDojMDAwMDAwIiAvPgoJPHBhdGgKICAgZD0ibSAzMTcuOSwzMzEuMSBjIC00LjQsLTcuNyAtMTQuMiwtMTAuMyAtMjEuOSwtNS45IC03LjcsNC40IC0xMC4zLDE0LjIgLTUuOSwyMS45IGwgNDAsNjkuMyBjIDQuNCw3LjcgMTQuMiwxMC4zIDIxLjksNS45IDcuNywtNC40IDEwLjMsLTE0LjIgNS45LC0yMS45IGwgLTQwLC02OS4zIHoiCiAgIGlkPSJwYXRoMTciCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjAuODAzOTIxNTgiIC8+Cgk8cGF0aAogICBkPSJtIDE4MS45LDk1LjYgYyAtNC40LC03LjcgLTE0LjIsLTEwLjMgLTIxLjksLTUuOSAtNy43LDQuNCAtMTAuMywxNC4yIC01LjksMjEuOSBsIDQwLDY5LjMgYyA0LjQsNy43IDE0LjIsMTAuMyAyMS45LDUuOSA3LjcsLTQuNCAxMC4zLC0xNC4yIDUuOSwtMjEuOSBsIC00MCwtNjkuMyB6IgogICBpZD0icGF0aDE5IgogICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICBzdHlsZT0iZmlsbDojMDAwMDAwIiAvPgoJPHBhdGgKICAgZD0ibSAyOTYsMTg2LjcgYyA3LjcsNC40IDE3LjQsMS44IDIxLjksLTUuOSBsIDQwLC02OS4zIGMgNC40LC03LjcgMS44LC0xNy40IC01LjksLTIxLjkgLTcuNywtNC40IC0xNy40LC0xLjggLTIxLjksNS45IGwgLTQwLDY5LjMgYyAtNC40LDcuNyAtMS44LDE3LjUgNS45LDIxLjkgeiIKICAgaWQ9InBhdGgyMSIKICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgc3R5bGU9ImZpbGw6IzAwMDAwMCIgLz4KCTxwYXRoCiAgIGQ9Im0gMjE2LDMyNS4zIGMgLTcuNywtNC40IC0xNy40LC0xLjggLTIxLjksNS45IGwgLTQwLDY5LjMgYyAtNC40LDcuNyAtMS44LDE3LjQgNS45LDIxLjkgNy43LDQuNCAxNy40LDEuOCAyMS45LC01LjkgbCA0MCwtNjkuMyBjIDQuNCwtNy43IDEuOCwtMTcuNSAtNS45LC0yMS45IHoiCiAgIGlkPSJwYXRoMjMiCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgIHN0eWxlPSJmaWxsOiMwMDAwMDAiIC8+Cgk8cGF0aAogICBkPSJtIDQxNi40LDMzMC4xIC02OS4zLC00MCBjIC03LjcsLTQuNCAtMTcuNCwtMS44IC0yMS45LDUuOSAtNC40LDcuNyAtMS44LDE3LjQgNS45LDIxLjkgbCA2OS4zLDQwIGMgNy43LDQuNCAxNy40LDEuOCAyMS45LC01LjkgNC40LC03LjcgMS44LC0xNy40IC01LjksLTIxLjkgeiIKICAgaWQ9InBhdGgyNSIKICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgc3R5bGU9ImZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MC43MDU4ODIzNyIgLz4KCTxwYXRoCiAgIGQ9Im0gOTUuNiwxODEuOSA2OS4zLDQwIGMgNy43LDQuNCAxNy40LDEuOCAyMS45LC01LjkgNC41LC03LjcgMS44LC0xNy40IC01LjksLTIxLjkgbCAtNjkuMywtNDAgYyAtNy43LC00LjQgLTE3LjQsLTEuOCAtMjEuOSw1LjkgLTQuNCw3LjcgLTEuOCwxNy40IDUuOSwyMS45IHoiCiAgIGlkPSJwYXRoMjciCiAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgIHN0eWxlPSJmaWxsOiMwMDAwMDAiIC8+CjwvZz4KPC9zdmc+`

class GfxVideoThumbnail extends React.Component {

  constructor (props) {
    super(props)

    this.fetchFile = this.fetchFile.bind(this)
    this.state = {
      hasThumbnail: false,
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

          const hasThumbnail = _.get(res.data, 'hasThumbnail')
          this.setState({ hasThumbnail })
          if (hasThumbnail) {
            const thumbnailLink = _.get(res.data, 'thumbnailLink')
            if (this.ref) {
              this.ref.setAttribute('src', thumbnailLink)
              this.props.setImageUrlWithFileId({
                fileId,
                src: thumbnailLink,
                richInfo: res.data,
              });
            }
          } else {
            if (this.ref) {
              this.ref.setAttribute('src', FileLoadingPreview)
              this.props.setImageUrlWithFileId({
                fileId,
                src: FileLoadingPreview,
              });
            }
          }
          clearInterval(intervalCheckLoadImage)
        }).catch((err) => {
          const { code, message } = err.response.data.error
          switch (code) {
            case 403:
              if (message.indexOf("User Rate Limit Exceeded.") > -1) { // User Rate Limit Exceeded.
                
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

  componentDidMount () {
    const {fileId, image} = this.props
    if (!image) {
      this.fetchFile(fileId)
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
      toggleCinemaView = {},
      isFromDrive = false
    } = this.props
    if (this.state.hasThumbnail) {
      toggleCinemaView(true, {fileId, listFiles: items, disableSort: isFromDrive});
    } else {
      this.checkAgainFileDetail();
    }
  }

  handleView = () => {
    const {
      fileId,
      items,
      cinemaView,
      toggleMiniPlayer = {},
      toggleCinemaView = {},
      isFromDrive = false,
    } = this.props

    if (this.state.hasThumbnail) {
      if (cinemaView) {
        toggleCinemaView(true, {fileId, listFiles: items, disableSort: isFromDrive});
      } else {
        toggleMiniPlayer(true, {fileId, listFiles: items});
      }
    } else {
      this.checkAgainFileDetail();
    }
    
  }

  checkAgainFileDetail = () => {
    const {fileId, showMessage} = this.props
    this.fetchFile(fileId)
    showMessage({
      body: 'Please wait thumbnail and preview being generated.',
      duration: 5000,
    })
  }

  render () {

    const {className, image, isOnThumbnailSlider} = this.props
    let pixelToCentered = isOnThumbnailSlider ? "30" : "30";

    return (
      <Container onContextMenu={this.handleRightClick} onClick={() => this.handleView()} className={className ? className : null}>
        <i
          style={{
            position: 'absolute',
            top: `calc(50% - ${pixelToCentered}px)`,
            left: `calc(50% - ${pixelToCentered}px)`,
            fontSize: '60px',
            color: 'white',
          }}
          className={'md-icon'}
        >
          play_circle_outline
        </i>
        <img style={{ ...this.props.stylesImage }} ref={(node) => this.ref = node} src={image && image.src} alt={''}/>
      </Container>
    )
  }

}

const mapStateToProps = (state, props) => ({
  image: getImageByFileId(state, props),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getFileInfo,
  setImageUrlWithFileId,
  toggleMiniPlayer,
  toggleCinemaView,
  showMessage,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(GfxVideoThumbnail)