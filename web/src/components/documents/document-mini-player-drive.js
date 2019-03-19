import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import DocumentDrive from './document-drive'
import DocumentMiniPlayer from './document-mini-player'

const ContentForDriveAndMiniPlayer = styled.div `
  position: relative;
  flex: 0 0 300px;
  order: 2;
  color: #222;
  background: #fff;
  border-left: 1px solid #d9d9d9;
  border-right: 1px solid #d9d9d9;
  font-family: 'Roboto', sans-serif;
`

class DocumentMiniPlayerAndDrive extends React.Component {

  // constructor (props) {
  //   super(props)
  // }

  render () {

    const {isOpenMiniPlayer, isOpenDrive} = this.props

    return (
      isOpenMiniPlayer || isOpenDrive ? (
        <ContentForDriveAndMiniPlayer>
          <DocumentMiniPlayer />
          <DocumentDrive />
        </ContentForDriveAndMiniPlayer>
      ) : null
    )

  }
}

const mapStateToProps = (state) => ({
  isOpenMiniPlayer: state.miniPlayer.open,
  isOpenDrive: state.drive.open,
})

export default connect(mapStateToProps, null)(DocumentMiniPlayerAndDrive)
