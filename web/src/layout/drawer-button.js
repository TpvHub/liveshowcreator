import React from 'react'
import {Menu} from '@material-ui/icons'
import {IconButton} from '@material-ui/core'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleDrawer } from '../redux/actions'

class DrawerButton extends React.Component {

  constructor (props) {
    super(props)

    this.toggleSidebar = this.toggleSidebar.bind(this)
  }

  toggleSidebar () {
    const {drawer} = this.props
    this.props.toggleDrawer('left', !drawer.left)
  }

  render () {
    return (
      <IconButton onClick={this.toggleSidebar} color="inherit" aria-label="Menu">
        <Menu/>
      </IconButton>
    )
  }
}

const mapStateToProps = (state) => ({
  drawer: state.drawer
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleDrawer
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DrawerButton)