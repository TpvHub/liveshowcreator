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

const localIp = '127.0.0.1'

const productionConfig = {
  url: localIp,
  api: '/api',
  webSocketUrl: 'wss://127.0.0.1',
  fileUrl: '/files',
}

const SERVER_PORT = 3001
const developmentConfig = {
  url: `http://${localIp}:${SERVER_PORT}`,
  api: `http://${localIp}:${SERVER_PORT}/api`,
  webSocketUrl: `ws://${localIp}:${SERVER_PORT}`,
  fileUrl: `http://${localIp}:${SERVER_PORT}/files`,
}

export const config = production ? developmentConfig : developmentConfig
// export const config = production ? productionConfig : developmentConfig
