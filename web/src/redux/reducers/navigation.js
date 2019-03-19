import { DOC_NAVIGATION_TOGGLE, SET_HEADING_ITEMS } from '../types'
import _ from 'lodash'

const initState = {
  open: false,
  headings: []
}

export default (state = initState, action) => {

  switch (action.type) {

    case DOC_NAVIGATION_TOGGLE:

      const isOpen = _.get(action, 'payload.open', null)

      return {
        ...state,
        open: isOpen !== null ? isOpen : !state.open
      }

    case SET_HEADING_ITEMS:

      let headings = _.get(action, 'payload.items', [])

      // headings need to be an array
      return {
        ...state,
        headings: Array.isArray(headings) ? headings : [headings]
      }

    default:

      return state
  }
}
