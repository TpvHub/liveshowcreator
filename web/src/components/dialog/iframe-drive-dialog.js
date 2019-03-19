import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import _ from 'lodash'
import styled from 'styled-components'

const Title = styled.h2 `
  font-size: 15px;
  margin: 0;
  padding: 0;

`

class IframeDriveDialog extends React.Component {
  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)

    this.state = {
      open: true,
      iFrameHeight: '500px'
    }

    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      this.handleClose();
    };
  }

  handleClose = () => {
    window.onpopstate = null;
    if (window.history.state === null) {
      window.history.back(); // Clear state
    }
    this.setState({open: false}, () => {
      if (this.props.onClose) {
        this.props.onClose()
      }
    })
  }

  render () {
    const {
      // fullScreen,
      file
    } = this.props

    const filename = _.get(file, 'name')
    const fileId = _.get(file, 'id', '')

    return (
      <div>
        { this.state.open && fileId !== '' &&
        <Dialog
          fullScreen={true}
          maxWidth={false}
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogContent style={{margin: 0, padding: 0, marginBottom: '-210px' }}>
            <div style={{position:'relative', paddingTop:'56.25%'}}>
              <iframe
                title={"Iframe Drive Dialog"}
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                frameBorder="0"
                allowFullScreen
                style={{position:'absolute',top:'0',left:'0',width:'100%',height:'80%'}}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Title>{filename}</Title>
            <Button onClick={this.handleClose} color="primary">Close</Button>
          </DialogActions>
        </Dialog>
        }
      </div>
    )
  }
}

IframeDriveDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  file: PropTypes.any,
}

export default withMobileDialog()(IframeDriveDialog)