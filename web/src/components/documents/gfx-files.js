import React from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import MenuAction from '../menu-action'

const Container = styled.div `


`

const List = styled.div `

`

const ListItem = styled.div `
  padding: 5px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: row;
  align-items: center;
  .item-content{
    flex-grow: 1;
  }
`

const FileName = styled.div `
  font-weight: 700;
  font-size: 11px;
`

const FileDescription = styled.div `
  color: rgba(0,0,0,0.5);
`

class GfxFiles extends React.Component {

  constructor (props) {
    super(props)

    this.handleRemoveFile = this.handleRemoveFile.bind(this)
  }

  handleRemoveFile (file) {
    if (this.props.onRemoveFile) {
      this.props.onRemoveFile(file)
    }
  }

  render () {
    const {files} = this.props
    const menuOptions = [
      {
        label: 'Open in Drive',
        key: 'openInDrive',
      },
      {
        label: 'Download',
        key: 'download'
      },
      {
        label: 'Remove',
        key: 'remove',
      },

    ]
    return (
      <Container>

        <List>
          {
            files.map((file, index) => {

              if (!file) {
                return null
              }
              const name = _.get(file, 'name')
              const description = _.get(file, 'description', null)

              const link = _.get(file, 'webViewLink')
              return (
                <ListItem key={'ListItem'+name+link}>
                  <div className={'item-content'}>
                    <FileName><a target={'_blank'} href={link}>{name}</a> </FileName>
                    <FileDescription>{description}</FileDescription>
                  </div>
                  <div className={'item-action'}>
                    <MenuAction onSelect={(option) => {

                      switch (option.key) {

                        case 'openInDrive':

                          window.open(`${link}`, 'blank')

                          break

                        case 'download':

                          if (this.props.onDownload) {
                            this.props.onDownload(file)
                          }

                          break

                        case 'remove':
                          // handle remove file
                          this.handleRemoveFile(file)

                          break

                        default:

                          break
                      }

                    }} options={menuOptions}/>
                  </div>
                </ListItem>
              )
            })
          }
        </List>
      </Container>
    )
  }
}

export default GfxFiles