import React from 'react'
import _ from 'lodash'

import Layout from '../../layout'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import UserForm from '../form/user-form'
import { Card, CardContent } from '@material-ui/core'

const Container = styled.div`
  padding: 15px 0;
 @media (min-width: 992px){
    padding: 30px 0;
 }
 font-family: 'Roboto', sans-serif;
`

class AddUser extends React.Component {

  // constructor (props) {
  //   super(props)
  // }

  get clientId() {
    const { currentUser } = this.props
    return currentUser.client ? currentUser.client._id : _.get(this.props.match.params, 'clientId', null)
  }

  render() {

    return (
      <Layout>
        <Container>
          <Card>
            <CardContent>
              <h2>Create user</h2>
              <UserForm
                clientId={this.clientId}
              />
            </CardContent>
          </Card>

        </Container>
      </Layout>
    )
  }
}

const mapStateToProps = (state) => ({
  currentUser: state.app.currentUser,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AddUser)
