const aR = require('./rest')
const u = require('../scripts/utils')

const getAllPlayers = async () => {
    const page1 = await aR.getPB('collections/players_stats/records?perPage=500&page=1')
    const page2 = await aR.getPB('collections/players_stats/records?perPage=500&page=2')
    return [...page1.items, ...page2.items]
}

const getSinglePlayer = async (id) => {
    const requestRaw = await aR.getPB('collections/players_stats/records/' + id)
    return requestRaw.items
}

const getPlayersByIds = async (ids) => {
    const urlParams = ids.map(el => `id='${el}'`).join(' || ')
    const requestRaw = await aR.getPB('collections/players_stats/records?filter=(' + urlParams + ')')
    return requestRaw.items
}

const getTeamPlayers = async (teamId) => {
    const result = await aR.pb.collection('purchases').getList(1, 40, {
        filter: `(team='${teamId}')`,
        expand: 'player',
    });
    return result.items.map(el => el.expand.player)
}

const writePlayer = async (player) => {
    const requestRaw = await aR.postPB(player, 'collections/players_stats/records')
    return requestRaw
}

const writePlayers = async (players) => {
    const currentPlayers = await getAllPlayers()
    const results = []
    for (let p of players) {
        const target = currentPlayers.find(c =>{
            const name = c.name.toLowerCase()
            const team = c.team.toLowerCase()
            return (name === p.name.toLowerCase() && team === p.team.toLowerCase())
        })
        if (target) {
            const r = await aR.patchPB(p, 'collections/players_stats/records/' + target.id)
            results.push(r)
        } else {
            const r = await aR.postPB(p, 'collections/players_stats/records')
            results.push(r)
        }
    }
    return results
}

const writeStats = async (stats) => {
    const day = stats[0].day
    if (!day) throw new Error('WriteStats Error - Day is missing')
    const currentVotes = await getVotesByDay(day)
    const results = []
    for (let s of stats) {
      const target = currentVotes.find(c => c.player_id === s.player_id && c.day === s.day)
      if (target) {
        const r = await aR.patchPB(s, 'collections/players_votes/records/' + target.id)
        results.push(r)
      } else {
        const r = await aR.postPB(s, 'collections/players_votes/records')
        results.push(r)
      }
    }
    return results
  }

const deletePlayer = async (id) => {
    const requestRaw = await aR.deletePB('collections/players_stats/records/' + id)
    return requestRaw
}

const getAllVotes = async () => {
    const requestRaw = await aR.getPB('collections/players_votes/records?perPage=500')
    return requestRaw.items
}

const getVotesByDay = async (day) => {
    const urlParams = `day=${day}`
    const requestRaw = await aR.getPB('collections/players_votes/records?perPage=500&filter=(' + urlParams + ')')
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

const getSingleSquad = async (id) => {
    const requestRaw = await aR.getPB('collections/teams/records/' + id)
    return requestRaw
}

const getAllMatches = async () => {
    const requestRaw = await aR.getPB('collections/calendar/records?perPage=500')
    return requestRaw.items
}

const getMatchByDay = async (day) => {
    const urlParams = `day=${day}`
    const requestRaw = await aR.getPB('collections/calendar/records?filter=(' + urlParams + ')')
    return requestRaw.items
}

const getMatchByDayAndTeam = async (day, teamId) => {
    const matchOfTheDay = await getMatchByDay(day)
    const target = matchOfTheDay.find(m => m.match.includes(teamId))
    return target
}

const getMatchById = async (id) => {
    const requestRaw = await aR.getPB('collections/calendar/records/' + id)
    return requestRaw
}

const writeMatches = async (newMatches) => {
    const currentMatches = await getAllMatches()
    const results = []
    for (let nm of newMatches) {
      const target = (currentMatches || []).find(cm => cm.id === nm.id)
      if (target) {
        const r = await updateMatch(nm, target.id)
        results.push(r)
      } else {
        const r = await aR.postPB(nm, 'collections/calendar/records')
        results.push(r)
      }
    }
    return results
  }

const updateMatch = async (id, values) => {
    const requestRaw = await aR.patchPB(values, 'collections/calendar/records/' + id)
    return requestRaw
}

const updateTeam = async (id, values) => {
    const requestRaw = await aR.patchPB(values, 'collections/teams/records/' + id)
    return requestRaw
}

const writeSquads = async (squads) => {
    const currentSquads = await getAllSquads()
    const results = []
    for (let s of squads) {
      const target = (currentSquads || []).find(c => c.name === s.id)
      if (target) {
        const r = await updateTeam(target.id, s)
        results.push(r)
      } else {
        const r = await aR.postPB(s, 'collections/teams/records')
        results.push(r)
      }
    }
    return results
  }

const deleteTeam = async (id) => {
    const requestRaw = await aR.deletePB('collections/teams/records/' + id)
    return requestRaw
}

const deleteMatch = async (id) => {
    const requestRaw = await aR.deletePB('collections/calendar/records/' + id)
    return requestRaw
}

const getAllTeamMatches = async (teamId) => {
    console.log('match from teamId', teamId)
    const result = await aR.pb.collection('calendar').getList(1, 40, {
        filter: `(match~'${teamId}' && result!='')`
    });
    return result.items
}

const writeTeamScore = async (teamId, score) => {
    return await updateTeam(teamId, {score})
}

const writePurchase = async (playerID, squadID) => {
    const requestRaw = await aR.postPB({
        player: playerID, 
        team: squadID
    }, 'collections/purchases/records')

    return requestRaw
}



module.exports = {
    getAllPlayers: getAllPlayers,
    getSinglePlayer: getSinglePlayer,
    getPlayersByIds: getPlayersByIds,
    getAllVotes: getAllVotes,
    getVotesByDay: getVotesByDay,
    getAllSquads: getAllSquads,
    getSingleSquad: getSingleSquad,
    getAllMatches: getAllMatches,
    getMatchByDay: getMatchByDay,
    getMatchById: getMatchById,
    getMatchByDayAndTeam: getMatchByDayAndTeam,
    getAllTeamMatches: getAllTeamMatches,
    getTeamPlayers: getTeamPlayers,
    writePlayer: writePlayer,
    writePlayers: writePlayers,
    writeStats: writeStats,
    writeSquads: writeSquads,
    writeMatches: writeMatches,
    writeTeamScore: writeTeamScore,
    writePurchase: writePurchase,
    updateMatch: updateMatch,
    updateTeam: updateTeam,
    deletePlayer: deletePlayer,
    deleteVote: deleteVote,
    deleteTeam: deleteTeam,
    deleteMatch: deleteMatch
}