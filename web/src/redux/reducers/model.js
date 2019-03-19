import { models } from '../../model'
import _ from 'lodash'
import { OrderedMap } from 'immutable'
import { SET_MODEL, DELETE_MODEL } from '../types'

let initState = {}
_.each(models, (model, key) => {
  initState[key] = new OrderedMap()
})

export default (state = initState, action) => {

  const payload = _.get(action, 'payload')
  const modelName = _.get(payload, 'name')
  let models = _.get(action, 'models', [])
  models = Array.isArray(models) ? models : [models]
  let modelOrderedMap = _.get(state, modelName)

  switch (action.type) {

    case SET_MODEL:

      if (modelOrderedMap && models) {
        _.each(models, (model) => {
          modelOrderedMap = modelOrderedMap.set(_.get(model, '_id'), model)
        })
      }
      return {
        ...state,
        [modelName]: modelOrderedMap,
      }

    case DELETE_MODEL:
      if (modelOrderedMap && models) {
        _.each(models, (id) => {
          modelOrderedMap = modelOrderedMap.remove(id)
        })
      }
      return {
        ...state,
        [modelName]: modelOrderedMap,
      }

    default:

      return state

  }
}