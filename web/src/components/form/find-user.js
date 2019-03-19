import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { searchUsers } from '../../redux/actions'
import { AccountCircle } from '@material-ui/icons'
import { Icon, withStyles } from '@material-ui/core'
import _ from 'lodash'
import { Map } from 'immutable'
import { Manager, Target, Popper } from 'react-popper'
import classNames from 'classnames'
import PropTypes from 'prop-types'

const Container = styled.div `
  flex-grow: 1;
  margin-right: 5px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-bottom: 1px solid #cbcbcb;
  box-shadow: 0 1px 1px rgba(0,0,0,.1);
 
`
const SearchInner = styled.div `
  display: flex;
  flex-direction: row;
  align-items: center;
 
`
const List = styled.div `
  display: flex;
  flex-direction: row;
  
`

const ListItem = styled.div `
  margin: 4px 3px 5px 5px;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #e0e0e0;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  color: #444;
  .user-avatar{
    padding: 0;
    height: 24px;
    width: 24px;
    img{
      max-width: 100%;
    }
  }
  .find-user-remove{
    cursor: pointer;
    span{
      font-size: 13px;
    }
  }
 
`

const Input = styled.input`
    margin: 4px;
    vertical-align: middle;
    padding: 0 0 0 5px;
    font-size: 13px;
    height: 29px;
    background: none;
    border: 0 none;
    outline: 0;
    flex-grow: 1;
    &:active{
      outline: 0 none;
    }
`

const SearchList = styled.div `
  min-height: 150px;
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  background: #FFF;
  margin-top: 2px;
 
`
const SearchListItem = styled.div `
  padding: 3px;
  display: flex;
  flex-direction: row;
  align-items: center;
  &:hover{
    background: rgba(0, 0,0, 0.05);
  }
  .user-avatar{
    padding: 0;
    height: 24px;
    width: 24px;
    img{
      max-width: 100%;
    }
  }
`
const styles = theme => ({

  popperClose: {
    pointerEvents: 'none',
  },
})

class FindUser extends React.Component {
  constructor (props) {

    super(props)

    this.onInputChange = this.onInputChange.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.clearInput = this.clearInput.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.onSearch = _.debounce(this.startSearch, 200)

    this.state = {
      selected: new Map(),
      openDropList: false,
    }

  }

  startSearch (text) {
    if (text) {
      this.props.searchUsers(text, {limit: 10, skip: 0}).then(() => {
        this.setState({
          openDropList: true,
        })
      })
    } else {
      this.setState({
        openDropList: false,
      })
    }
  }

  onInputChange (e) {
    const value = e.target.value
    this.onSearch(value)
  }

  handleRemove (id) {
    this.setState({
      selected: this.state.selected.remove(id),
    }, () => {
      this.handleChange()
    })
  }

  handleSelect (user) {

    this.setState({
      selected: this.state.selected.set(user._id, user),
      openDropList: false,
    }, () => {
      this.handleChange()
      this.clearInput()

    })
  }

  clearInput () {
    if (this.inputRef) {
      this.inputRef.value = ''
    }
  }

  handleChange () {
    if (this.props.onChange) {
      let items = []

      this.state.selected.forEach((user) => {
        items.push(user)
      })

      this.props.onChange(items)
    }
  }

  render () {

    const {selected} = this.state
    const {users, classes} = this.props
    return (
      <Container className={'find-users'}>

        <SearchInner className={'search-inner'}>
          <List className={'selected-list'}>
            {
              selected.valueSeq().map((user, index) => {

                const firstName = _.get(user, 'firstName', '')
                const lastName = _.get(user, 'lastName', '')
                const avatar = _.get(user, 'avatar', null)

                return (
                  <ListItem key={'ListItem'+index+firstName+lastName} className={'find-user-list'}>
                    <div className={'user-avatar'}>
                      {avatar ? <img src={avatar} alt={`${firstName}`}/> :
                        <AccountCircle/>}
                    </div>
                    <div className={'user-name'}>
                      {
                        `${firstName} ${lastName}`
                      }
                    </div>
                    <div className={'find-user-remove'}
                         onClick={() => this.handleRemove(user._id)}>
                      <Icon>close</Icon>
                    </div>


                  </ListItem>)
              })
            }
          </List>

          <Manager>
            <Target>
              <Input
                innerRef={(ref) => this.inputRef = ref}
                onChange={this.onInputChange}
                placeholder={selected.size
                  ? 'Add more people...'
                  : 'Add names or email addresses...'}
                defaultValue={''} className={'find-user-input'}/>
            </Target>
            <Popper
              placement="bottom-start"
              eventsEnabled={this.state.openDropList}
              className={classNames('search-users-list-popper',
                {[classes.popperClose]: !this.state.openDropList})}
            >
              <div>
                {
                  this.state.openDropList && (
                    <SearchList className={'search-list'}>
                      {
                        users.map((user, index) => {

                          const firstName = _.get(user, 'firstName', '')
                          const lastName = _.get(user, 'lastName', '')
                          const avatar = _.get(user, 'avatar', null)

                          return (
                            <SearchListItem
                              onClick={() => {
                                this.handleSelect(user)
                              }}
                              key={'SearchListItem'+index+firstName+lastName}
                              className={'search-list-item'}>
                              <div className={'user-avatar'}>
                                {avatar ? <img src={avatar}
                                               alt={`${firstName}`}/> :
                                  <AccountCircle/>}
                              </div>
                              <div className={'user-name'}>
                                {
                                  `${firstName} ${lastName}`
                                }
                              </div>
                            </SearchListItem>)
                        })
                      }
                    </SearchList>
                  )
                }
              </div>
            </Popper>
          </Manager>


        </SearchInner>

      </Container>
    )
  }
}

FindUser.propTypes = {
  onChange: PropTypes.func,
}

const mapStateToProps = (state) => ({
  users: state.userSearch.valueSeq(),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  searchUsers,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(FindUser))
