import React from 'react'
import { MentionsInput, Mention } from 'react-mentions'
import styled from 'styled-components'
import _ from 'lodash'
import { FormLabel } from '@material-ui/core'

const Container = styled.div `

  margin: 8px 0 0 0;
`

const defaultMentionStyle = {
  backgroundColor: '#cee4e5',
}

const defaultStyle = {
  control: {
    backgroundColor: '#fff',

    fontSize: 12,
    fontWeight: 'normal',
  },

  highlighter: {
    overflow: 'hidden',
  },

  input: {
    margin: 0,
  },

  '&singleLine': {
    control: {
      display: 'inline-block',

      width: 130,
    },

    highlighter: {
      padding: 1,
      border: '2px inset transparent',
    },

    input: {
      padding: 1,

      border: '2px inset',
    },
  },

  '&multiLine': {
    control: {
      fontFamily: 'monospace',

      border: '1px solid silver',
    },

    highlighter: {
      padding: 9,
    },

    input: {
      padding: 9,
      minHeight: 63,
      outline: 0,
      border: 0,
    },
  },

  suggestions: {
    list: {
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.15)',
      fontSize: 10,
    },

    item: {
      padding: '5px 15px',
      borderBottom: '1px solid rgba(0,0,0,0.15)',

      '&focused': {
        backgroundColor: '#cee4e5',
      },
    },
  },
}

class NoteInput extends React.Component {

  constructor (props) {
    super(props)

    this._update = this._update.bind(this)
    this.updateChange = _.debounce(this._update, 200)

    this.state = {
      value: ''
    }
  }

  fetchUsers (query, callback) {

    const {users} = this.props

    let items = []

    users.filter((u) => {
      const name = `${_.get(u, 'firstName')} ${_.get(u, 'lastName', '')}`
      return _.includes(_.toLower(name), _.toLower(query))

    }).map((u) => {

      const name = `${_.get(u, 'firstName')} ${_.get(u, 'lastName', '')}`
      return {
        display: _.get(u, 'firstName'),
        id: u._id,
        name: name
      }
    }).forEach((i) => items.push(i))

    callback(items)
  }

  onChange (event, newValue, newPlainTextValue, mentions) {

    this.setState({
      value: newValue
    }, () => {

      this.updateChange(newValue)

    })
  }

  _update (value) {
    if (this.props.onChange) {
      this.props.onChange(value)
    }
  }

  renderSuggestion (entry, search, highlightedDisplay, index) {
    return (
      <div className="user" key={'renderSuggestion'+index}>{entry.name}</div>
    )
  }

  componentDidMount () {
    const {value} = this.props

    if (value !== this.state.value) {
      this.setState({
        value: value
      })
    }
  }

  render () {

    const { onBlur } = this.props
    const {value} = this.state

    return (
      <Container>
        <FormLabel style={{marginBottom: 5, display: 'block'}}>Note</FormLabel>
        <MentionsInput
          value={value}
          onChange={this.onChange.bind(this)}
          onBlur={onBlur}
          style={defaultStyle}
          markup="@[__id__](__display__)"
          placeholder="Note Mention people using '@'"
          displayTransform={(id, display, type) => `@${display}`}
        >
          <Mention
            renderSuggestion={this.renderSuggestion.bind(this)}
            trigger="@"
            data={this.fetchUsers.bind(this)}
            style={defaultMentionStyle}/>
        </MentionsInput>

      </Container>
    )
  }
}

export default NoteInput
