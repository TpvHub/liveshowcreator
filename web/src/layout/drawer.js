import React from 'react'
import { Drawer } from '@material-ui/core'
import Sidebar from './sidebar'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleDrawer } from '../redux/actions'

class AppDrawer extends React.Component {

  constructor (props) {
    super(props)

    this.toggleDrawer = this.toggleDrawer.bind(this)
  }

  toggleDrawer (side, open) {
    this.props.toggleDrawer(side, open)
  }

  render () {

    const {drawer} = this.props

    return (
      <Drawer
        open={drawer.left}
        onClose={() => this.toggleDrawer('left', false)}
      >
        <div
          tabIndex={0}
          role="button"
          onClick={() => this.toggleDrawer('left', false)}
          onKeyDown={() => this.toggleDrawer('left', false)}
        >
          <Sidebar/>
        </div>
      </Drawer>
    )
  }
}

const mapStateToProps = (state) => ({
  drawer: state.drawer
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleDrawer
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(AppDrawer)