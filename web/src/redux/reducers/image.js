import { ADD_IMAGE_URL_ITEM } from '../types'
import { OrderedMap } from 'immutable'
import _ from 'lodash'

const initState = {
  files: new OrderedMap(),
}

export default (state = initState, action) => {

  let immutableList = state.files

  switch (action.type) {

    case ADD_IMAGE_URL_ITEM:

      const file = _.get(action, 'payload', {});

      immutableList = immutableList.set(file.fileId, file)

      return {
        ...state,
        files: immutableList
      }

    default:

      return state
  }
}
