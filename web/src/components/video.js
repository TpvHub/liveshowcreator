import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled, { keyframes } from 'styled-components'
import _ from 'lodash'
import { getDownloadUrl } from '../redux/actions'

const Wrapper = styled.div `
  display: flex;
  justify-content: center;
  video{
    max-width: 100%;
    max-height: 100%;
  }

`
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
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 1.2rem;
  padding: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  span{
    width: 30px;
    font-size: 30px;
    height: 30px;
    border-radius: 50%;
  }

`

class Video extends React.Component {

  state = {
    source: null,
  }

  componentDidMount () {
    const {file} = this.props

    const fileId = _.get(file, 'id')
    this.props.getDownloadUrl(fileId).then((url) => {
      this.setState({
        source: {
          type: _.get(file, 'mimeType'),
          src: url,
        },
      })
    })
  }

  getScreenHeight () {
    return window.innerHeight
  }

  render () {
    const {source} = this.state

    let mimeType = _.get(source, 'type')
    if (mimeType === 'video/quicktime') {
      mimeType = 'video/mp4'
    }
    return (
      <Wrapper>
        {
          source ? (
            <video
              style={{maxHeight: this.getScreenHeight() - 55}}
              muted={true} autoPlay={true} controls={true}>
              <source src={_.get(source, 'src')} type={mimeType}/>
            </video>
          ) : (
            <Loading>
              <span className={'md-icon'}>access_time</span>
            </Loading>
          )
        }
      </Wrapper>
    )
  }
}

const mapStateProps = (state) => ({})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getDownloadUrl,
}, dispatch)

export default connect(mapStateProps, mapDispatchToProps)(Video)