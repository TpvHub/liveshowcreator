import { SET_USERS_FROM_CLIENT, DELETE_USER_MODEL } from '../types'
import { OrderedMap } from 'immutable'
import _ from 'lodash'

export default (state = new OrderedMap(), action) => {
  let immutable = state
  switch (action.type) {

    case SET_USERS_FROM_CLIENT:

      let users = _.get(action, 'payload', [])
      if (!Array.isArray(users)) {
        users = [users]
      }

      immutable = immutable.clear()

      _.each(users, (user) => {
        immutable = immutable.set(_.get(user, '_id'), user)
      })

      return immutable

    case DELETE_USER_MODEL:
      immutable = immutable.remove(_.get(action, 'payload', null))

      return immutable

    default:

      return state
  }
}