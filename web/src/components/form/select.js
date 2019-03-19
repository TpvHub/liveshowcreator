import React from 'react'
import PropTypes from 'prop-types'
import {
  InputLabel,
  withStyles,
  MenuItem,
  FormControl,
  Select,
} from '@material-ui/core'
import _ from 'lodash'

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: 0,
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing.unit * 2,
  },
})

class CustomSelect extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      value: '',
    }
  }

  /**
   * Handle on change
   * @param event
   */
  handleChange = event => {

    const {options} = this.props

    let _value = event.target.value

    this.setState({
      value: _value,

    }, () => {
      if (this.props.onChange) {
        const _selected = options.find((i) => _.get(i, 'key', i) === _value)
        this.props.onChange(_selected)
      }

    })
  }

  componentWillReceiveProps (nextProps) {
    const {value} = this.props
    const nextValue = _.get(nextProps, 'value')

    if (typeof value !== 'undefined' && this.state.value !==
      _.get(nextValue, 'key', nextValue)) {
      this.setState({
        value: _.get(nextValue, 'key', nextValue),
      })
    }
  }

  componentDidMount () {
    const {defaultValue, value} = this.props

    if (typeof defaultValue !== 'undefined') {

      this.setState({
        value: _.get(defaultValue, 'key', defaultValue),
      })
    }
    if (typeof value !== 'undefined') {
      this.setState({
        value: _.get(value, 'key', value),
      })
    }

  }

  render () {
    const {classes, name, id, label, required, options, className} = this.props

    let theID = id ? id : _.uniqueId('select-')
    let selectOptions = []

    if (!required) {
      selectOptions = [
        {
          key: '',
          label: <em>None</em>,
        },
      ]
    }

    selectOptions = selectOptions.concat(options)

    return (
      <div className={className ? className : null}>
        <FormControl className={classes.formControl}>
          {label && <InputLabel htmlFor={theID}>{label}</InputLabel>}
          <Select
            value={this.state.value}
            onChange={this.handleChange}
            inputProps={{
              name: name,
              id: theID,
            }}
          >

            {selectOptions.map((item, index) => {
              const optionTitle = _.get(item, 'label', item)
              const optionValue = _.get(item, 'key', item)
              return <MenuItem key={'MenuItem'+index+optionTitle}
                               value={optionValue}>{optionTitle}</MenuItem>

            })}

          </Select>
        </FormControl>
      </div>
    )
  }
}

CustomSelect.propTypes = {
  classes: PropTypes.object.isRequired,
  name: PropTypes.string,
  id: PropTypes.string,
  options: PropTypes.array,
  label: PropTypes.string,
  required: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
  className: PropTypes.string
}

export default withStyles(styles)(CustomSelect)