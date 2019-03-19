import { createSelector } from 'reselect'
import _ from 'lodash'

const getDocuments = (state) => {
  const doc = state.doc
  return doc.valueSeq()
}
export const getVisibleDocuments = createSelector(
  [getDocuments],
  (documents) => documents,
)

const getDocDetails = (state, props) => {

  const doc = state.doc
  let id = _.get(props, 'match.params.id', null)
  if (!id) {
    id = _.get(props, 'docId', null)
  }
  if (!id) {
    return null
  }
  return doc.get(id)
}
export const getDocument = createSelector([getDocDetails], (doc) => doc)
