import MomentJs from 'moment'

export const production = process.env.REACT_APP_DEV !== "1"

export const version = 0.98

export const STATUSES = [
  'To do',
  'Working On',
  'Pending Review',
  'Show Ready',
  'Rejected',
]

export const statusColors = {
  default: {
    background: '#E91E63',
  },
  rejected: {
    background: '#c23616',
  },
  todo: {
    background: '#f45c4b',
  },
  'in-show-engine': {
    background: '#88b172',
  },
  pending: {
    background: '#f7de2f',
  },
  'pending-review': {
    background: '#f7de2f',
  },
  'show-ready': {
    background: '#00b14a',
  },
}
export const editorWidth = 826
export const moment = MomentJs

export const gfxTitleMaxLength = 30

const productionConfig = {
  url: 'https://showdev3.livex.tv',
  api: 'https://showdev3.livex.tv/api',
  webSocketUrl: 'wss://showdev3.livex.tv',
  fileUrl: 'https://showdev3.livex.tv/files',
}
const localIp = '127.0.0.1'
const developmentConfig = {
  url: `http://${localIp}:3005`,
  api: `http://${localIp}:3005/api`,
  webSocketUrl: `ws://${localIp}:3005`,
  fileUrl: `http://${localIp}:3005/files`,
}

export const config = production ? productionConfig : developmentConfig
