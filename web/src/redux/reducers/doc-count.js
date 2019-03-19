import _ from 'lodash'
import { DECREASE_DOCUMENT_COUNT, INCREASE_DOCUMENT_COUNT, LOGOUT, SET_DOCUMENT_COUNT } from '../types'

export default (state = 0, action) => {

  switch (action.type) {

    case SET_DOCUMENT_COUNT:

      return action.payload

    case INCREASE_DOCUMENT_COUNT:

      return state + _.get(action, 'payload', 1)

    case DECREASE_DOCUMENT_COUNT:

      return state - _.get(action, 'payload', 1)

    case LOGOUT:

      return 0

    default:

      return state
  }

}