import React from 'react'
import _ from 'lodash'
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core'

export default class RenameDialog extends React.Component {
  constructor (props) {
    super(props)

    this._onChange = this._onChange.bind(this)
    this.handleClose = this.handleClose.bind(this)

    this.state = {
      title: '',
    }

  }

  handleClose (action) {

    if (this.props.onClose) {
      this.props.onClose(action, this.state.title)
    }

  }

  _onChange (event) {
    this.setState({
      title: event.target.value,
    })
  }

  componentDidMount () {
    const {title} = this.props
    this.setState({
      title: title,
    })
  }

  render () {

    const {open} = this.props
    const body = _.get(this.props, 'body',
      'Please enter a new name for the item:')

    return (
      <Dialog
        open={open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">'Rename'</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {body}
          </DialogContentText>
          <TextField
            name={'title'}
            id="title"
            label="Email"
            value={this.state.title}
            margin="normal"
            fullWidth
            onChange={this._onChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.handleClose('ok')} color="secondary"
                  autoFocus>
            Ok
          </Button>
          <Button onClick={() => this.handleClose('cancel')} color="primary">
            Cancel
          </Button>)

        </DialogActions>
      </Dialog>
    )
  }
}