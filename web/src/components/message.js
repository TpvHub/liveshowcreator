import React from 'react'
import PropTypes from 'prop-types'
import { withStyles, Snackbar, IconButton, Typography } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { showMessage } from '../redux/actions'
import _ from 'lodash'

const styles = theme => ({
  close: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4,
  },
})

class Message extends React.Component {

  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)

    this.state = {
      open: false,
      message: '',
    }
  }

  handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    // Handle onClose
    const {message} = this.props
    if (message !== null && message.onClose) message.onClose();
    this.props.showMessage(null)
  }

  componentDidMount () {

  }

  render () {
    const {classes, message} = this.props
    const isOpen = !!message
    const { isRawBody = false } = message || {}

    return (
      <div>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={isOpen}
          autoHideDuration={_.get(message, 'duration', 4000)}
          onClose={this.handleClose}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={isRawBody ? _.get(message, 'body') : <Typography color={'primary'} id="message-id">{_.get(message, 'body')}</Typography>}
          action={[
            null,
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              className={classes.close}
              onClick={this.handleClose}
            >
              <Close/>
            </IconButton>,
          ]}
        />
      </div>
    )
  }
}

Message.propTypes = {
  classes: PropTypes.object.isRequired,
}

const componentStyle = withStyles(styles)(Message)

const mapStateToProps = (state) => ({
  message: state.message,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  showMessage
}, dispatch)
export default connect(mapStateToProps, mapDispatchToProps)(componentStyle)