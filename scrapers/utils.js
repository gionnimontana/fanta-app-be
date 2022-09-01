const puppeteer = require('puppeteer')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fetchGraphQL(operationsDoc, operationName, variables) {
    console.log('URL =========> ', process.env.GRAPHQL_URL)
	const result = await fetch(process.env.GRAPHQL_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-hasura-admin-secret': process.env.GRAPHQL_TOKEN
		},
		body: JSON.stringify({
			query: operationsDoc,
			variables: variables,
			operationName: operationName
		})
	})
	return await result.json()
}

module.exports = {
    puppeteer: puppeteer,
    fetchGraphQL: fetchGraphQL
}