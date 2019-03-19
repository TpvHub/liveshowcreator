import { createSelector } from 'reselect'
import _ from 'lodash'

const currentUser = (state) => {
  const app = state.app

  let user = _.get(app, 'currentUser', null)
  let userId = _.get(user, '_id')
  let _user = state.user.models.get(userId)
  if (_user) {
    return _user
  }
  return user
}
export const getCurrentUser = createSelector(
  [currentUser],
  (user) => user,
)

const getUserList = (state) => {

  // const filter = state.user.filter
  // we may use filter , search for later.
  return state.user.models.valueSeq()
}
export const getVisibleUsers = createSelector(
  [getUserList],
  (models) => models,
)

const getUser = (state, props) => {
  const id = _.get(props, 'match.params.id')
  return state.user.models.get(id)
}

export const getUserById = createSelector(
  [getUser],
  (u) => u
)

const getSearchUser = (state) => {
  return state.userSearch.valueSeq()
}


export const getUserSearchList = createSelector(
  [getSearchUser],
  (users) => users
)