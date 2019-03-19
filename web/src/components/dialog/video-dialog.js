import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import Video from '../video'
import _ from 'lodash'
import styled from 'styled-components'

const Title = styled.h2 `
  font-size: 15px;
  margin: 0;
  padding: 0;

`

class VideoDialog extends React.Component {
  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)

    this.state = {
      open: true,
    }

    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      this.handleClose();
    };
  }

  handleClose = () => {
    // window.onpopstate = null;
    // if (window.history.state === null) {
    //   window.history.back(); // Clear state
    // }
    this.setState({open: false}, () => {
      if (this.props.onClose) {
        this.props.onClose()
      }
    })
  }

  render () {
    const {fullScreen, file} = this.props

    const filename = _.get(file, 'name')

    return (
      <div>
        <Dialog
          fullScreen={true}
          maxWidth={false}
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogContent style={{margin: 0, padding: 0}}>
            <Video file={file}/>
          </DialogContent>
          <DialogActions>
            <Title>{filename}</Title>
            <Button onClick={this.handleClose} color="primary">Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

VideoDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  file: PropTypes.any,
}

export default withMobileDialog()(VideoDialog)