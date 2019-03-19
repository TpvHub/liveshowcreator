import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import classnames from 'classnames'

import { editorWidth } from '../../config'

const Editor = styled.div`
    height: 100%;
    position: relative;
    width: ${editorWidth}px;
    padding: 20px;
    margin: 0 auto !important;

    &.printLayout {
      margin-left: auto !important;
      margin-right: auto !important;
    }

    .ql-editor{
        height: auto !important;
        overflow: hidden;
        background: #FFF;
        padding: 40px 40px 40px 60px;

        & > p,
        & > h2 {
          position: relative;
          z-index: 1;
        }
    }

`

class EditorArea extends React.Component {

  render () {

    const { printLayout, isNavOpen, navigationWidth } = this.props

    let extraClass = printLayout ? 'printLayout' : ''

    if (isNavOpen) extraClass += ' openNavigation'

    return (
      <Editor
        id={this.props.id}
        className={classnames(this.props.className, extraClass)}
        navigationWidth={navigationWidth}
      />
    )
  }
}

const mapStateToProps = (state, props) => ({
  printLayout: state.layout.printLayout,
  isNavOpen: state.docNavigation.open,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(EditorArea)
