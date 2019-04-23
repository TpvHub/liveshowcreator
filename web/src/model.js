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