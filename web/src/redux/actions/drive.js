import { TOGGLE_DRIVE, SET_DRIVE_EDIT_GFX, REFRESH_DRIVE } from '../types'

/**
 * List google drive files
 * @param query
 * @param fields
 * @returns {function(*, *, {service: *, pubSub: *, google: *}): (void|Promise<any>)}
 */
export const listFiles = (query, fields) => {

  return (dispatch, getState, {service, pubSub, google}) => {

    return google.listFiles(query, fields)
  }
}

/**
 * Upload files to google drive
 * @param files
 * @param parentId
 * @param cb
 * @returns {Function}
 */
export const uploadFiles = (files, existingFiles, parentId, cb = () => {}) => {
  return (dispatch, getState, {service, pubSub, google}) => {
    google.upload(files, existingFiles, parentId, cb)
  }
}

export const downloadFile = (fileId) => {

  return (dispatch, getState, {service, pubSub, google}) => {
    return google.download(fileId)
  }

}

export const getDownloadUrl = (fileId, download = false) => {

  return (dispatch, getState, {service, pubSub, google}) => {
    return google.getDownloadUrl(fileId)
  }

}

/**
 * Get drive file info
 * @param fid
 * @returns {Function}
 */


export const getFileInfo = (fid) => {

  return (dispatch, getState, {service, pubSub, google}) => {
    return google.getFileInfo(fid)
  }
}

/**
 * Delete File Drive
 * @param fid
 * @returns {Function}
 */


export const deleteFile = (fid) => {

  return (dispatch, getState, {service, pubSub, google}) => {
    return google.deleteFile(fid)
  }
}

export const toggleDrive = (open = null, extra = null) => {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_DRIVE,
      payload: {
        open: open,
        extra: extra
      }
    })
  }
}

export const refreshDrive = () => {
  return (dispatch) => {
    dispatch({
      type: REFRESH_DRIVE,
      payload: new Date().getTime()
    })
  }
}

export const setDriveEditGfx = (gfx) => {
  return (dispatch) => {
    dispatch({
      type: SET_DRIVE_EDIT_GFX,
      payload: gfx
    })
  }
}

/**
 * Get drive file info
 * @param fid
 * @returns {Function}
 */


/**
 * Handle copy asset if different drive folder
 * @param arFileId
 * @param newFolderId
 * @returns {AxiosPromise<any>}
 */
export const copyFilesToNewFolder = (arFileId, newFolderId) => {

  return (dispatch, getState, {service, pubSub, google}) => {
    return google.copyFilesToNewFolder(arFileId, newFolderId)
  }
}