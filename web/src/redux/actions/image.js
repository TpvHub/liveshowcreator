// import _ from 'lodash'
import {
  ADD_IMAGE_URL_ITEM
} from '../types'

/**
 * Set Image Url With file Id (Mapping)
 * @param item
 * @returns {Function}
 */
export const setImageUrlWithFileId = (item) => {
  return (dispatch) => {
    dispatch({
      type: ADD_IMAGE_URL_ITEM,
      payload: {
        ...item
      }
    })
  }
}
