import { combineReducers } from 'redux'
import model from './model'
import app from './app'
import drawer from './drawer'
import doc from './doc'
import event from './event'
import sidebar from './sidebar'
import client from './client'
import user from './user'
import userSearch from './user-search'
import gfx from './gfx'
import inactiveGfx from './inactive-gfx'
import comment from './comment'
import gfxEdit from './gfx-edit'
import inactiveGfxEdit from './inactive-gfx-edit'
import selectedComment from './selected-comment'
import gfxSearch from './gfx-search'
import context from './context'
import error from './error'
import docCount from './doc-count'
import backup from './backup'
import quill from './quill'
import layout from './layout'
import message from './message'
import documentPermission from './document-permission'
import toggleGfx from './toggle-gfx'
import lineSpacing from './line-spacing'
import docNavigation from './navigation'
import notification from './notification'
import image from './image'
import drive from './drive'
import miniPlayer from './mini-player'
import cinemaView from './cinema-view'
import loadingDialog from './loadingDialog'

export default combineReducers({
  model,
  app,
  drawer,
  doc,
  docCount,
  event,
  sidebar,
  client,
  user,
  userSearch,
  gfx,
  comment,
  selectedComment,
  gfxEdit,
  inactiveGfxEdit,
  backup,
  gfxSearch,
  context,
  error,
  inactiveGfx,
  quill,
  layout,
  message,
  documentPermission,
  toggleGfx,
  lineSpacing,
  docNavigation,
  notification,
  image,
  drive,
  miniPlayer,
  cinemaView,
  loadingDialog,
})
