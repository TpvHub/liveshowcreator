import React from 'react'
import PropTypes from 'prop-types'
import { withStyles, CircularProgress, Button, Fade } from '@material-ui/core'

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    margin: theme.spacing.unit * 2,
  },
  placeholder: {
    height: 40,
  },
})

class LoadMore extends React.Component {

  render () {
    const {classes, loading, hideButton, count, maxCount} = this.props

    const isHideButton = loading || hideButton || maxCount <= count

    return (
      <div className={classes.root}>
        <div className={classes.placeholder}>
          <Fade
            in={loading}
            style={{
              transitionDelay: loading ? '800ms' : '0ms',
            }}
            unmountOnExit
          >
            <CircularProgress/>
          </Fade>
          {!isHideButton && (
            <Button onClick={() => {
              if (this.props.onLoad) {
                this.props.onLoad(true)
              }
            }} type={'button'}>Load more...</Button>
          )}
        </div>
      </div>
    )
  }

}

LoadMore.propTypes = {
  classes: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  hideButton: PropTypes.bool,
  onLoad: PropTypes.func,
  count: PropTypes.number,
  maxCount: PropTypes.number
}

export default withStyles(styles)(LoadMore)