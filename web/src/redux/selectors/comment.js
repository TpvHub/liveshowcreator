import { createSelector } from 'reselect'
import _ from 'lodash'

const getGfxByStateProps = (state, props) => {

  const comments = state.comment
  const docId = _.get(props, 'docId')
  return comments.filter((i) => i.documentId === docId).sortBy((i) => i.index).valueSeq()
}
export const getDocumentCommentItems = createSelector(
  [getGfxByStateProps],
  (items) => items,
)

const _getSelectedComment = (state) => {
  const commentId = _.get(state.selectedComment, 'id')

  if (commentId) {
    return state.comment.get(commentId)
  }
  return null
}
export const getSelectedComment = createSelector(
  [_getSelectedComment],
  (items) => items,
)