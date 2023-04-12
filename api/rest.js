const u = require('./utils')
const PocketBase = require('pocketbase/cjs')
const pb = new PocketBase(process.env.PB_URL);
const apiUrl = process.env.PB_URL + '/api/'

async function postPB(data, url) {
    const completeUrl = apiUrl + url
    console.log('Fetching POST =========> ', completeUrl)
	try {
		const result = await u.fetch(completeUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data)
		})
		return await result.json()
	} catch (error) {
		console.log('Error in postPB', error)
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

async function deletePB(url) {
    const completeUrl = apiUrl + url
    console.log('Fetching DELETE =========> ', completeUrl)
    const result = await u.fetch(completeUrl, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    return await result.json()
}

async function patchPB(data, url) {
	const completeUrl = apiUrl + url
	console.log('Fetching PATCH =========> ', completeUrl)
	const result = await u.fetch(completeUrl, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
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