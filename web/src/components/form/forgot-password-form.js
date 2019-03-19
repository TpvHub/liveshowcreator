import React from 'react'
import PropTypes from 'prop-types'
import { TextField, Button } from '@material-ui/core'
import { isEmail } from '../../helper/validation'
import _ from 'lodash'
import { Link } from "react-router-dom"

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { forgotPassword } from '../../redux/actions'
import styled from 'styled-components'

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

const SuccessMessage = styled.p`
  color: #28a745!important;
  display: ${({ status }) => status ? "block" : "none"}
`

const ForgotPasswordLink = styled.div`
  text-align: right;
`

class ForgotPasswordForm extends React.Component {

  constructor(props) {
    super(props)

    this._onChange = this._onChange.bind(this)
    this._onSubmit = this._onSubmit.bind(this)
    this._handleSubmit = this._handleSubmit.bind(this)

    this.state = {
      submitted: false,
      values: {
        email: '',
      },
      error: {
        email: false,
      },
      success: {
        status: false,
        message: "We have e-mailed your password reset link!"
      }
    }
  }

  _handleSubmit(user) {
    let { error } = this.state
    this.setState({
      submitted: true,
    }, () => {
      this.props.forgotPassword(user).then((data) => {
        this.setState({
          success: {
            ...this.state.success,
            status: true
          }
        })
      }).catch(err => {
        error['email'] = true
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
        this._handleSubmit(values)
      }
    })
  }

  render() {

    const { values, error, submitted } = this.state
    const { email } = values

    return (
      <form onSubmit={this._onSubmit} noValidate autoComplete={'off'}>
        <SuccessMessage status={this.state.success.status} >{this.state.success.message}</SuccessMessage>
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
        <FormActions className={'form-actions'}>
          <Button disabled={submitted} variant="raised" color={'primary'}
            type={'submit'}
            size="medium">
            Submit
          </Button>
        </FormActions>

        <ForgotPasswordLink>
          <Link to="/login">Already have an account?</Link>
        </ForgotPasswordLink>

      </form>
    )
  }
}

ForgotPasswordForm.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
}

const mapStateToProps = (state) => ({
  app: state.app,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  forgotPassword,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ForgotPasswordForm)
