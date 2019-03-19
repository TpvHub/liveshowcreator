import _ from 'lodash'

export const upload = async (request) => {
  const ctx = request.ctx

  let tokenId = request.header('authorization')
  if (!tokenId) {
    tokenId = _.get(request, 'query.auth', null)
  }
  let token = null
  if (tokenId) {
    try {
      token = await ctx.models.token.verifyToken(tokenId)
    } catch (err) {
      token = null
    }
  }

  request.token = token

  let files = []
  let error = null

  try {
    files = await ctx.models.file.upload(request)
  }
  catch (err) {
    error = err
    files = []
  }

  return new Promise((resolve, reject) => {
    return error ? reject(error) : resolve(files)
  })

}