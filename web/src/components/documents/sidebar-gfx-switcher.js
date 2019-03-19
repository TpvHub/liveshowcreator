import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import styled from 'styled-components'
// import blue from '@material-ui/core/colors/blue'

const Container = styled.div  `
  width: 200px;

  button {
    min-width: 0 !important;
    min-height: 39px;
  }
`

const styles = theme => ({
  root: {
    minHeight: '0',
  },
  labelContainer: {
    padding: '0',
  },
  label: {
    whiteSpace: 'nowrap',
  },
})

class SidebarGfxSwitcher extends React.Component {

  transformValue = (checked) => {
    return checked ? 1 : 0
  }

  render () {
    const {classes, checked} = this.props

    return (
      <Container>
        <Tabs
          value={this.transformValue(checked)}
          onChange={(e, val) => {
            if (this.props.onChange) {
              this.props.onChange(val !== 1)
            }
          }}
          fullWidth
          classes={{
            root: classes.root
          }}
        >
          <Tab classes={{
              labelContainer: classes.labelContainer,
              label: classes.label
            }}
            label={'Cues'}
            value={1}
          />
          <Tab classes={{
              labelContainer: classes.labelContainer,
              label: classes.label
            }}
            label={'Unused Cues'}
            value={0}
          />
        </Tabs>
      </Container>
    )
  }
}

SidebarGfxSwitcher.propTypes = {
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  checked: PropTypes.bool,
}

export default withStyles(styles)(SidebarGfxSwitcher)
