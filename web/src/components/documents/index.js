import React from 'react'
import Layout from '../../layout'
import styled from 'styled-components'
import { Menu, MenuItem, IconButton, Button, Tooltip } from '@material-ui/core'
import { MoreVert, Add } from '@material-ui/icons'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getCurrentUser, getVisibleDocuments } from '../../redux/selectors'
import {
  createDocument,
  deleteDocument,
  loadDocuments,
  updateDocument,
  showLoadingDialog,
} from '../../redux/actions'
import _ from 'lodash'
import { moment } from '../../config'
import { history } from '../../hostory'
import ConfirmDeleteDialog from './confirm-delete-dialog'
import RenameDialog from './rename-dialog'
import LoadMore from './load-more'

const Container = styled.div`
 padding: 15px 0;
 @media (min-width: 992px){
    padding: 30px 0;
 }
 font-family: 'Roboto', sans-serif;
`
const FlexList = styled.div`
  border-bottom: 1px solid #c4c4c4;
  // border-left: 1px solid #d3d3d3;
  // border-right: 1px solid #d3d3d3;
  // border-top: 1px solid #d3d3d3;
  box-shadow: 0 1px 0 rgba(0,0,0,0.07);

  .document-header {
    > div:hover {
      color: black;
    }
    .document-owner{
      font-weight: 500 !important;
    }
    .document-created{
      font-weight: 500 !important;
    }
    border-top: unset;
    border-left: unset;
    border-right: unset;

    &:hover{
      background-color: unset;
    }
  }

`
const FlexListItem = styled.div`
  background-color: #fff;
  border-bottom: 1px solid #e3e3e3;
  border-left: 1px solid #d3d3d3;
  border-right: 1px solid #d3d3d3;
  color: #444;
  cursor: pointer;
  display: flex;
  opacity: 1;
  cursor: pointer;
  font-size: 14px;
  .document-menu-action{
    cursor: pointer;
    display: inline-block;
    float: right;
    opacity: 0.3;
  }
  .document-title{
    margin-right: 12px;
    width: 45%;
    font-weight: 500;
    .document-title-value {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
      white-space: nowrap;
      
    }
  }
  .document-owner{
    flex: 10;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .document-created{
    flex: 16;
  }
  &:hover{
    background-color: #eef6ff;
    .document-menu-action{
      opacity: 1;
    }
  }
`

const FlexListItemCell = styled.div`
  margin-bottom: auto;
  margin-left: 16px;
  margin-top: auto;
  white-space: nowrap;
  min-height: 45px;
  align-items: center;
  display: flex;
`

const AddDocButton = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2;
  height: 56px;
  width: 56px;
