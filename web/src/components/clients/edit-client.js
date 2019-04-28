import React from 'react'
import Layout from '../../layout'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import ClientForm from '../form/client-form'
import { Card, CardContent } from '@material-ui/core'
import {
  // getCurrentUser,
  getClientById
} from '../../redux/selectors'
import { getClient } from '../../redux/actions'
import _ from 'lodash'

const Container = styled.div `
  padding: 15px 0;
 @media (min-width: 992px){
    padding: 30px 0;
 }
 font-family: 'Roboto', sans-serif;
`

class EditUser extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    const id = _.get(this.props, 'match.params.clientId')
    if (id) {
      this.props.getClient(id)
    }
  }

  render () {
    const {client, currentClient} = this.props

    return (
      <Layout>
        <Container>
          <Card>
            <CardContent>
              <h2>{_.get(client, '_id') === _.get(currentClient, '_id')
                ? 'Update Your Client Profile'
                : 'Edit Client'}</h2>
              {client && (<ClientForm editMode={true} model={client}/>)}
            </CardContent>
          </Card>

        </Container>
      </Layout>
    )
  }
}

const mapStateToProps = (state, props) => ({
  client: getClientById(state, props),
  currentClient: getClientById(state),
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  getClient,
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EditUser)
