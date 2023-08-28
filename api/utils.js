const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
globalThis.fetch = fetch

const pbURl = process.env.PB_URL

const comparePlayers = (newplayer, target) => {
    const npKeys = Object.keys(newplayer)
    for (let k of npKeys) {
        if (newplayer[k] !== target[k]) {
            return false
        }
    }
    return true
}

module.exports = {
    fetch: fetch,
	pbURl: pbURl,
    comparePlayers: comparePlayers
}