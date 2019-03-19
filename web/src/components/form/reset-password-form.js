import React from 'react'
import PropTypes from 'prop-types'
import { TextField, Button } from '@material-ui/core'
import { isEmail } from '../../helper/validation'
import _ from 'lodash'
import { Link } from "react-router-dom"

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  resetPassword,
} from '../../redux/actions'
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
  color: #28a745 !important;
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
        new_password: '',
        confirm: '',
      },
      error: {
        new_password: false,
        confirm: false,
      },
      success: {
        status: false,
        time_down: 5, 
        message: "Reset password successful!"
      },
      // jwt_token: this.props.history
    }
  }

  countDown = seconds => {
    if (seconds < 0) {
      this.props.onSuccess();
    } else {
      this.setState({
        success: {
          ...this.state.success,
          time_down: seconds
        }
      }, () => {
        setTimeout(() => {
          this.countDown(seconds - 1);
        }, 1000);
      })

    }
  }

  _handleSubmit(data) {
    let { error } = this.state
    this.setState({
      submitted: true,
    }, () => {
      this.props.resetPassword({
        ...data,
        jwt_token: this.props.jwt_token,
      }).then((_) => {
        this.setState({
          success: {
            ...this.state.success,
            status: true
          }
        }, () => {
          this.countDown(5);
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
      new_password: {
        func: (value) => {
          return value ? true : false
        },
      },
      confirm: {
        func: (value) => {
          return values.new_password === value ? true : false
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
    const { new_password, confirm } = values

    return (
      <form onSubmit={this._onSubmit} noValidate autoComplete={'off'}>
        <SuccessMessage status={this.state.success.status} >
          {this.state.success.message}
          <p>Redirect to login in {this.state.success.time_down}(s) ...</p>
        </SuccessMessage>
        <TextField
          name={'new_password'}
          error={_.get(error, 'new_password', false)}
          id="new_password"
          label="New password"
          value={new_password}
          margin="normal"
          fullWidth
          type={'password'}
          onChange={this._onChange}
        />

        <TextField
          name={'confirm'}
          error={_.get(error, 'confirm', false)}
          id="confirm"
          label="Confirm password"
          value={confirm}
          margin="normal"
          fullWidth
          type={'password'}
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
  resetPassword
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ForgotPasswordForm)