`

const LIMIT = 20

class Documents extends React.Component {

  constructor(props) {

    super(props)

    this.handleMenuOpen = this.handleMenuOpen.bind(this)
    this.handleMenuClose = this.handleMenuClose.bind(this)
    this.openDocument = this.openDocument.bind(this)
    this.handleMenuAction = this.handleMenuAction.bind(this)
    this._onDeleteModel = this._onDeleteModel.bind(this)
    this.loadMore = this.loadMore.bind(this)

    this.state = {
      docs: [],
      anchorEl: null,
      menu: null,
      deleteModel: null,
      editModel: null,
      isLoadMore: false,
      search: '',
    }

    this.sortDocsMeta = {
      title: 1,
      owner: 1,
      updated: 1,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.docs) this.setState({
      docs: nextProps.docs.map(doc => ({
        ...doc,
        owner: `${_.get(doc, 'user.firstName', '')} ${_.get(doc, 'user.lastName', '')}`
      }))
    })
  }

  get hasPermissionAddDoc() {
    const { currentUser } = this.props
    return _.includes(_.get(currentUser, 'roles', []), 'client')
  }

  handleMenuOpen(event, id) {

    this.setState({
      menu: id,
      anchorEl: event.currentTarget,
    })
  }

  handleMenuAction(option, doc) {

    this.setState({
      menu: null,
      anchorEl: null,
      deleteModel: _.get(option, 'key') === 'remove'
        ? doc
        : this.state.deleteModel,
      editModel: _.get(option, 'key') === 'rename' ? doc : this.state.editModel,
    }, () => {
      if (option.key === 'open') {
        this.openDocument(doc, true)
      }
    })
  }

  handleMenuClose(e, doc) {
    this.setState({
      menu: null,
      anchorEl: null,
    })
  }

  openDocument(doc, edit = false) {
    if (edit) {
      history.push(`/document/${doc._id}/edit`)
    } else {
      history.push(`/document/${doc._id}`)
    }

  }

  _onDeleteModel(doc) {

    this.setState({
      deleteModel: doc,
    })
  }

  componentWillMount() {
    const filter = { limit: LIMIT, skip: 0 }
    this.props.loadDocuments(filter)
  }

  loadMore(filter) {

    filter.search = this.state.search

    const _this = this
    this.setState({
      isLoadMore: true
    }, () => {

      _this.props.loadDocuments(filter).then(() => {
        this.setState({
          isLoadMore: false
        })
      })
    })

  }

  handleSearch(s) {
    this.setState({
      search: s,
    }, () => {
      const filter = { limit: LIMIT, skip: 0, search: s }
      this.props.loadDocuments(filter)
    })
  }

  handleSort = (header_name) => (e) => {
    this.setState((prevState) => {
      prevState.docs = prevState.docs.sort((a, b) => {
        if (a[header_name] > b[header_name]) return this.sortDocsMeta[header_name] * -1;
        else if (a[header_name] === b[header_name]) return 0;
        else return this.sortDocsMeta[header_name];
      });
      this.sortDocsMeta[header_name] *= -1;
      return prevState;
    })
  }

  render() {

    const { currentUser } = this.props
    const { docs, menu, anchorEl } = this.state

    const showList = docs.size > 0

    let isStaffOrAdmin = false
    const roles = _.get(currentUser, 'roles')
    if (_.includes(roles, 'administrator') || _.includes(roles, 'staff')) {
      isStaffOrAdmin = true
    }

    let options = [
      {
        key: 'open',
        label: 'Open',
      },
    ]

    if (isStaffOrAdmin) {
      options = [

        {
          key: 'rename',
          label: 'Rename',
        },
        {
          key: 'remove',
          label: 'Remove',
        },
        {
          key: 'open',
          label: 'Open',
        },

      ]
    }

    return (
      <Layout
        onSearch={this.handleSearch.bind(this)}
        useSearch={true}>
        <Container>
          {showList && (
            <FlexList>
              <FlexListItem className={'document-header'} >
                <FlexListItemCell
                  onClick={this.handleSort('title')}
                  className={'document-title'}>
                  <div
                    className={'document-title-value'}>Title</div>
                </FlexListItemCell>
                <FlexListItemCell
                  onClick={this.handleSort('owner')}
                  className={'document-owner'}>
                  Owner
                </FlexListItemCell>
                <FlexListItemCell
                  onClick={this.handleSort('updated')}
                  className={'document-created'}>
                  Last modified
                </FlexListItemCell>
                <FlexListItemCell
                  className={'document-menu'}>
                  <span style={{ color: "transparent" }}>action</span>
                </FlexListItemCell>
              </FlexListItem>
              {
                docs.map((doc, index) => {
                  let editable = true
                  if (doc.userId === _.get(currentUser, '_id')) {
                    editable = true
                  }
                  return (
                    <FlexListItem
                      key={'FlexListItem' + doc.title + index}>
                      <FlexListItemCell
                        onClick={() => this.openDocument(doc, editable)}
                        className={'document-title'}>
                        <div
                          className={'document-title-value'}>{doc.title}</div>
                      </FlexListItemCell>
                      <FlexListItemCell
                        onClick={() => this.openDocument(doc, editable)}
                        className={'document-owner'}>
                        {doc.owner}
                      </FlexListItemCell>
                      <FlexListItemCell
                        onClick={() => this.openDocument(doc, editable)}
                        className={'document-created'}>
                        {moment(doc.updated).format('LL')}
                      </FlexListItemCell>
                      <FlexListItemCell className={'document-menu-action'}>
                        <div className={'document-menu'}>
                          <IconButton
                            aria-label="More"
                            aria-owns={anchorEl ? 'long-menu' : null}
                            aria-haspopup="true"
                            onClick={(event) => this.handleMenuOpen(event,
                              doc._id)}
                          >
                            <MoreVert />
                          </IconButton>
                          <Menu
                            id="long-menu"
                            anchorEl={anchorEl}
                            open={menu === doc._id}
                            onClose={(event) => this.handleMenuClose(event,
                              doc.id)}
                          >
                            {options.map((option, index) => (
                              <MenuItem
                                key={'MenuItem' + index + option.label}
                                onClick={() => this.handleMenuAction(option,
                                  doc)}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Menu>
                        </div>
                      </FlexListItemCell>
                    </FlexListItem>
                  )
                })
              }
            </FlexList>
          )}

          <LoadMore
            hideButton={false}
            count={this.props.docs.size}
            maxCount={this.props.count}
            onLoad={() => {
              // need request load more document
              this.loadMore({
                limit: LIMIT,
                skip: this.props.docs.size,
              })
            }} loading={this.state.isLoadMore} />

          {this.hasPermissionAddDoc && (
            <AddDocButton>
              <Tooltip id="tooltip-left-end" title="Create new show"
                placement="left-end">
                <Button onClick={() => {
                  this.props.showLoadingDialog({
                    open: true,
                    text: 'Creating a folder on a drive...',
                  })
                  this.props.createDocument({ title: 'Untitled document' }).then((doc) => {
                    this.props.showLoadingDialog({
                      open: false,
                    })
                    history.push(`/document/${doc._id}/edit`)
                  })
                }} variant="fab" color="primary" aria-label="add">
                  <Add />
                </Button>
              </Tooltip>
            </AddDocButton>
          )}
          <ConfirmDeleteDialog onClose={(action) => {
            switch (action) {

              case 'delete':
                this.props.deleteDocument(_.get(this.state, 'deleteModel._id'))

                break

              case 'cancel':

                break

              default:

                break
            }
            this.setState({
              deleteModel: null,
            })

          }} open={!!this.state.deleteModel} />
        </Container>
        {
          this.state.editModel && (
            <RenameDialog onClose={(action, title) => {
              if (action === 'ok') {
                let doc = this.state.editModel
                doc.title = title

                this.props.updateDocument({ _id: doc._id, title: title }, {
                  skipUpdateInactiveGfx: true
                })
              }
              this.setState({
                editModel: null,
              })
            }} title={_.get(this.state, 'editModel.title', '')} open={true} />
          )
        }
      </Layout>
    )
  }
}

const mapStateToProps = (state) => ({
  currentUser: getCurrentUser(state),
  docs: getVisibleDocuments(state),
  count: state.docCount,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  loadDocuments,
  createDocument,
  deleteDocument,
  updateDocument,
  showLoadingDialog,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Documents)