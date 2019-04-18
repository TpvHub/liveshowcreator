import { rootUser } from './config'
import { composePromise } from './utils/common'
import _ from 'lodash'

const checkExistRole = ({ role: roleName, ctx }) => new Promise(async (rs, rj) => {
  ctx.models.role.findOne({
    name: roleName,
  }).then(role => {
    rs({ ctx, isRoleExist: role !== null, roleName })
  }).catch(rj)
})

const createNewRole = ({ ctx, isRoleExist, roleName }) => new Promise(async (rs, rj) => {
  if (isRoleExist) rs(true)
  else {
    try {
      await ctx.models.role.save(null, {
        name: roleName,
      })
      rs(ctx)
    } catch(err) {
      rj(err)
    }
  }
})

export default async (ctx) => {

  try {
    await Promise.all(
      ['administrator', 'staff', 'client', 'user'].map(role => composePromise(
        createNewRole,
        checkExistRole
      )({ ctx, role }))
    )

    let defaultUser = await ctx.models.user.findOne({ email: rootUser.email })

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
    } else {
      // create default user;
      await ctx.models.user.insertOne(rootUser)
    }

  } catch (err) {
    console.log('Boot ERROR: ', err.message, err)
  }

}