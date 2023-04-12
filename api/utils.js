const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
globalThis.fetch = fetch
const pbURl = process.env.PB_URL

module.exports = {
    fetch: fetch,
	pbURl: pbURl
}