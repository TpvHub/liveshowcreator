const clientField = {
  _id: {},
  teamName: {},
  email: {},
  numOfUsers: {},
  numOfUsersOnline: {},
  numOfShows: {},
  driveUsed: {},
  status: {},
}

const clientRegisterFields = {
  _id: {},
  userId: {},
  teamName: {},
  driveFolderId: {},
  planId: {},
  created: {},
  updated: {},
}

const userField = {
  _id: {},
  firstName: {},
  lastName: {},
  avatar: {},
  email: {},
  password: {},
  roles: {},
  status: {},
  created: {},
  updated: {},
}

export const models = {
  user: userField,
  client: clientField,
  newClient: clientRegisterFields,
  user_role: {
    _id: {},
    roleId: {},
    userId: {},
  },
  role: {
    _id: {},
    name: {},
    created: {},
  },
  token: {
    _id: {},
    token: {},
    userId: {},
    created: {},
    user: userField,
  },
}