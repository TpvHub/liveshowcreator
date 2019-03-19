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
import Select from '../form/select'
import { createBackup } from '../../redux/actions'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

class CreateBackupDialog extends React.Component {

  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.handleCloseMessage = this.handleCloseMessage.bind(this)
    this.onChange = this.onChange.bind(this)

    this.state = {
      open: false,
      message: null,
      backup: {
        snapshot: '',
        backupType: 'database',
      }
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

  onChange (event) {

    const name = _.get(event, 'target.name')
    const value = _.get(event, 'target.value', '')

    this.setState({
      backup: {
        ...this.state.backup,
        [name]: value
      }
    })
  }

  render () {

    const {fullScreen, open} = this.props

    return (
      <div>
        <Dialog
          fullScreen={fullScreen}
          open={open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle
            id="responsive-dialog-title">Create backup snapshot</DialogTitle>
          <DialogContent style={{minWidth: 300}}>
            <TextField
              onChange={this.onChange}
              name={'snapshot'}
              id={'snapshot'}
              label={'Snapshot'}
              value={_.get(this.state, 'backup.snapshot', '')}
              margin="normal"
              fullWidth
            />
            <Select
              required={true}
              label={'Status'}
              defaultValue={_.get(this.state.backup, 'backupType', 'database')}
              onChange={(selected) => {
                this.setState({
                    backup: {
                      ...this.state.backup,
                      backupType: selected
                    }
                  }
                )
              }} options={[
              'database',
              'code'
            ]}/>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                this.props.createBackup(this.state.backup).then(() => {
                  this.handleClose()
                }).catch((err) => {
                  this.setState({
                    message: 'An error creating new backup snapshot, please try again.'
                  })
                })
              }}
              color={'primary'}>
              Create
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

CreateBackupDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  createBackup
}, dispatch)
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMobileDialog()(CreateBackupDialog))