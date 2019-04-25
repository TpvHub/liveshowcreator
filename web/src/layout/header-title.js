import React from 'react'
import { Typography } from '@material-ui/core'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { history } from '../hostory'

class HeaderTitle extends React.Component {

  onClickTitle = () => {
    history.push('/')
  }

  render () {
    const {title} = this.props
    return (
      <Typography onClick={this.onClickTitle} style={{flex: 1, cursor: "pointer" }} variant="title" color="inherit">
        {title}
      </Typography>
    )
  }
}

const mapStateToProps = (state) => ({
  title: state.app.headerTitle,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(HeaderTitle)