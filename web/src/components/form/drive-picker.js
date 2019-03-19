import React from 'react'
import styled from 'styled-components'
import { Button } from '@material-ui/core'
import FileUpload from '@material-ui/icons/FileUpload'
import DriveDialog from '../dialog/drive-dialog'

const Container = styled.div `
  padding: 10px 0;
`

class DrivePicker extends React.Component {

  constructor (props) {

    super(props)

    this.state = {
      open: false,
    }
  }

  render () {

    const {rootId} = this.props
    const {open} = this.state
    return (
      <Container>
        <Button
          onClick={() => {
            this.setState({
              open: true,
            })
          }} size={'small'} color="default">
          GFX Assets
          <FileUpload size={'small'}/>
        </Button>

        {this.state.open && (
          <DriveDialog rootId={rootId} onClose={(event) => {
            this.setState({
              open: false,
            }, () => {

              if (this.props.onClose) {
                this.props.onClose(event)
              }
            })
          }} open={open} title={'Drive Library'} okButton={'Select'}
                       cancelButton={'Cancel'}/>)}
      </Container>
    )

  }
}

export default DrivePicker