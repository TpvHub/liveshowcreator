import { EventEmitter } from 'fbemitter'
import { EVENT_EMIT } from '../types'
import _ from 'lodash'

const initState = new EventEmitter()
export default (state = initState, action) => {

  switch (action.type) {

    case EVENT_EMIT:

      const payload = action.payload

      state.emit(_.get(payload, 'event'), _.get(payload, 'message'))
      return state

    default:

      return state
  }
}