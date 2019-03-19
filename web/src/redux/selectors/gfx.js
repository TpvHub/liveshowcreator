import { createSelector } from 'reselect'
import _ from 'lodash'
import { OrderedMap } from 'immutable'

const getGfxByStateProps = (state, props, isInactive = false) => {

  const search = _.toLower(state.gfxSearch)

  const gfx = isInactive ? state.inactiveGfx : state.gfx

  const docId = _.get(props, 'docId')

  let cards = gfx.filter((i) => i.documentId === docId)
  let result = new OrderedMap()

  const removeClassName = (element, className = '') => {
    const elementClassName = element.className
    element.className = _.replace(elementClassName, new RegExp(className, 'g'), '')
  }

  const addClassName = (element, className) => {
    const elementClassName = element.className
    let arr = _.split(elementClassName, ' ')

    arr.push(className)
    arr = _.uniq(arr)

    element.className = _.join(arr, ' ')

  }
  const clearHighlight = () => {

    cards.forEach((card) => {
      _.each(_.get(card, 'elements'), (element) => {
        removeClassName(element, 'gfx-highlight')
        removeClassName(element, 'gfx-hide')
      })
    })
  }

  // clear gfx highlight

  clearHighlight()

  const isMatchTitle = (item, search) => {
    return _.includes(_.toLower(_.get(item, 'data.title')), search)
  }

  const isMatchNote = (item, search) => {
    return _.includes(_.toLower(_.get(item, 'data.body')), search)

  }

  const isMatchAuthor = (item, search) => {
    const fullName = `${_.get(item, 'data.user.firstName', '')} ${_.get(item, 'data.user.lastName', '')}`
    return _.includes(_.toLower(fullName), search)
  }
  const isMatchAssign = (item, search) => {

    const assignName = `${_.get(item, 'data.assign.firstName', '')} ${_.get(item, 'data.assign.lastName', '')}`
    return _.includes(_.toLower(assignName), search)
  }

  const isMatchStatus = (item, search) => {
    return _.includes(_.toLower(_.get(item, 'data.status')), search)
  }

  const isMatchAssetName = (item, search) => {

    let _matchedFilename = false
    const assets = _.get(item, 'data.files', [])
    if (assets.length) {
      assets.forEach((file) => {
        if (_.includes(_.toLower(_.get(file, 'name', '')), search) ||
          _.includes(_.toLower(_.get(file, 'description', '')), search)
        ) {
          _matchedFilename = true

          return true
        }
      })
    }
    return _matchedFilename
  }

  // find gfx by inner text
  const isMatchText = (item, search) => {

    if (isInactive) {
      return false
    }

    const elements = _.get(item, 'elements', [])

    let _matched = false

    if (elements.length) {

      elements.forEach((element) => {
        if (_.includes(_.toLower(element.innerHTML), search)) {
          _matched = true

          return _matched
        }
      })
    }

    return _matched
  }

  if (search !== '') {

    // hide other gfx if is searching mode

    if (!isInactive) {
      cards.forEach((card) => {

        _.each(card.elements, (element) => {
          addClassName(element, 'gfx-hide')
        })
      })
    }

    // if user use @ so we are only search for author
    if (search.charAt(0) === '@' && search.length > 1) {
      const _searchValue = search.slice(1)
      cards.filter((i) => isMatchAssign(i, _searchValue) || isMatchAssign(i, _searchValue)).forEach((item) => {
        result = result.set(item.id, item)
      })

    } else {
      // first we find by Title and get value
      cards.filter((i) => {
        return (isMatchText(i, search) || isMatchTitle(i, search) || isMatchNote(i, search) || isMatchAuthor(i, search) || isMatchStatus(i, search) || isMatchAssetName(i, search) || isMatchAssign(i, search))

      }).forEach((item) => {
        result = result.set(item.id, item)
      })
    }

    if (!isInactive) {
      result.forEach((card) => {

        _.each(_.get(card, 'elements', []), (element) => {

          addClassName(element, 'gfx-highlight')
          removeClassName(element, 'gfx-hide')
        })
      })

    }

    cards = result
  }

  return cards.sortBy((i) => i.index).valueSeq()
}

export const getDocumentGfxItems = createSelector(
  [getGfxByStateProps],
  (items) => items,
)

const _getGFXEdit = (state) => {

  const id = state.gfxEdit

  return state.gfx.get(id) ? id : null
}

export const getGfxEdit = createSelector(
  [_getGFXEdit],
  (gfx) => gfx
)