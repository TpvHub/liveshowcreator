import React from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { downloadGfx, downloadPdf, togglePrintLayout, showMessage, toggleDocNavigation, toggleCommentItems } from '../../redux/actions'
import DocumentPrompter from './document-prompter'
import { config } from '../../config'
import { getDocument } from '../../redux/selectors'
import ExportGfxDialog from '../dialog/export-gfx-dialog'

const Container = styled.div`

`

const List = styled.div`


`

const ListItem = styled.div`
  margin-top: 2px;
  border: 1px solid transparent;
  outline: none;
  font-size: 13px;
  position: relative;
  display: inline-block;
  z-index: 1299;
  &:hover{
    .document-menu-title.document-menu-title-level-0{
     box-shadow: 0 2px 4px rgba(0,0,0,0.2);
     border: 1px solid rgba(0,0,0,.2);
     border-bottom: 0 none;
    }
    .document-sub-menu{
      display: block;
    }
  }
`

const ChildContainer = styled.div`
    border-radius: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: opacity 0.218s;
    background: #fff;
    border: 1px solid #ccc;
    border: 1px solid rgba(0,0,0,.2);
    cursor: default;
    font-size: 13px;
    margin: 0;
    outline: none;
    padding: 6px 0;
    position: absolute;
    top: 23px;
    min-width: 170px;
    display: none;
    .document-menu-item{
      cursor: pointer;
      display: block;
    }
`

const MenuTitle = styled.div`
  box-shadow: ${props => props.isOpen ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'};
  border: ${props => props.isOpen ? '1px solid rgba(0,0,0,.2)' : '1px solid transparent'};
  border-bottom: 0 none;
  padding: 3px 7px 5px 7px;
  a{
    color: black;
    text-decoration: none;
  }
  &:hover{
    background: rgba(0,0,0,0.02);
  }
`

class DocumentMenu extends React.Component {

  constructor(props) {
    super(props)

    this.renderItems = this.renderItems.bind(this)
    this.activeItem = this.activeItem.bind(this)
    this.handleOnMenuItemClick = this.handleOnMenuItemClick.bind(this)

    this.state = {
      active: null,
      openPrompter: false,
      openExportGfx: false
    }
  }

  activeItem(item) {
    this.setState({
      active: item
    })
  }

  handleOnMenuItemClick(item) {

    if (this.props.onSelect) {
      this.props.onSelect(item)
    }
    switch (item.key) {

      case 'export_gfx':

        this.setState({
          openExportGfx: true,
        })

        break
      case 'view_prompter':

        this.setState({
          openPrompter: true
        })

        break

      // case 'view_print_layout':

      //   this.props.togglePrintLayout(true)

      //   this.props.showMessage({
      //     body: 'Print layout is activated. Press ESC key to exit.',
      //     duration: 3000,
      //   })

      //   break

      case 'toggle_doc_navigation':
        this.props.toggleDocNavigation()
        break

      case 'show_hide_comments':
        this.props.toggleCommentItems()
        break

      default:
        break
    }
  }

  renderItems(items, level = 0) {

    const { active } = this.state

    return (
      <List className={`document-menu document-menu-level-${level}`}>
        {

          items.map((item, index) => {
            const isOpen = _.get(active, 'key') === item.key


            return (
              <ListItem
                onClick={() => this.handleOnMenuItemClick(item)}
                className={'document-menu-item'} key={item.label + item.link}>
                <MenuTitle
                  className={`document-menu-title document-menu-title-level-${level}`} isOpen={isOpen}
                >{item.link ? <a href={item.link} target={item.target ? item.target : '_self'}>{item.label}</a> : item.label} {item.icon}</MenuTitle>
                {
                  item.children && item.children.length ? (
                    <ChildContainer isOpen={isOpen} className={'document-sub-menu'}>
                      {
                        this.renderItems(item.children, level + 1)
                      }
                    </ChildContainer>
                  ) : null
                }
              </ListItem>
            )
          })
        }
      </List>
    )
  }

  render() {

    const { docId, token, isHideGfx, isShowComments } = this.props

    const items = [
      {
        label: 'File',
        key: 'file',
        children: [
          // {
          //   label: 'View as Prompter',
          //   key: 'view_prompter',
          // },
          // {
          //   label: 'View as Print',
          //   key: 'view_print_layout'
          // },
          // {
          //   label: 'Download as Text',
          //   key: 'download_txt',
          //   link: `${config.url}/documents/${docId}/download/text?auth=${_.get(token, 'token', '')}`
          // },
          {
            label: 'Download as PDF',
            key: 'download_pdf',
            link: `${config.url}/documents/${docId}/download/pdf?auth=${_.get(token, 'token', '')}`
          },
          // {
          //   label: 'Export GFX',
          //   key: 'export_gfx',
          //   // link: `${config.url}/documents/${docId}/download/gfx?auth=${_.get(token, 'token', '')}`
          // },

          {
            label: 'Print...',
            key: 'print',
            target: '_blank',
            link: `${config.url}/documents/${docId}/download/pdf?auth=${_.get(token, 'token', '')}&option=view&isHideGfx=${isHideGfx ? 1 : 0}`
          },
        ]
      },
      {
        label: 'View',
        key: 'view',
        children: [
          {
            label: 'View as Prompter',
            key: 'view_prompter',
          },
          {
            label: 'Navigation Outline',
            key: 'toggle_doc_navigation'
          },
          {
            label: 'Show/Hide Comments',
            key: 'show_hide_comments',
            icon: isShowComments ? <b>&#10004;</b> : null
          }
        ]
      }
    ]

    return (
      <Container>
        {
          this.renderItems(items)
        }
        <DocumentPrompter
          doc={this.props.doc}
          onClose={() => {
            this.setState({ openPrompter: false })
          }}
          open={this.state.openPrompter} />
        <ExportGfxDialog
          doc={this.props.doc}
          token={this.props.token}
          onClose={() => {
            this.setState({
              openExportGfx: false
            })
          }}
          open={this.state.openExportGfx} />
      </Container>)
  }
}

const mapStateToProps = (state, props) => ({
  token: state.app.currentToken,
  doc: getDocument(state, props),
  isHideGfx: state.toggleGfx.get(_.get(props, 'docId')),
  isShowComments: state.layout.showComments
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  downloadPdf,
  downloadGfx,
  togglePrintLayout,
  toggleDocNavigation,
  showMessage,
  toggleCommentItems
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentMenu)
