import { SET_USERS_SEARCH } from '../types'
import { OrderedMap } from 'immutable'
import _ from 'lodash'

export default (state = new OrderedMap(), action) => {

  switch (action.type) {

    case SET_USERS_SEARCH:

      let immutable = state

      let users = _.get(action, 'payload', [])
      if (!Array.isArray(users)) {
        users = [users]
      }

      immutable = immutable.clear()

      _.each(users, (user) => {
        immutable = immutable.set(_.get(user, '_id'), user)
      })

      return immutable

    default:

      return state
  }
}