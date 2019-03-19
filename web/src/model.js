const userField = {
  _id: {},
  firstName: {},
  lastName: {},
  avatar: {},
  email: {},
  password: {},
  created: {},
  updated: {},
  roles: {}
}

export const models = {
  user: userField,
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