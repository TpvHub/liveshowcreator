import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import _ from 'lodash'
import { ON_SUBMIT_ADD_GFX_CARD, SET_GFX_SELECT, EDIT_GFX } from '../../redux/types'
import { getCurrentUser, getDocument } from '../../redux/selectors'
import { gfxTitleMaxLength } from '../../config'

class AddGfxCard extends React.Component {
  constructor (props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit () {

    const {event, newGFX, currentUser, docId} = this.props

    const payload = _.get(newGFX, 'payload')

    // get default title from selection text
    const defaultTitle = _.truncate(_.trim(_.get(newGFX, 'text', ''), ' \r\n'), {
      length: gfxTitleMaxLength, // limit the maximum characters
      omission: ''
    })

    const userId = _.get(currentUser, '_id')
    const user = {
      _id: userId,
      firstName: _.get(currentUser, 'firstName'),
      lastName: _.get(currentUser, 'lastName'),
      avatar: _.get(currentUser, 'avatar'),
    }

    let card = {
      title: _.get(payload, 'title', defaultTitle),
      body: '',
      status: '',
      assign: '',
      userId: userId,
      user: user,
      documentId: docId,
      files: [],
      created: new Date(),
      updated: null,
    }

    event.emit(ON_SUBMIT_ADD_GFX_CARD, {
      payload: card,
      range: _.get(newGFX, 'range'),
    })

    // hide add new card
    this.props.done()

    // scroll to the added gfx card
    window.setTimeout(() => this.props.editGfx(card), 10)

  }

  componentWillMount () {
    this.handleSubmit()
  }

  render () {
    return null
  }
}

const mapStateToProps = (state, props) => ({
  currentUser: getCurrentUser(state),
  newGFX: state.sidebar.newGFX,
  event: state.event,
  doc: getDocument(state, props)
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  editGfx: (card) => {
    return (dispatch) => {
      dispatch({
        type: EDIT_GFX,
        payload: _.get(card, 'id'),
      })
    }
  },
  done: () => {
    return (dispatch) => {
      dispatch({
        type: SET_GFX_SELECT,
        payload: null,
      })
    }
  },
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(AddGfxCard)
