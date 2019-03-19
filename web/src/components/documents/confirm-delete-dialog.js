import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core'

import _ from 'lodash'

export default class ConfirmDeleteDialog extends React.Component {

  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
  }

  handleClose (action = 'cancel') {
    if (this.props.onClose) {
      this.props.onClose(action)
    }
  }

  render () {

    const {open} = this.props
    const title = _.get(this.props, 'title', 'Are you sure?')
    const body = _.get(this.props, 'body', 'This action cannot be undone.')
    const showCancel = _.get(this.props, 'showCancelButton', true)
    const cancelButtonTitle = _.get(this.props, 'cancelButtonTitle', 'Cancel')
    const showDeleteButton = _.get(this.props, 'showDeleteButton', true)
    const deleteButtonTitle = _.get(this.props, 'deleteButtonTitle', 'Delete')
    return (
      <Dialog
        open={open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {body}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {
            showCancel && (
              <Button onClick={() => this.handleClose('cancel')}
                      color="primary">
                {cancelButtonTitle}
              </Button>)
          }
          {
            showDeleteButton && (
              <Button onClick={() => this.handleClose('delete')}
                      color="secondary" autoFocus>
                {
                  deleteButtonTitle
                }
              </Button>
            )
          }
        </DialogActions>
      </Dialog>
    )
  }
}