import React, { Fragment } from 'react'
import Header from './header'
import Drawer from './drawer'
import styled from 'styled-components'
import { version } from '../config'
import PropTypes from 'prop-types'

const Container = styled.div `
  padding-top: 64px;
`

const Footer = styled.div `
  text-align: center;
  color: rgba(0, 0, 0, 0.7);
  p{
    margin: 0;
    padding: 0;
  }
`

class Layout extends React.Component {

  constructor (props) {

    super(props)

    this.onResize = this.onResize.bind(this)
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
    return window.innerHeight - 70
  }

  render () {
    const {useHeader, useDrawer, fullWidth, useSearch} = this.props

    return (
      <Fragment>
        {useDrawer && (<Drawer/>)}
        {useHeader && (
          <Header
            onSearch={(s) => {
              if (this.props.onSearch) {
                this.props.onSearch(s)
              }
            }}
            useSearch={useSearch}
            useDrawer={useDrawer}/>)}
        <Container style={{minHeight: this.calculateContainerHeight()}} innerRef={ref => this.ref = ref}
                   className={fullWidth ? 'container-fluid' : 'container'}>
          {this.props.children}
        </Container>
        <Footer>
          <p className={'app-version'}>TpvHub Creator v.{version}</p>
        </Footer>
      </Fragment>
    )

  }
}

Layout.defaultProps = {
  useHeader: true,
  useDrawer: true,
  fullWidth: false,
  useSearch: false
}
Layout.propTypes = {
  useHeader: PropTypes.bool,
  useDrawer: PropTypes.bool,
  fullWidth: PropTypes.bool,
  useSearch: PropTypes.bool,
  onSearch: PropTypes.func,
}
export default Layout