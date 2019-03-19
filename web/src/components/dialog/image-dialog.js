import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import CircularProgress from '@material-ui/core/CircularProgress'
import styled from 'styled-components'
import BgImage from '../../assets/images/bg_asset.png'

const Content = styled.div `
  justify-content: center;
  display: flex;

`

class ImageDialog extends React.Component {

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render () {

    const {img, open} = this.props
    return (
      <div>
        <Dialog
          fullScreen={true}
          fullWidth
          maxWidth={false}
          open={open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogContent style={{ background: 'url(' + BgImage +') repeat 0 0 transparent' }}>
            <Content>
              {img ? <img src={img} alt={''}/> : <CircularProgress color="secondary" size={200} />}
            </Content>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

ImageDialog.propTypes = {
  file: PropTypes.any,
  img: PropTypes.any,
}

export default withMobileDialog()(ImageDialog)
