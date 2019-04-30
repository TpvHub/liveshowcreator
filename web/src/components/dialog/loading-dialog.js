import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import LinearProgress from '@material-ui/core/LinearProgress'
import { connect } from 'react-redux'
import _ from 'lodash'

import {
  showLoadingDialog,
} from '../../redux/actions/'

class AlertDialog extends React.Component {

  render() {
    const {
      open,
      handleClose,
      text
    } = this.props

    return (
      <div>
        <Dialog
          open={open}
          onClose={() => handleClose ? handleClose() : this.props.showLoadingDialog({ open: false })}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{text}</DialogTitle>
          <DialogContent>
            <LinearProgress />
          </DialogContent>
        </Dialog>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  text: _.get(state, 'loadingDialog.text', ''),
  open: _.get(state, 'loadingDialog.open', false),
  handleClose: _.get(state, 'loadingDialog.onClose', null),
})

export default connect(mapStateToProps, {
  showLoadingDialog
})(AlertDialog)