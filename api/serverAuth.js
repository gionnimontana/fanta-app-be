const u = require('./utils')
const apiUrl = process.env.PB_URL + '/api/'

const getUserData = async (userID, userToken) => {
	const completeUrl = apiUrl + 'collections/users/records/' + userID
  let data = null
  try {
    const res = await u.fetch(completeUrl, {
        headers: {
                authorization: 'Bearer ' + userToken
            }
    })
    data = await res.json()
  } catch (e) {
    console.log('@@@ Error in getUserData', e)
  }
  return data
}

module.exports = {
	getUserData: getUserData
}