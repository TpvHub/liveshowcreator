import { createSelector } from 'reselect'
import _ from 'lodash'

const getModels = (state, name = '') => {
  console.log(state, name)

  const list = _.get(state, name)
  if (list) {
    return list.valueSeq()
  }
  return []
}

export const getVisibleModels = createSelector(
  [getModels],
  (models) => models,
)