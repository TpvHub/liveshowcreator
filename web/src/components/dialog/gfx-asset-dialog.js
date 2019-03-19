import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import _ from 'lodash'
import GfxAssets from '../documents/gfx-assets'
import Typography from '@material-ui/core/Typography'

class GfxAssetDialog extends React.Component {
  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)

    this.state = {
      open: true,
      files: [],
      change: false
    }

  }

  handleClose = (option) => {
    this.setState({open: false}, () => {
      if (this.props.onClose) {
        this.props.onClose(option, this.state.files)
      }
    })
  }

  render () {
    const {fullScreen, gfx} = this.props

    const title = _.get(gfx, 'data.title', '')
    return (
      <div>
        <Dialog
          fullScreen={fullScreen}
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle
            id="responsive-dialog-title">Assets: {title}</DialogTitle>
          <DialogContent>
            <GfxAssets
              onDownload={(files) => {
                if(this.props.onDownload){
                  this.props.onDownload(files)
                }
              }}
              onChange={(files) => {

              this.setState({
                files: files,
                change: true,
              })
            }} gfx={gfx}/>

            <Typography>
              To make the asset the primary asset, click and drag the asset into the leftmost position
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button disabled={!this.state.change} color={'primary'} onClick={() => this.handleClose('save')}>
              Save
            </Button>
            <Button onClick={() => this.handleClose('close')}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

GfxAssetDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  gfx: PropTypes.any,
}

export default withMobileDialog()(GfxAssetDialog)