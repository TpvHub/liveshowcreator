import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'

const Container = styled.div `
  display: flex;
  position: absolute;
  top: ${props => props.printLayout ? '0' : '100px'};
  bottom: 0;
  left: 0;
  right: 0;

`

class EditorContainer extends React.Component {

  render () {

    return (
      <Container printLayout={this.props.printLayout}>
        {this.props.children}
      </Container>
    )
  }
}

const mapStateToProps = (state, props) => ({
  printLayout: state.layout.printLayout,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(EditorContainer)
