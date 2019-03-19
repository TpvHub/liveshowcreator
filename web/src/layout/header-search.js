import React from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import { Search, Close } from '@material-ui/icons'

const Container = styled.div `
  flex-grow: 1;
  input{
    flex-grow: 1;
    font-size: 16px;
    color: #333;
    background: transparent;
    border-radius: 5px;
    height: 46px;
    outline: none;
    padding: 11px 16px 11px 16px;
    border: 0 none;
    outline: 0;
    max-width: 720px;
    &:hover,&:focus,&:active{
      outline: 0 none;
    }
    @media(min-width: 992px){
      width: 400px;
    } 
  }

`

const Form = styled.form `
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(0,0,0,0);
  transition: background 100ms ease-in,width 100ms ease-out;
  max-width: 720px;
  display: flex;
  flex-direction: row;
  padding: 0 10px;
`

const Button = styled.button `
  cursor: pointer;
  margin: 0;
  padding: 0;
  border: 0 none;
  outline: 0 none;
  background: transparent;
  font-size: 20px;
  &:hover,&:focus,&:active{
     outline: 0 none;
  }
  height: 46px;

`

export default class HeaderSearch extends React.Component {

  state = {
    value: ''
  }

  onSearch = _.debounce(this._onSearch, 200)

  _onSearch (value) {

    if (this.props.onSearch) {
      this.props.onSearch(value)
    }
  }

  _onChange = (event) => {

    const value = event.target.value
    this.setState({
      value: value,
    }, this.onSearch(value))
  }

  _onSubmit (e) {
    e.preventDefault()
    this._onSearch(this.state.value)
  }

  render () {

    return (
      <Container
        className={'header-search-container'}>
        <Form onSubmit={this._onSubmit}>
          <Button type={'submit'}>
            <Search style={{color: '#333'}}/>
          </Button>
          <input
            placeholder={'Search...'} 
            value={this.state.value}
            onChange={this._onChange}/>
          {this.state.value &&
          (
            <Button onClick={() => {
              this.setState({
                value: ''
              }, () => {
                this._onSearch('')
              })
            }}>
              <Close style={{color: '#333'}}/>
            </Button>
          )
          }
        </Form>
      </Container>
    )
  }
}