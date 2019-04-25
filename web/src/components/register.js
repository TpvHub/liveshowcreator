import React from 'react'
import Layout from '../layout'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import ClientForm from './form/client-form'
import { Card, CardContent } from '@material-ui/core'

const Container = styled.div `
  padding: 15px 0;
 @media (min-width: 992px){
    padding: 30px 0;
 }
 font-family: 'Roboto', sans-serif;
`

class AddClient extends React.Component {
  render () {

    return (
      <Layout useDrawer={false}>
        <Container>
          <Card>
            <CardContent>
              <h2>Register a new Team</h2>
              <ClientForm/>
            </CardContent>
          </Card>

        </Container>
      </Layout>
    )
  }
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AddClient)
