const u = require('./utils')
const apiUrl = process.env.PB_URL + '/api/'

const getAuthenticatedSquad = async (req, res) => {
  try {
  const body = req.body
  const userID = body.userID
  const userToken = req.headers.authorization

	const completeUrl = apiUrl + 'collections/users/records/' + userID

  let user = null
    const res = await u.fetch(completeUrl, {
        headers: {
                authorization: 'Bearer ' + userToken
            }
    })
    user = await res.json()

    if (!user?.team) throw new Error('Invalid token, no team found for user ' + userID)

    return user.team

  } catch (e) {
    res.status(401).send(e.message)
    return null
  }

}

const safeServerResponse = (res, data) => {
  try {
    if (res.statusCode > 300) return
    res.send(JSON.stringify({...data, ok: true }))
  } catch (e) {}
}

module.exports = {
	getAuthenticatedSquad: getAuthenticatedSquad,
  safeServerResponse: safeServerResponse
}