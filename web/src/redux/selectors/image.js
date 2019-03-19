import { createSelector } from 'reselect'
import _ from 'lodash'

const getImage = (state, props) => {
  const fileId = _.get(props, 'fileId')
  return state.image.files.get(fileId)
}

export const getImageByFileId = createSelector(
  [getImage],
  (u) => u
)