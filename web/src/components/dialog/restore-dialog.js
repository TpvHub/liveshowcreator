import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  withMobileDialog,
  Snackbar,
  IconButton,
  Typography
} from '@material-ui/core'
import { Close } from '@material-ui/icons'
import _ from 'lodash'
import { restore } from '../../redux/actions'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import moment from 'moment'

class RestoreDialog extends React.Component {

  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.handleCloseMessage = this.handleCloseMessage.bind(this)

    this.state = {
      open: false,
      message: null,
    }

  }

  handleCloseMessage = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    this.setState({message: null})
  }
  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render () {

    const {fullScreen, open, backup} = this.props

    return (
      <div>
        <Dialog
          fullScreen={fullScreen}
          open={open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle
            id="responsive-dialog-title">Are you sure want to restore?</DialogTitle>
          <DialogContent style={{minWidth: 300}}>
            <Typography>Snapshot: {_.get(backup, 'snapshot')}</Typography>
            <Typography>Type: {_.get(backup, 'backupType')}</Typography>
            <Typography>Created: {moment(_.get(backup, 'createdAt')).format('LLL')}</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                const restore = {
                  id: backup.id,
                  key: backup.key,
                  backupType: backup.backupType,
                }

                this.props.restore(restore).then(() => {
                  this.handleClose()

                }).catch((err) => {

                  this.setState({
                    message: 'An error restoring the backup, please try again.'
                  })
                })
              }}
              color={'primary'}>
              Restore
            </Button>
            <Button onClick={this.handleClose}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={!!this.state.message}
          autoHideDuration={3000}
          onClose={this.handleCloseMessage}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">{this.state.message}</span>}
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

RestoreDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  backup: PropTypes.any,
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  restore
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMobileDialog()(RestoreDialog))