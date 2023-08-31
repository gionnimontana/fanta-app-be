const u = require('./utils')
const PocketBase = require('pocketbase/cjs')
const pb = new PocketBase(process.env.PB_URL);
const apiUrl = process.env.PB_URL + '/api/'

const tokenWrapper = {
	apiToken: null,
	getToken: async () => {
		if (this.apiToken) return this.apiToken
		const user = process.env.PB_ADMIN_USER
		const password = process.env.PB_ADMIN_PASSWORD
		try {
			await pb.admins.authWithPassword(user, password);
		} catch (e) {
			console.log('@@@ Authentication ERROR:',e)
		}
		this.apiToken = pb.authStore.token
		return this.apiToken
	}
}

async function getPB(url) {
	const completeUrl = apiUrl + url
	console.log('Fetching GET =========> ', completeUrl)
	const result = await u.fetch(completeUrl, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		}
	})
	return await result.json()
}


async function postPB(data, url) {
	const completeUrl = apiUrl + url
	console.log('Fetching POST =========> ', completeUrl)
	try {
		const result = await u.fetch(completeUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': await tokenWrapper.getToken()
			},
			body: JSON.stringify(data)
		})
		return await result.json()
	} catch (error) {
		console.log('Error in postPB', error)
	}
}

async function deletePB(url) {
    const completeUrl = apiUrl + url
    console.log('Fetching DELETE =========> ', completeUrl)
    const result = await u.fetch(completeUrl, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
			'Authorization': await tokenWrapper.getToken()
        }
    })
		return result
}

async function patchPB(data, url) {
	const completeUrl = apiUrl + url
	console.log('Fetching PATCH =========> ', completeUrl)
	const result = await u.fetch(completeUrl, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': await tokenWrapper.getToken()
		},
		body: JSON.stringify(data)
	})
	return await result.json()
}

module.exports = {
	postPB: postPB,
	getPB: getPB,
  	deletePB: deletePB,
	patchPB: patchPB,
	pb: pb
}