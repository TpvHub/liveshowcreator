import React from 'react'
import PropTypes from 'prop-types'
import { withStyles, LinearProgress } from '@material-ui/core'
import styled from 'styled-components'

const Label = styled.div `
  font-size: 12px;
  
`

const styles = {
  root: {
    flexGrow: 1,
  },
}

class UploadProgress extends React.Component {

  render () {
    const {classes, label, completed} = this.props
    return (
      <div className={classes.root}>
        {label && (<Label>{label}</Label>)}
        <LinearProgress variant="determinate" value={completed ? completed : 2}/>
        <br/>
      </div>
    )
  }
}

UploadProgress.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string,
  completed: PropTypes.any
}

export default withStyles(styles)(UploadProgress)