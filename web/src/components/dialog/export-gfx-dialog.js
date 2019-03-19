import React from 'react'
import PropTypes from 'prop-types'
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  withMobileDialog,
  Snackbar,
  IconButton
} from '@material-ui/core'
import { Close } from '@material-ui/icons'
import _ from 'lodash'
import { config } from '../../config'

class ExportGfxDialog extends React.Component {
  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.handleCloseMessage = this.handleCloseMessage.bind(this)
    this.state = {
      open: false,
      openMessage: false
    }

  }

  handleCloseMessage = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    this.setState({openMessage: false})
  }
  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render () {

    const {fullScreen, doc, open, token} = this.props
    const docId = _.get(doc, '_id')
    const gfxUrl = `${config.url}/documents/${docId}/download/gfx?option=view`

    return (
      <div>
        <Dialog
          fullScreen={fullScreen}
          open={open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle
            id="responsive-dialog-title">Export GFX</DialogTitle>
          <DialogContent style={{minWidth: 300}}>
            <TextField
              onClick={(e) => {
                e.target.select()
                try {
                  document.execCommand('copy')

                  this.setState({
                    openMessage: true
                  })
                }
                catch (e) {
                  console.log('An error copy text')
                }

              }}
              name={'gfx-url'}
              id={'gfx-url'}
              label={'GFX export link'}
              value={gfxUrl}
              margin="normal"
              fullWidth
              multiline={true}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              window.location = `${config.url}/documents/${docId}/download/gfx?auth=${_.get(token, 'token', '')}`
            }} type={'button'}>Download GFX</Button>
            <Button onClick={this.handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.state.openMessage}
          autoHideDuration={3000}
          onClose={this.handleCloseMessage}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">GFX link copied to clipboard</span>}
          action={[
            null,
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              onClick={this.handleCloseMessage}
            >
              <Close/>
            </IconButton>,
          ]}
        />
      </div>
    )
  }
}

ExportGfxDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  docId: PropTypes.string,
  doc: PropTypes.any,
  token: PropTypes.any,
}

export default withMobileDialog()(ExportGfxDialog)