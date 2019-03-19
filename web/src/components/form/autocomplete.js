import React from 'react'
import PropTypes from 'prop-types'
import keycode from 'keycode'
import Downshift from 'downshift'
import { withStyles, TextField, Paper, MenuItem, Chip } from '@material-ui/core'
import _ from 'lodash'

function renderInput (inputProps) {
  const {InputProps, classes, ref, ...other} = inputProps

  return (
    <TextField
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
        },
        ...InputProps,
      }}
      {...other}
    />
  )
}

function renderSuggestion ({suggestion, index, itemProps, highlightedIndex, selectedItem}) {
  const isHighlighted = highlightedIndex === index
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1

  return (
    <MenuItem
      {...itemProps}
      key={'MenuItem'+index+suggestion.label}
      selected={isHighlighted}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
    >
      {suggestion.label}
    </MenuItem>
  )
}

renderSuggestion.propTypes = {
  highlightedIndex: PropTypes.number,
  index: PropTypes.number,
  itemProps: PropTypes.object,
  selectedItem: PropTypes.string,
  suggestion: PropTypes.shape({label: PropTypes.string}).isRequired,
}

function getSuggestions (inputValue, suggestions) {
  let count = 0

  return suggestions.filter(suggestion => {

    const keep =
      (!inputValue ||
        suggestion.label.toLowerCase().indexOf(inputValue.toLowerCase()) !==
        -1) &&
      count < 5

    if (keep) {
      count += 1
    }

    return keep
  })
}

class DownshiftMultiple extends React.Component {
  state = {
    inputValue: '',
    selectedItem: [],
  }

  handleKeyDown = event => {
    const {inputValue, selectedItem} = this.state
    if (selectedItem.length && !inputValue.length && keycode(event) ===
      'backspace') {
      this.setState({
        selectedItem: selectedItem.slice(0, selectedItem.length - 1),
      })
    }
  }

  handleInputChange = event => {
    this.setState({inputValue: event.target.value})
  }

  handleChange = item => {
    const {multiple} = this.props
    let {selectedItem} = this.state

    selectedItem = []

    if (typeof item === 'string') {
      if (selectedItem.indexOf(item) === -1) {
        if (multiple) {
          selectedItem = [...selectedItem, item]
        }
        selectedItem = [item]
      }
    } else {
      if (!selectedItem.find((i) => i.key === _.get(item, 'key'))) {
        if (multiple) {
          selectedItem = [...selectedItem, item]
        } else {
          selectedItem = [item]
        }
      }
    }

    this.setState({
      inputValue: _.get(selectedItem, '[0].label', ''),
      selectedItem,
    }, () => {

      if (this.props.onChange) {
        this.props.onChange(selectedItem)
      }
    })
  }

  handleDelete = item => () => {
    const selectedItem = [...this.state.selectedItem]
    selectedItem.splice(selectedItem.indexOf(item), 1)

    this.setState({selectedItem}, () => {
      if (this.props.onChange) {
        this.props.onChange(selectedItem)
      }
    })
  }

  itemToString (item) {

    if (!item || Array.isArray(item)) {
      return ''
    }
    const label = _.get(item, 'label', null)
    return label ? label : item
  }

  componentWillReceiveProps (nextProps) {

    const {multiple} = this.props

    let defaultValue = _.get(nextProps, 'defaultValue')
    defaultValue = Array.isArray(defaultValue)
      ? defaultValue
      : [defaultValue]

    if (defaultValue && defaultValue.length &&
      this.state.selectedItem.length === 0) {
      this.setState({
        selectedItem: defaultValue,
        inputValue: !multiple ? _.get(defaultValue, '[0].label', '') : '',
      })
    }
  }

  componentDidMount () {

    const {multiple} = this.props

    let value = _.get(this.props, 'defaultValue', [])

    value = Array.isArray(value) ? value : [value]

    this.setState({
      selectedItem: value,
      inputValue: !multiple ? _.get(value, '[0].label', '') : '',
    })
  }

  render () {
    const {classes, options, multiple, label} = this.props
    const {inputValue, selectedItem} = this.state

    return (
      <Downshift
        itemToString={this.itemToString}
        inputValue={inputValue} onChange={this.handleChange}
        selectedItem={selectedItem}>
        {({
            getInputProps,
            getItemProps,
            isOpen,
            inputValue: inputValue2,
            selectedItem: selectedItem2,
            highlightedIndex,
          }) => (
          <div className={classes.container}>
            {renderInput({
              fullWidth: true,
              label: label ? label : null,
              classes,
              InputProps: getInputProps({
                startAdornment: multiple ? selectedItem.map((item, index) => (
                  <Chip
                    key={'Chip'+index+classes.chip}
                    tabIndex={-1}
                    label={typeof item === 'string' ? item : _.get(item,
                      'label')}
                    className={classes.chip}
                    onDelete={this.handleDelete(item)}
                  />
                )) : null,
                onChange: this.handleInputChange,
                onKeyDown: this.handleKeyDown,
                placeholder: 'Assign',
                id: 'integration-downshift-multiple',
              }),
            })}
            {isOpen ? (
              <Paper className={classes.paper} square>
                {getSuggestions(inputValue2, options).map((suggestion, index) =>
                  renderSuggestion({
                    suggestion,
                    index,
                    itemProps: getItemProps({item: suggestion}),
                    highlightedIndex,
                    selectedItem: selectedItem2,
                  }),
                )}
              </Paper>
            ) : null}
          </div>
        )}
      </Downshift>
    )
  }
}

DownshiftMultiple.propTypes = {
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  options: PropTypes.array,
  defaultValue: PropTypes.any,//PropTypes.shape({label: PropTypes.string}),
}

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    position: 'relative',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  chip: {
    margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
  },
  inputRoot: {
    flexWrap: 'wrap',
  },
})

function IntegrationDownshift (props) {
  const {classes, options, onChange, defaultValue, multiple, label} = props

  return (
    <div className={classes.root}>
      <DownshiftMultiple
        label={label}
        multiple={multiple} defaultValue={defaultValue}
        onChange={onChange}
        options={options}
        classes={classes}/>
    </div>
  )
}

IntegrationDownshift.propTypes = {
  classes: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  defaultValue: PropTypes.any,
  multiple: PropTypes.bool,
  label: PropTypes.string,
}

export default withStyles(styles)(IntegrationDownshift)