import React from 'react'
import Button from '@material-ui/core/Button'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Fade from '@material-ui/core/Fade'
import { Icon } from '@material-ui/core'
import styled from 'styled-components'

const IconContainer = styled.span `
  width: 20px;
  span{
    font-size: 15px;
  }
`

const Container = styled.div `

  .share-menu-button-options{
    border: 1px solid rgba(0, 0, 0, 0.08);
    padding: 5px;
    min-width: 50px;
  }
`

class ShareSelectOptions extends React.Component {
  state = {
    anchorEl: null,
  }

  handleClick = event => {
    if (this.props.disabled) {
      return
    }
    this.setState({anchorEl: event.currentTarget})
  }

  handleSelect = (option) => {
    if (this.props.onChange) {
      this.setState({
        anchorEl: null,
      }, () => {
        this.props.onChange(option)
      })

    }
  }

  handleClose = () => {
    this.setState({
      anchorEl: null,
    })
  }

  render () {
    const {anchorEl} = this.state
    const {selected} = this.props
    return (
      <Container>
        <Button
          className={'share-menu-button-options'}
          aria-owns={anchorEl ? 'fade-menu' : null}
          aria-haspopup="true"
          onClick={this.handleClick}
        >
          <Icon>{selected === 'write'
            ? 'edit'
            : 'remove_red_eye'}</Icon>
        </Button>
        <Menu
          id="fade-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
          TransitionComponent={Fade}
        >
          <MenuItem onClick={() => this.handleSelect('write')}><IconContainer
            className={'icon'}>{selected === 'write' ? (
            <Icon>check</Icon>) : null}</IconContainer> Can
            edit</MenuItem>
          <MenuItem onClick={() => this.handleSelect('read')}><IconContainer
            className={'icon'}>{selected === 'read' ? (
            <Icon>check</Icon>) : null}</IconContainer> Can view</MenuItem>
        </Menu>
      </Container>
    )
  }
}

export default ShareSelectOptions