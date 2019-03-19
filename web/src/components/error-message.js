import React from 'react'
import PropTypes from 'prop-types'
import { withStyles, Snackbar, IconButton, Typography } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import _ from 'lodash'


const styles = theme => ({
  close: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4,
  },
})

class ErrorMessage extends React.Component {

  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.handleError = this.handleError.bind(this)
    this.state = {
      open: false,
      message: '',
    }
  }

  handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    this.setState({open: false})
  }

  componentDidMount () {

    this.onError = this.props.error.addListener('onError', this.handleError)
  }

  componentWillUnmount () {

    this.onError.remove()
  }

  handleError (payload) {

    console.log('On Error with payload', payload)

    const message = _.get(payload, '[0].message', 'Something went wrong.')

    this.setState({
      open: true,
      message: message
    })
  }

  render () {
    const {message} = this.state
    const {classes} = this.props
    return (
      <div>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.state.open}
          autoHideDuration={4000}
          onClose={this.handleClose}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<Typography color={'secondary'} id="message-id">{message}</Typography>}
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

ErrorMessage.propTypes = {
  classes: PropTypes.object.isRequired,
}

const componentStyle = withStyles(styles)(ErrorMessage)

const mapStateToProps = (state) => ({
  error: state.error,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)
export default connect(mapStateToProps, mapDispatchToProps)(componentStyle)