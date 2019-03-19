import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { searchGfx } from '../../redux/actions'

const Container = styled.div `

  width: 100%;
  margin: 5px 0 10px 0;
  padding: 0 10px;
  input{
      border: 1px solid #FFF;
      padding: 3px 8px;
      width: 100%;
      background: #FFF;
  }

  
`

class GfxSearch extends React.Component {

  constructor (props) {
    super(props)

    this.onChange = this.onChange.bind(this)

    this.state = {
      search: ''
    }
  }

  onChange (e) {

    const value = e.target.value

    this.setState({
      search: value
    }, () => {
      if (this.props.onSearch) {
        this.props.onSearch(value)
      }
      this.props.searchGfx(value)
    })

  }

  componentDidMount () {
    const {value} = this.props
    // reset gfx search
    this.setState({
      search: value,
    }, () => {
      this.props.searchGfx(value)
    })

  }

  render () {
    const {showInactiveList} = this.props
    return (
      <Container className={'gfx-search-container'}>
        <input
          id={'gfx-search-input'}
          value={this.state.search}
          onChange={this.onChange}
          placeholder={showInactiveList ? 'Search inactive...' : 'Search for user, status, or title...'}
          name={'gfx-search'}/>
      </Container>
    )
  }
}

const mapStateToProps = (state) => ({
  showInactiveList: state.sidebar.showInactiveList
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  searchGfx
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(GfxSearch)