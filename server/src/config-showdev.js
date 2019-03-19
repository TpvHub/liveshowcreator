import path from 'path'

export const production = process.env.NODE_DEV !== "1"
export const PORT = 3005
export const jwtSecret = 'livex-$-$-$'
export const driveDownloadSecretKey = 'e75c55ec-6476-11e8-adc0-fa7ae01bbebc'
export const backupServicePort = 3006
export const db = {
  url: 'mongodb://localhost:27017',
  name: 'livexshowcreator',
}
export const rootUserObj = {
  firstName: 'Super',
  lastName: 'User',
  email: 'root@livex.tv',
  password: '$2a$10$N5gdY8lir0kkt5JElWZ7JulgJ3T57CLGi54YGm8K.ypQ8adbBO/f6', // livex@2018
  created: new Date(),
  roles: ['root'],
  updated: null,
  teamdriveId: 0
}
export const adminUserObj = {
  firstName: 'LiveX',
  lastName: 'Admin',
  email: 'developer@livex.tv',
  password: '$2a$10$N5gdY8lir0kkt5JElWZ7JulgJ3T57CLGi54YGm8K.ypQ8adbBO/f6', // livex@2018
  created: new Date(),
  roles: ['administrator'],
  updated: null,
  teamdriveId: 0,
}
export const uploadDir = path.join(__dirname, 'storage')

export const url = production
  ? 'https://showdev3.livex.tv'
  : 'http://localhost:3005'
