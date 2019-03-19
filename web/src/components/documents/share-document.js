import React from 'react'
import { Button, Icon } from '@material-ui/core'
import ShareDocumentDialog from '../dialog/share-document-dialog'

export default class ShareDocument extends React.Component {

  constructor (props) {
    super(props)

    this.handleToggle = this.handleToggle.bind(this)

    this.state = {
      open: false,
    }
  }

  handleToggle () {

    this.setState({
      open: !this.state.open,
    })
  }

  render () {

    const {docId} = this.props
    return (
      <div className={'button-item'}>
        <Button
          color={'primary'}
          variant={'raised'}
          size={'small'}
          aria-haspopup="true"
          onClick={this.handleToggle}
        >
          <Icon>domain</Icon>
          Share
        </Button>
        {this.state.open && <ShareDocumentDialog
          docId={docId}
          onClose={this.handleToggle}
          open={this.state.open}
          />
        }
      </div>
    )
  }
}