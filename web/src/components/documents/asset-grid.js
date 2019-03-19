import React from 'react'
// import Button from '@material-ui/core/Button'
// import _ from 'lodash'
import GfxAssets from '../documents/gfx-assets'
// import Typography from '@material-ui/core/Typography'

class AssetGrid extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      open: true,
      files: [],
      change: false
    }

  }

  handleClose = (option) => {
    this.setState({open: false}, () => {
      if (this.props.onClose) {
        this.props.onClose(option, this.state.files)
      }
    })
  }

  render () {
    const { gfx, onOpenDrive } = this.props
    return (
      <div>
        <GfxAssets
              onOpenDrive={onOpenDrive}
              onDownload={(files) => {
                if(this.props.onDownload){
                  this.props.onDownload(files)
                }
              }}
              onChange={(files) => {

              this.props.onSave(files)
            }} gfx={gfx}/>
      </div>
    )
  }
}

export default AssetGrid
