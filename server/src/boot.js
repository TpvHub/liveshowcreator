import { rootUser } from './config'
import _ from 'lodash'

export default async (ctx) => {

  let administratorRole = await ctx.models.role.findOne(
    {name: 'administrator'})
  let defaultUser = await ctx.models.user.findOne({email: rootUser.email})

  if (defaultUser) {
    // let update roles administrator
    let roles = _.get(defaultUser, 'roles', [])
    if (roles === null) {
      roles = []
    }
    roles.push('administrator')
    roles = _.uniq(roles)
    // let update user
    await ctx.models.user.updateUserRoles(defaultUser._id, roles)
  }
  if (administratorRole === null) {
    // create role
    administratorRole = await ctx.models.role.save(null,
      {name: 'administrator'})
  }

  // check and create new role is staff
  let staffRole = await ctx.models.role.findOne({
    name: 'staff',
  })

  if (staffRole === null) {
    await ctx.models.role.save(null, {
      name: 'staff',
    })
  }

  if (administratorRole && defaultUser === null) {
    // create default user;
    await ctx.models.user.insertOne(rootUser)

  }

}