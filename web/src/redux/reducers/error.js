import { EventEmitter } from 'fbemitter'
import { ERROR } from '../types'

export default (state = new EventEmitter(), action) => {

  switch (action.type) {

    case ERROR:

      state.emit('onError', action.payload)

      return state

    default:

      return state
  }
}