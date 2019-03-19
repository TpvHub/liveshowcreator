import React from 'react'
import PropTypes from 'prop-types'
import { CircularProgress } from '@material-ui/core'
import styled from 'styled-components'
import _ from 'lodash'

const DivProgress = styled.div `
  display: flex;
  color: white;
  p {
    padding: 0 20px;
  }
`

class MessageUploadFile extends React.Component {

  render () {
    const {payload, isFinished = false, numOfFileDone = 0, total = 0} = this.props
    const {loaded, file} = payload || {}

    return isFinished ?
      <DivProgress><CircularProgress variant="static" value={100} /><p>Finished {numOfFileDone + '/' + total} Files</p></DivProgress> :
      <DivProgress>
        <CircularProgress variant="static" value={loaded/file.size*100} />
        <p>Your file is uploading. <br/> {file.name} ({_.round(loaded/file.size*100, 2)}%)</p>
      </DivProgress>
  }
}

MessageUploadFile.propTypes = {
  payload: PropTypes.object,
}

export default MessageUploadFile