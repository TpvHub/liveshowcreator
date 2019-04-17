import path from 'path'

export const production = process.env.NODE_DEV !== "1"
export const PORT = 3001
export const jwtSecret = 'tpvhub-$-$-$'
export const driveDownloadSecretKey = 'e75c55ec-6476-11e8-adc0-fa7ae01bbebc'
export const backupServicePort = 3006
export const db = {
  url: 'mongodb://localhost:27017',
  name: 'tpvhub-liveshowcreator',
}
export const rootUser = {
  firstName: 'TpvHub',
  lastName: 'Admin',
  email: 'pvtinh1996@gmail.com',
  password: '$2b$10$I0BNxYF/GSKXZYSXxVV.LeC73d9mESRIHfxcL.7RzGi3l8ntqABI2',
  created: new Date(),
  roles: ['administrator'],
  updated: null,
}

export const uploadDir = path.join(__dirname, 'storage')

export const url = production
  ? 'https://showdev3.tpvhub.net'
  : `http://localhost:${PORT}`
