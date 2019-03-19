import _ from 'lodash'
import {
  DELETE_INACTIVE_GFX,
  GFX_SEARCH,
  ON_REMOVE_FORMAT,
  ON_SUBMIT_ADD_GFX_CARD,
  SET_GFX_ITEMS,
  SET_INACTIVE_GFX,
  EDIT_GFX
} from '../types'
import { updateDocument } from './doc'
import { toggleInactiveGfxList } from './sidebar';

/**
 * Update or Add gfx card
 * @param payload
 * @param selection
 * @returns {Function}
 */
export const updateGfxCard = (payload, selection) => {
  return (dispatch, getState) => {
    const state = getState()
    const event = state.event

    event.emit(ON_SUBMIT_ADD_GFX_CARD, {
      payload: payload,
      range: selection
    })
  }
}

/**
 * Reactive gfx card
 * @param payload
 * @param selection
 * @returns {Function}
 * @constructor
 */

export const ReactiveInactiveGfxCard = (payload, selection) => {

  return (dispatch, getState) => {

    dispatch(updateGfxCard(payload, selection))

    // delete that inactive gfx
    dispatch(deleteInactiveGfx(payload.id))

    // change to CUES tab
    dispatch(toggleInactiveGfxList(false))

    //let select and edit mode
    dispatch({
      type: EDIT_GFX,
      payload: _.get(payload, 'id'),
    })
  }
}

/**
 * Set gfx items
 * @param items
 * @returns {Function}
 */
export const setGfxItems = (items) => {
  return (dispatch) => {
    dispatch({
      type: SET_GFX_ITEMS,
      payload: items
    })
  }
}

/**
 * Search gfx
 * @param search
 * @returns {Function}
 */

export const searchGfx = (search) => {
  return (dispatch) => {

    dispatch({
      type: GFX_SEARCH,
      payload: _.trim(search)
    })
  }
}

/**
 * Remove gfx item
 * @param id
 * @returns {Function}
 */

export const removeGfxById = (id) => {
  return (dispatch, getState) => {
    const state = getState()
    const gfx = state.gfx.get(id)
    if (gfx) {
      const event = state.event
      const payload = {
        selection: {
          index: _.get(gfx, 'index'),
          length: _.get(gfx, 'length'),
        },
        format: 'livex',
        source: 'user',
      }
      event.emit(ON_REMOVE_FORMAT, payload)
    }
  }
}

/**
 * Set inactive gfx
 * @param id
 * @returns {Function}
 */

export const setInactiveGfx = (id) => {

  return (dispatch, getState, {service, pubSub}) => {

    const state = getState()

    const gfx = state.gfx.get(id)

    const docId = _.get(gfx, 'documentId')

    const data = {
      data: _.get(gfx, 'data'),
      documentId: docId,
      id: _.get(gfx, 'id')
    }

    // send via pubsub
    pubSub.broadcast(`doc/${docId}/gfx/inactive`, {
      type: 'set',
      payload: data
    })

    dispatch({
      type: SET_INACTIVE_GFX,
      payload: [data]
    })

    // then remove gfx from active list
    dispatch(removeGfxById(id))

  }
}

/**
 * Delete inactive gfx
 * @param id
 * @returns {Function}
 */

export const deleteInactiveGfx = (id) => {

  return (dispatch, getState, {service, pubSub}) => {

    const state = getState()

    const inactiveGfx = state.inactiveGfx.get(id)

    const docId = inactiveGfx.documentId

    const list = []

    state.inactiveGfx.filter((i) => i.documentId === docId && i.id !== id).forEach((item) => {
      list.push(item)
    })

    dispatch({
      type: DELETE_INACTIVE_GFX,
      payload: id
    })

    // then update document
    dispatch(updateDocument({
      _id: docId,
      inactiveGfx: JSON.stringify(list)
    }, {
      skipUpdateInactiveGfx: true
    }))

    // send via pubsub
    pubSub.broadcast(`doc/${docId}/gfx/inactive`, {
      type: 'delete',
      payload: id
    })

  }
}

/**
 * Update inactive gfx
 * @param data
 * @returns {Function}
 */
export const updateInactiveGfxItem = (data) => {
  return (dispatch, getState, {service, pubSub}) => {
    dispatch({
      type: SET_INACTIVE_GFX,
      payload: [data]
    })

    const docId = data.documentId
    const list = []

    getState().inactiveGfx.filter((i) => i.documentId === docId).forEach((item) => {
      list.push(item)
    })

    dispatch(updateDocument({
      _id: docId,
      inactiveGfx: JSON.stringify(list)
    }, {
      skipUpdateInactiveGfx: true
    }))

    // send via pubsub
    pubSub.broadcast(`doc/${docId}/gfx/inactive`, {
      type: 'set',
      payload: data
    })

  }
}

