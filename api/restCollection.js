const aR = require('./rest')

const getAllPlayers = async () => {
    const page1 = await aR.getPB('collections/players_stats/records?perPage=500&page=1')
    const page2 = await aR.getPB('collections/players_stats/records?perPage=500&page=2')
    return [...page1.items, ...page2.items]
}

const getSinglePlayer = async (id) => {
    const requestRaw = await aR.getPB('collections/players_stats/records/' + id)
    return requestRaw.items
}

const writePlayer = async (player) => {
    const requestRaw = await aR.postPB(player, 'collections/players_stats/records')
    return requestRaw
}

const writePlayers = async (players) => {
    const currentPlayers = await getAllPlayers()
    const promiseArray = players.map((p) => {
        const target = currentPlayers.find(c => c.giocatore === p.giocatore && c.squadra === p.squadra)
        if (target) {
            return aR.patchPB(p, 'collections/players_stats/records/' + target.id)
        }
        return aR.postPB(p, 'collections/players_stats/records')
    })
    const result = await Promise.all(promiseArray)
    return result
}

const writeStats = async (stats) => {
    const currentVotes = await getAllVotes()
    const promiseArray = stats.map((s) => {
        const target = currentVotes.find(c => c.player_id === s.player_id && c.giornata === s.giornata)
        if (target) {
            return aR.patchPB(s, 'collections/players_votes/records/' + target.id)
        }
        return aR.postPB(s, 'collections/players_votes/records')
    })
    const result = await Promise.all(promiseArray)
    return result
}

const deletePlayer = async (id) => {
    const requestRaw = await aR.deletePB('collections/players_stats/records/' + id)
    return requestRaw
}

const getAllVotes = async () => {
    const requestRaw = await aR.getPB('collections/players_votes/records?perPage=750')
    return requestRaw.items
}

const deleteVote = async (id) => {
    const requestRaw = await aR.deletePB('collections/players_votes/records/' + id)
    return requestRaw
}

module.exports = {
    getAllPlayers: getAllPlayers,
    getSinglePlayer: getSinglePlayer,
    getAllVotes: getAllVotes,
    writePlayer: writePlayer,
    writePlayers: writePlayers,
    writeStats: writeStats,
    deletePlayer: deletePlayer,
    deleteVote: deleteVote
}