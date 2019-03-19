import { SET_LINE_SPACING } from '../types'
import _ from 'lodash'

export default (state = {}, action) => {

  switch (action.type) {

    case SET_LINE_SPACING:

      const documentId = _.get(action, 'payload.docId')

      return {
        ...state,
        [documentId]: _.get(action, 'payload.value')
      }

    default:

      return state
  }
}