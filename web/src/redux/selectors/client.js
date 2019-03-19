import { createSelector } from 'reselect'
import _ from 'lodash'

const currentClient = (state) => {
  const app = state.app

  let client = _.get(app, 'currentClient', null)
  let clientId = _.get(client, '_id')
  let _client = state.client.models.get(clientId)
  if (_client) {
    return _client
  }
  return client
}
export const getCurrentClient = createSelector(
  [currentClient],
  (client) => client,
)

const getClientList = (state) => {

  // const filter = state.client.filter
  // we may use filter , search for later.
  return state.client.models.valueSeq()
}
export const getVisibleClients = createSelector(
  [getClientList],
  (models) => models,
)

const getClient = (state, props) => {
  const id = _.get(props, 'match.params.id')
  return state.client.models.get(id)
}

export const getClientById = createSelector(
  [getClient],
  (u) => u
)

const getSearchClient = (state) => {
  return state.clientSearch.valueSeq()
}

export const getClientSearchList = createSelector(
  [getSearchClient],
  (clients) => clients
)

const getClientRichInfo = (state) => {
  return state.client.clientRichInfo.valueSeq()
}

export const getClientRichInfoList = createSelector(
  [getClientRichInfo],
  (clients) => clients
)