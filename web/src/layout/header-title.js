import React from 'react'
import { Typography } from '@material-ui/core'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

class HeaderTitle extends React.Component {

  render () {
    const {title} = this.props
    return (
      <Typography style={{flex: 1}} variant="title" color="inherit">
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