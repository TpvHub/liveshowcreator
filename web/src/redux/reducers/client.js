import _ from 'lodash'
import { OrderedMap } from 'immutable'
import {
  DELETE_CLIENT_MODEL,
  SET_CLIENT_MODEL,
  SET_CLIENT_RICH_INFO,
  DELETE_CLIENT_RICH_INFO
} from '../types'

const initState = {
  models: new OrderedMap(),
  filter: {
    limit: 50,
    skip: null,
  },
  search: '',
  clientRichInfo: new OrderedMap(),
}

export default (state = initState, action) => {

  let immutableList = state.models
  let clientRichInfoList = state.clientRichInfo;


  const payload = _.get(action, 'payload')
  switch (action.type) {

    case SET_CLIENT_MODEL:

      let clients = _.get(payload, 'models')
      let filter = _.get(payload, 'filter', state.filter)

      clients = Array.isArray(clients) ? clients : [clients]
      _.each(clients, (model) => {
        immutableList = immutableList.set(_.get(model, '_id'), model)
      })

      return {
        ...state,
        models: immutableList,
        filter: filter,
      }

    case DELETE_CLIENT_MODEL:
      immutableList = immutableList.remove(payload)

      return {
        ...state,
        models: immutableList,
        clientRichInfoList,
      }

    case DELETE_CLIENT_RICH_INFO:
      clientRichInfoList = clientRichInfoList.remove(payload)

      return {
        ...state,
        clientRichInfoList,
      }

    case SET_CLIENT_RICH_INFO:

      let clientRichInfo = state.clientRichInfo

      _.each(payload, (model) => {
        clientRichInfo = clientRichInfo.set(_.get(model, '_id'), model)
      })

      return {
        ...state,
        clientRichInfo
      }

    default:

      return state
  }
}

