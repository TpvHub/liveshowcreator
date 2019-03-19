import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import styled from 'styled-components'
import {
  Slide,
  withStyles,
  IconButton,
  Dialog,
  AppBar,
  Toolbar,
  Typography
} from '@material-ui/core'
import { Close, ZoomIn, ZoomOut } from '@material-ui/icons'

const Container = styled.div `
  width: 100%;
  background: #000;
  overflow: auto;
  .document-prompter-view{
    font-size: ${props => props.fontSize}px;
    max-width: 960px;
    margin: 0 auto;
    color: #FFF;
    span.livex-quill-gfx, span.livex-quill-comment{
      color: #FFF;
      background: none;
    }
    p, a, i, strong, pre{
      color: #FFF;
      background: none;
      text-decoration: none;
      font-weight: normal;
      font-style: normal;
      white-space: normal;
    }
  }
 
`

const styles = {
  toolbar: {
    minHeight: 48,
  },
  flex: {
    flex: 1,
  },
  dialog: {
    background: '#000000',
  }
}

function Transition (props) {
  return <Slide direction="up" {...props} />
}

const fontSizeMin = 13

class DocumentPrompter extends React.Component {

  constructor (props) {

    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.zoomIn = this.zoomIn.bind(this)
    this.zoomOut = this.zoomOut.bind(this)
    this.onResize = this.onResize.bind(this)

    this.state = {
      font: fontSizeMin
    }

  }

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose(true)
    }
  }

  zoomIn () {
    this.setState({
      font: this.state.font + 2
    })
  }

  zoomOut () {

    const {font} = this.state

    const newFont = font - 2

    this.setState({
      font: newFont >= fontSizeMin ? newFont : fontSizeMin
    })
  }

  componentDidMount () {

    window.addEventListener('resize', this.onResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.onResize)
  }

  onResize () {

    if (this.ref) {
      this.ref.style = `min-height: ${this.calculateContainerHeight()}px`
    }
  }

  calculateContainerHeight () {
    return window.innerHeight - 48
  }

  render () {
    const {classes, open, doc} = this.props
    return (
      <div>
        <Dialog
          className={'document-prompter-dialog'}
          fullScreen
          open={open}
          onClose={this.handleClose}
          TransitionComponent={Transition}
        >
          <AppBar className={'document-prompter-app-bar'} position={'sticky'}>
            <Toolbar className={classes.toolbar}>
              <IconButton color="inherit" onClick={this.handleClose} aria-label="Close">
                <Close/>
              </IconButton>
              <Typography variant="title" color="inherit" className={classes.flex}>
                {_.get(doc, 'title', '')}
              </Typography>

              <IconButton color="inherit" onClick={this.zoomOut} aria-label="Zoom Out">
                <ZoomOut/>
              </IconButton>

              <IconButton color="inherit" onClick={this.zoomIn} aria-label="Zoom In">
                <ZoomIn/>
              </IconButton>


            </Toolbar>
          </AppBar>
          <Container style={{minHeight: this.calculateContainerHeight()}} innerRef={(ref) => this.ref = ref}
                     fontSize={this.state.font} className={'document-prompter-container'}>
            <div className={'document-prompter-view'} dangerouslySetInnerHTML={{__html: _.get(doc, 'body')}}/>
          </Container>
        </Dialog>
      </div>
    )
  }
}

DocumentPrompter.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  doc: PropTypes.any,
}
export default withStyles(styles)(DocumentPrompter)


