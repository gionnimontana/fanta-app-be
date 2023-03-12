const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const pbURl = process.env.PB_URL

module.exports = {
    fetch: fetch,
	pbURl: pbURl
}