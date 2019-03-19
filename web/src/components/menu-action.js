import React from 'react'
import styled from 'styled-components'
import {IconButton, Menu, MenuItem} from '@material-ui/core'
import {MoreVert} from '@material-ui/icons'

const Container = styled.div `
  button{
    width: ${props => props.size === 'small' ? '24px': '48px;'}
    height: ${props => props.size === 'small' ? '24px': '48px;'}
  }
`

class MenuAction extends React.Component {

  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleOpen = this.handleOpen.bind(this)

    this.state = {
      anchorEl: null,
      open: false
    }
  }

  handleOpen (e) {
    if (this.props) {
      this.setState({
        anchorEl: e.currentTarget,
        open: true
      })
    }
  }

  handleClose () {

    this.setState({
      open: false,
      anchorEl: null,
    }, () => {
      if (this.props.onClose) {
        this.props.onClose()
      }
    })

  }

  handleSelect (option) {
    this.setState({
      open: false,
      anchorEl: null
    }, () => {
      if (this.props.onSelect) {
        this.props.onSelect(option)
      }
    })

  }

  render () {

    const {anchorEl, open} = this.state
    const {options,size} = this.props

    return (
      <Container size={size} className={'menu-action'}>
        <IconButton
          size={'small'}
          aria-label="More"
          aria-owns={anchorEl ? 'long-menu' : null}
          aria-haspopup="true"
          onClick={this.handleOpen}
        >
          <MoreVert size={'small'}/>
        </IconButton>
        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={this.handleClose}
        >
          {options.map((option, index) => (
            <MenuItem
              key={'MenuItem'+option.label}
              onClick={() => this.handleSelect(option)}>
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      </Container>
    )
  }
}

export default MenuAction