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

const getAllSquads = async () => {
    const requestRaw = await aR.getPB('collections/teams/records?perPage=500')
    return requestRaw.items
}

const getAllMatches = async () => {
    const requestRaw = await aR.getPB('collections/calendar/records?perPage=500')
    return requestRaw.items
}

const writeMatches = async (newMatches) => {
    const currentMatches = await getAllMatches()
    const promiseArray = newMatches.map((nm) => {
        const target = (currentMatches || []).find(cm => cm.id === nm.id)
        if (target) {
            return aR.patchPB(nm, 'collections/calendar/records/' + target.id)
        } 
        return aR.postPB(nm, 'collections/calendar/records')
    })
    const result = await Promise.all(promiseArray)
    return result
}

const writeSquads = async (squads) => {
    const currentSquads = await getAllSquads()
    const promiseArray = squads.map((s) => {
        const target = (currentSquads || []).find(c => c.name === s.id)
        if (target) {
            return aR.patchPB(s, 'collections/teams/records/' + target.id)
        } 
        return aR.postPB(s, 'collections/teams/records')
    })
    const result = await Promise.all(promiseArray)
    return result
}

const deleteTeam = async (id) => {
    const requestRaw = await aR.deletePB('collections/teams/records/' + id)
    return requestRaw
}

const deleteMatch = async (id) => {
    const requestRaw = await aR.deletePB('collections/calendar/records/' + id)
    return requestRaw
}

module.exports = {
    getAllPlayers: getAllPlayers,
    getSinglePlayer: getSinglePlayer,
    getAllVotes: getAllVotes,
    getAllSquads: getAllSquads,
    getAllMatches: getAllMatches,
    writePlayer: writePlayer,
    writePlayers: writePlayers,
    writeStats: writeStats,
    writeSquads: writeSquads,
    writeMatches: writeMatches,
    deletePlayer: deletePlayer,
    deleteVote: deleteVote,
    deleteTeam: deleteTeam,
    deleteMatch: deleteMatch
}