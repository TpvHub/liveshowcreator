import React from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import { TextField, Button } from '@material-ui/core'
import { isEmail } from '../../helper/validation'
import { history } from '../../hostory'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createClient, updateClient } from '../../redux/actions'

const Container = styled.div`

  .form-actions {
    margin-top: 10px;
    button {
      margin: 5px;
      &:first-child{
        margin-left: 0;
      }
    }
  }
`

const ErrorMessage = styled.p`
  color: red;
`

class ClientForm extends React.Component {

  constructor(props) {
    super(props)

    this._onChange = this._onChange.bind(this)
    this._onSubmit = this._onSubmit.bind(this)
    this.validate = this.validate.bind(this)
    this.getFields = this.getFields.bind(this)

    this.state = {
      submitted: false,
      message: null,
      errorMessage: '',
      error: {},
      model: {
        firstName: '',
        lastName: '',
        teamName: '',
        phone: '',
        email: '',
        password: '',
        confirm: ''
      },
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First name',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Last name',
          required: true,
        },
        {
          name: 'teamName',
          type: 'text',
          label: "Team's name",
          required: true,
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Phone Number',
          required: true,
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          required: true,
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          required: !_.get(this.props, 'editMode', false),
        },
        {
          name: 'confirm',
          type: 'password',
          label: 'Confirm',
          required: !_.get(this.props, 'editMode', false),
        },
      ],
    }

    this.formatField = {
      firstName: 'firstName',
      lastName: 'lastName',
      teamName: 'teamName',
      phone: 'phone',
      email: 'email'
    }
  }

  componentDidMount() {

    const { editMode } = this.props

    if (editMode) {
      let model = this.props.model
      model.password = ''
      this.setState({
        model: model,
      })

    }
  }

  _onChange(e) {

    const name = e.target.name

    const value = e.target.value

    this.setState({
      ...this.state,
      model: {
        ...this.state.model,
        [name]: value,
        // [this.formatField[name] ? this.formatField[name] : 'stuff']: value
      },
    }, () => {
      this.validate(name)
    })

  }

  formatFormClient = (model = {}) => {
    const client = { ...model }
    delete client.confirm
    return client;

    // return Object.entries(model).map(([name, value]) => ({
    //   name,
    //   value
    // }))
  }

  _onSubmit(e) {
    e.preventDefault()
    const {
      editMode,
      // currentUser
    } = this.props
    const { model } = this.state


    this.validate([], (errors) => {

      if (!errors || errors.length === 0) {
        // let do form submit
        this.setState({
          submitted: true,
        }, () => {

          // const userRolesValues = _.get(currentUser, 'roles', [])

          if (!editMode) {
            this.props.createClient(
              this.formatFormClient(model)
            ).then(_ => {
              history.goBack()
            }).catch(error => {
              this.setState({
                errorMessage: error.error,
                error: error.errorsValidate,
                submitted: false
              })
            })
            
          } else {
            let dataUpdate = {};

            Object.values(this.formatField).forEach(key => {
              dataUpdate[key] = model[key];
            })

            this.props.updateClient({
              ...dataUpdate,
              _id: model._id,
            }).then(() => {
              history.push('/clients')
            }).catch(error => {
              this.setState({ errorMessage: error.error, error: error.errorsValidate, submitted: false })
            })
          }

        })

      }
    })

  }

  getFields(names = []) {

    let items = []

    if (!names || names.length === 0) {
      return this.state.fields
    }
    _.each(names, (name) => {
      let item = this.state.fields.find((f) => f.name === name)
      if (item) {
        items.push(item)
      }
    })

    return items
  }

  validate(fieldNames = [], cb = () => {
  }) {
    let { model, error } = this.state

    let errors = []

    let errorMessage = ''

    if (!Array.isArray(fieldNames) && fieldNames !== null) {
      fieldNames = [fieldNames]
    }

    let fieldItems = this.getFields(fieldNames)

    if (fieldNames.length === 0) {
      fieldItems = this.getFields(null)
    }
    _.each(fieldItems, (settings) => {

      const isRequired = _.get(settings, 'required', false)
      const emailField = _.get(settings, 'type', '') === 'email'
      const confirmField = _.get(settings, 'name', '') === 'confirm'

      const name = _.get(settings, 'name')
      const label = _.get(settings, 'label', name)
      const value = _.get(model, name)

      _.unset(error, name)
      if (isRequired && !value) {
        errorMessage = `${label} is required`
        error = _.setWith(error, name, true)
        errors.push(errorMessage)
      }

      if (emailField && !isEmail(value)) {
        errorMessage = `${label} must email address`
        error = _.setWith(error, name, true)
        errors.push(errorMessage)
      }

      if (confirmField && !this.isPasswordMatch()) {
        errorMessage = `${label} does not match`
        error = _.setWith(error, name, true)
        errors.push(errorMessage)
      }
    })

    this.setState({
      error: error,
    }, () => {
      return cb(errors)
    })
  }

  isPasswordMatch = () => {
    const { confirm, password } = this.state.model

    return confirm === password
  }

  getFieldsUpdate = (editMode) => field => {
    if (editMode) {
      if (this.formatField[field.name]) return true;
      return false;
    }
    return true;
  }

  render() {
    const { editMode } = this.props
    const { model, submitted, error } = this.state

    return (<Container>
      <form onSubmit={this._onSubmit} noValidate autoComplete={'off'}>
        <ErrorMessage>
          {this.state.errorMessage}
        </ErrorMessage>
        {this.state.fields.filter(this.getFieldsUpdate(editMode)).map((field, index) => {
          const name = _.get(field, 'name')
          return (
            <TextField
              key={'TextField' + index + name}
              name={name}
              error={_.get(error, name, false)}
              id={name}
              label={field.label}
              value={_.get(model, name, '')}
              margin="normal"
              fullWidth
              type={_.get(field, 'type', 'text')}
              onChange={this._onChange}
            />
          )
        })}
        <div className={'form-actions'}>
          <Button
            disabled={submitted}
            variant="raised" color={'primary'}
            type={'submit'}
            size="medium">
            {
              editMode ? 'Save' : 'Create'
            }
          </Button>
          <Button onClick={() => {
            history.push('/clients')
          }} disabled={submitted}
            type={'button'}
            size="medium">
            Cancel
          </Button>
        </div>
      </form>
    </Container>)
  }
}

const mapStateToProps = (state) => ({
  currentUser: state.app.currentUser
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  createClient,
  updateClient,
}, dispatch)
export default connect(mapStateToProps, mapDispatchToProps)(ClientForm)