import _ from "lodash";

/**
 * Check if the element inside the parent node
 * @param {*} parent 
 * @param {*} child 
 */
export const isDescendant = (parent, child) => {
    var node = child.parentNode;
    while (node !== null) {
        if (node === parent) {
            return true;
        }
        node = node ? node.parentNode : null;
    }
    return false;
}

/**
 * Check if file is video
 * @param file
 * @returns {*|boolean}
 */

export const isVideo = (file) => {

    const videoMimeTypes = [
        'video/mp4',
        'video/quicktime'
    ]
    const mimeType = _.get(file, 'mimeType', null)
    return mimeType && _.includes(videoMimeTypes, mimeType)
}

/**
 * Check if file is image
 * @param file
 * @returns {boolean}
 */

export const isImageFile = (file) => {
    let imagesMineTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/jpg',
        'image/bmp',
    ]

    if (_.includes(imagesMineTypes, _.get(file, 'mimeType'))) {
        return true
    }

    return false
}
