import React from 'react'
import styled from 'styled-components'
import Select from '../form/select'

const Container = styled.div `
  width: 100%;
  margin: 5px 0 10px 0;
  padding: 0 10px;
  .gfx-sort-formControl {
    background-color: white;
    width: 100%;
    padding: 3px 8px;
  }
`

class GfxSort extends React.Component {

  // constructor (props) {
  //   super(props);
  // }

  render () {
    const { onChangeSelect = {}, arOptions = [], value } = this.props
    return (
      <Container className={'gfx-sort'}>
        <Select
          classes={{ formControl: 'gfx-sort-formControl' }}
          required={true}
          defaultValue={value || arOptions[0]}
          onChange={(selected) => onChangeSelect(selected)}
          options={arOptions}
        />
      </Container>
    )
  }
}

export default GfxSort