import _ from 'lodash'
import { CONTEXT_HIDE, CONTEXT_SHOW } from '../types'

const defaultMenu = [
  {
    label: 'Add GFX',
    key: 'add_gfx'
  },
  {
    label: 'Add Comment',
    key: 'add_comment'
  }
]
const initState = {
  show: false,
  position: null,
  selection: null,
  menu: [],
  quill: null,
  bound: null,
  containerBound: null

}
export default (state = initState, action) => {

  switch (action.type) {

    case CONTEXT_SHOW:

      const menu = _.get(action, 'payload.menu', null)
      return {
        ...state,
        quill: _.get(action, 'payload.quill', null),
        show: true,
        position: _.get(action, 'payload.position'),
        menu: menu ? menu : defaultMenu,
        selection: _.get(action, 'payload.selection', null),
        bound: _.get(action, 'payload.bound', null),
        containerBound: _.get(action, 'payload.containerBound', null),
        whereNeedToShow: _.get(action, 'payload.whereNeedToShow', null)
      }

    case CONTEXT_HIDE:

      return {
        ...state,
        show: false
      }

    default:

      return state
  }
}