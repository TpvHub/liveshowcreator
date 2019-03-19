import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  withMobileDialog,
} from '@material-ui/core'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import FindUser from '../form/find-user'
import ShareSelectOptions from '../documents/share-select-options'
import styled from 'styled-components'
import { createDocumentPermission } from '../../redux/actions'
import DocumentPermissions from '../documents/document-permissions'
import _ from 'lodash'

const ContentWrapper = styled.div `
  display: flex;
  flex-direction: row;
  
`

const ActionContainer = styled.div `
  display: flex;
  flex-direction:row;
  width: 100%;
  align-items: center;
`
const LeftButtons = styled.div `
  flex-grow: 1;
`

const RightButtons = styled.div `
  button{
    background: 0 none;
    border: 0 none;
    margin:0;
    color: #646464;
    cursor: pointer;
    outline: 0 none;
    &:active{
      outline: 0 none;
    }
  }
`

class ShareDocumentDialog extends React.Component {

  constructor (props) {
    super(props)

    this.handleClose = this.handleClose.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.showPermissions = this.showPermissions.bind(this)

    this.state = {
      permission: 'write',
      users: [],
      openList: false,
      permissions: [],
    }

  }

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  handleSubmit = () => {
    const {docId, createDocumentPermission} = this.props
    const {users, permission, permissions} = this.state

    let list = []

    _.each(users, (user) => {
      list.push({
        id: docId,
        userId: user._id,
        email: null,
        type: permission,
      })
    })

    _.each(permissions, (perm) => {

      list.push({
        id: docId,
        userId: perm.user._id,
        email: null,
        type: perm.type,
      })
    })

    if (list.length) {
      createDocumentPermission(docId, list).then(() => {
        this.handleClose()
      })
    }

  }

  showPermissions () {
    this.setState({
      openList: true,
    })
  }

  render () {

    const {fullScreen, open, docId} = this.props

    const isChanged = this.state.permissions.length || this.state.users.length

    return (
      <div>
        <Dialog
          fullScreen={fullScreen}
          open={open}
          onClose={this.handleClose}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle
            id="responsive-dialog-title">Share with others</DialogTitle>
          <DialogContent style={{minWidth: 550, minHeight: 200}}>

            <ContentWrapper>
              <FindUser onChange={(users) => {
                this.setState({
                  users: users,
                })
              }}/>
              <ShareSelectOptions
                selected={this.state.permission}
                onChange={(perm) => {
                  this.setState({
                    permission: perm,
                  })
                }}/>
            </ContentWrapper>

            {this.state.openList && <DocumentPermissions
              onChange={(perms) => {
                this.setState({
                  permissions: perms,
                })
              }}
              docId={docId}/>}

          </DialogContent>
          <DialogActions>
            <ActionContainer>
              <LeftButtons>
                <Button
                  disabled={!isChanged}
                  onClick={this.handleSubmit}
                  color={'primary'}>
                  Done
                </Button>
                <Button
                  color={'secondary'}
                  onClick={this.handleClose}>
                  Cancel
                </Button>
              </LeftButtons>
              {
                !this.state.openList && (
                  <RightButtons>
                    <button
                      onClick={this.showPermissions}
                      type={'button'}>
                      Advanced
                    </button>
                  </RightButtons>
                )
              }

            </ActionContainer>
          </DialogActions>
        </Dialog>

      </div>
    )
  }
}

ShareDocumentDialog.propTypes = {
  fullScreen: PropTypes.bool.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
}

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  createDocumentPermission,
}, dispatch)
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMobileDialog()(ShareDocumentDialog))