import React from 'react'
import PropTypes from 'prop-types'
import { TextField, Button, Typography } from '@material-ui/core'
import { isEmail } from '../../helper/validation'
import _ from 'lodash'
import { Link } from "react-router-dom"

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { login } from '../../redux/actions'
import { config } from '../../config'
import styled from 'styled-components'
import googleIcon from '../../assets/images/google.png'

const FormActions = styled.div`
  margin-top: 10px;
  button{
    display: block;
    margin: 8px 0;
    width: 100%;
  }
  .login-optional-or{
    display: block;
    width: 100%;
    text-align: center;
  }
  a{
    text-decoration: none;
  }
  img.google-icon{
    vertical-align: middle;
  }
 
`

const ForgotPasswordLink = styled.div`
  text-align: right;
`

class LoginForm extends React.Component {

  constructor(props) {
    super(props)

    this._onChange = this._onChange.bind(this)
    this._onSubmit = this._onSubmit.bind(this)
    this._login = this._login.bind(this)

    this.state = {
      submitted: false,
      values: {
        email: '',
        password: '',
      },
      error: {
        email: false,
        password: false,
      },
    }
  }

  _login(user) {
    let { error } = this.state
    this.setState({
      submitted: true,
    }, () => {
      this.props.login(user).then((data) => {

        if (this.props.onSuccess) {
          this.props.onSuccess(data)
        }
      }).catch(err => {

        if (err.match(/Email/)) {
          error['email'] = true
        }
        else if (err.match(/Password/)) {
          error['password'] = true
        } else {
          error['email'] = true
        }
        this.setState({
          error: error,
          submitted: false,
        }, () => {

          if (this.props.onError) {
            this.props.onError(err)
          }
        })
      })

    })

  }

  _onChange(e) {
    const value = e.target.value
    const name = e.target.name

    this.setState({
      ...this.state,
      values: {
        ...this.state.values,
        [name]: value,
      },
    }, () => this.validate(name))
  }

  validate(name = null, cb = () => { }) {
    const { values } = this.state
    let error = this.state.error
    let isValid = true

    const fields = {
      email: {
        func: (value) => {
          return isEmail(value)
        },

      },
      password: {
        func: (value) => {
          return value !== ''
        },
      },
    }

    let validation = name === null ? fields : {
      [name]: _.get(fields, name),
    }

    _.each(validation, (f, k) => {
      error[k] = false
      if (!f.func(values[k])) {
        error[k] = true
        isValid = false
      }
    })

    this.setState({
      error: error,
    }, () => cb(isValid))

  }

  _onSubmit(e) {
    const { values } = this.state
    e.preventDefault()

    this.validate(null, (valid) => {
      if (valid) {
        this._login(values)
      }
    })

  }

  render() {

    const { values, error, submitted } = this.state
    const { email, password } = values

    return (
      <form onSubmit={this._onSubmit} noValidate autoComplete={'off'}>
        <TextField
          name={'email'}
          error={_.get(error, 'email', false)}
          id="email"
          label="Email"
          value={email}
          margin="normal"
          fullWidth
          type={'email'}
          onChange={this._onChange}
        />
        <TextField
          error={_.get(error, 'password', false)}
          name={'password'}
          id="password-input"
          label="Password"
          type="password"
          autoComplete="current-password"
          margin="normal"
          fullWidth
          value={password}
          onChange={this._onChange}
        />
        <FormActions className={'form-actions'}>
          <Button disabled={submitted} variant="raised" color={'primary'}
            type={'submit'}
            size="medium">
            Login
          </Button>
          <Typography className={'login-optional-or'}>Or</Typography>
          {/* <a href={`${config.url}/auth/google`}> */}
          <a href={`/register`}>
            <Button
              variant="raised"
              type={'button'}
              size="medium">
              <img className={'google-icon'} src={googleIcon} alt={''} /> Sign In
              With Google
            </Button>
          </a>
        </FormActions>

        <ForgotPasswordLink>
          <Link to="/forgot-password">Forgot password?</Link>
        </ForgotPasswordLink>

      </form>
    )
  }
}

LoginForm.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
}

const mapStateToProps = (state) => ({
  app: state.app,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  login,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(LoginForm)
