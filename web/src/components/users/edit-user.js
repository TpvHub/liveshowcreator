import React from 'react'
import Layout from '../../layout'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import UserForm from '../form/user-form'
import { Card, CardContent } from '@material-ui/core'
import { getCurrentUser, getUserById } from '../../redux/selectors'
import { getUser } from '../../redux/actions'
import _ from 'lodash'

const Container = styled.div `
  padding: 15px 0;
 @media (min-width: 992px){
    padding: 30px 0;
 }
 font-family: 'Roboto', sans-serif;
`

class EditUser extends React.Component {

  // constructor (props) {
  //   super(props)
  // }

  componentWillMount () {
    const id = _.get(this.props, 'match.params.id')
    if (id) {
      this.props.getUser(id)
    }

  }

  render () {
    const {user, currentUser} = this.props

    return (
      <Layout>
        <Container>
          <Card>
            <CardContent>
              <h2>{_.get(user, '_id') === _.get(currentUser, '_id')
                ? 'Update Your Profile'
                : 'Edit User'}</h2>
              {user && (<UserForm editMode={true} model={user}/>)}
            </CardContent>
          </Card>

        </Container>
      </Layout>
    )
  }
}

const mapStateToProps = (state, props) => ({
  user: getUserById(state, props),
  currentUser: getCurrentUser(state),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getUser,
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EditUser)
