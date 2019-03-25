import { SET_HEADER_TITLE, SET_TOKEN, SET_CURRENT_USER } from '../types'
import _ from 'lodash'

const initState = {
  currentUser: null,
  currentToken: null,
  headerTitle: 'TpvHub Creator',
}

export default (state = initState, action) => {

  const payload = _.get(action, 'payload')
  switch (action.type) {

    case SET_HEADER_TITLE:

      return {
        ...state,
        headerTitle: payload
      }

    case SET_CURRENT_USER:

      return {
        ...state,
        currentUser: payload,
      }

    case SET_TOKEN:

      return {
        ...state,
        currentToken: payload,
      }
    default:

      return state
  }
}