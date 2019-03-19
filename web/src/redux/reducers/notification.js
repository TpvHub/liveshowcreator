import _ from 'lodash'
import { SET_NOTIFICATION_ITEMS, SET_NOTIFICATION_COUNTER, ADD_NOTIFICATION_ITEM } from '../types'

const initState = {
  counter: 0,
  items: []
}

export default (state = initState, action) => {

  switch (action.type) {

    case SET_NOTIFICATION_COUNTER:

      return {
        ...state,
        counter: _.get(action, 'payload.counter', 0)
      }

    case SET_NOTIFICATION_ITEMS:

      let items = _.get(action, 'payload.items', [])

      // headings need to be an array
      return {
        ...state,
        items: Array.isArray(items) ? items : [items]
      }

    case ADD_NOTIFICATION_ITEM:

      let notifications = _.get(state, 'items', [])
      notifications.unshift(_.get(action, 'payload', {}))

      // TODO: limit the number of items within 20

      const counter = _.get(state, 'counter', 0) + 1 // increase the counter

      return {
        ...state,
        counter: counter,
        items: notifications
      }

    default:

      return state
  }
}
