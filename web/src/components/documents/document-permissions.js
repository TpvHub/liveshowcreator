import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getDocumentPermissions } from '../../redux/actions'
import { AccountCircle } from '@material-ui/icons'
import { Icon } from '@material-ui/core'
import _ from 'lodash'
import ShareSelectOptions from './share-select-options'

const Container = styled.div `
  padding: 10px 0;
`

const Title = styled.div `
  font-size: 13px;
  
`

const List = styled.div `

`

const ListItem = styled.div `
  color: rgba(0,0,0,0.87);
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 3px;
  border-bottom: 1px solid #ebebeb;
  .user-name{
    flex-grow: 1;
    padding: 0 3px;
   }
  .user-avatar{
    padding: 0;
    height: 24px;
    width: 24px;
    img{
      max-width: 100%;
    }
  }
  .find-user-remove{
    min-width: 30px;
  }
  opacity: ${props => props.removed ? 0.25 : 1}
`

class DocumentPermissions extends React.Component {
  constructor (props) {
    super(props)

    this.handleChangeAccessType = this.handleChangeAccessType.bind(this)
    this.handleRemove = this.handleRemove.bind(this)

    this.state = {
      permissions: [],
    }

  }

  componentDidMount () {

    this.props.getDocumentPermissions(this.props.docId).then((data) => {

      this.setState({
        permissions: data,
      })
    })
  }

  onChange () {
    if (this.props.onChange) {
      this.props.onChange(this.state.permissions)
    }
  }

  handleChangeAccessType (index, type) {
    let {permissions} = this.state

    let perm = permissions[index]

    if (perm.type === null) {
      return
    }

    perm.type = type
    permissions[index] = perm

    this.setState({
      permissions: permissions,
    }, () => this.onChange())
  }

  handleRemove (index) {
    let {permissions} = this.state

    let perm = permissions[index]
    perm.type = null
    permissions[index] = perm

    this.setState({
      permissions: permissions,
    }, () => this.onChange())
  }

  render () {
    const {permissions} = this.state
    return (permissions.length ? <Container>
      <Title>Who has access</Title>
      <List>
        {
          permissions.map((perm, index) => {

            const user = _.get(perm, 'user')
            const firstName = _.get(user, 'firstName', '')
            const lastName = _.get(user, 'lastName', '')
            const avatar = _.get(user, 'avatar', null)
            const accessType = _.get(perm, 'type')

            return (
              <ListItem removed={accessType === null} key={firstName+index}
                        className={'shared-user-list'}>
                <div className={'user-avatar'}>
                  {avatar ? <img src={avatar} alt={`${firstName}`}/> :
                    <AccountCircle/>}
                </div>
                <div className={'user-name'}>
                  {
                    `${firstName} ${lastName}`
                  }
                </div>
                <div className={'access-type'}>
                  <ShareSelectOptions
                    disabled={accessType === null}
                    onChange={(option) => this.handleChangeAccessType(index,
                      option)}
                    selected={accessType}
                  />
                </div>
                <div className={'find-user-remove'}
                     onClick={() => this.handleRemove(index)}>
                  {accessType !== null && <Icon>close</Icon>}
                </div>


              </ListItem>)
          })
        }
      </List>
    </Container> : null)
  }
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getDocumentPermissions,
}, dispatch)
export default connect(mapStateToProps, mapDispatchToProps)(DocumentPermissions)