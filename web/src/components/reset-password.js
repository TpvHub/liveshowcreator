import React from 'react'
import styled from 'styled-components'
import Layout from '../layout'
import ResetPasswordForm from './form/reset-password-form'
import { Card, CardContent, Snackbar, Typography } from '@material-ui/core'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import _ from 'lodash'
import qs from 'qs'
import { history } from '../hostory'
import { getCurrentUser } from '../redux/selectors'
import { loginWithToken } from '../redux/actions'

const Container = styled.div`
    margin-top: 30px;
`

class ResetPassword extends React.Component {

    constructor(props) {
        super(props)

        this.handleClose = this.handleClose.bind(this)

        this.state = {
            token: null,
            error: null
        }
    }

    componentWillMount() {
        const { currentUser } = this.props
        if (_.get(currentUser, '_id')) {
            // user is already logged in
            history.push('/')
        }

    }

    handleClose() {
        this.setState({
            error: null
        })
    }

    componentDidMount() {

        const search = _.get(this.props, 'location.search', '')

        const query = qs.parse(search, { ignoreQueryPrefix: true })

        const token = _.get(query, 'token', null)


        if (token) {
            this.setState({
                token: token
            }, () => {

                this.props.loginWithToken(token).then(() => {

                    history.push('/')

                }).catch(e => {
                    this.setState({
                        token: null,
                        error: 'Login error'
                    })
                })
            })
        }

    }

    render() {
        const { token, error } = this.state

        return (
            <Layout useDrawer={false}>
                <Container>
                    <div className={'row'}>
                        <div className={'col-sm-4 offset-sm-4'}>
                            <Card>
                                <CardContent>
                                    <h2>{token ? 'Please wait...' : 'Reset password...'}</h2>
                                    {
                                        !this.state.token && (
                                            <ResetPasswordForm
                                                jwt_token={_.get(this.props, "match.params.jwt_token", "")}
                                                onSuccess={() => {
                                                    history.push('/login')
                                                }}
                                            />
                                        )
                                    }
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <Snackbar
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        open={!!error}
                        autoHideDuration={6000}
                        onClose={this.handleClose}
                        ContentProps={{
                            'aria-describedby': 'message-id',
                        }}
                        message={<Typography id="message-id" color={'secondary'}>{error}</Typography>}
                    />
                </Container>
            </Layout>
        )
    }
}

const mapStateToProps = (state) => ({
    currentUser: getCurrentUser(state)
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
    loginWithToken
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ResetPassword)
