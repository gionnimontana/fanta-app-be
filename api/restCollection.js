const aR = require('./rest')
const u = require('./utils')

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
    const result = await aR.pb.collection('players_stats').getList(1, 60, {
        filter: `(fanta_team='${teamId}')`,
    });
    return result.items
}

const updatePlayer = async (id, values) => {
    const requestRaw = await aR.patchPB(values, 'collections/players_stats/records/' + id)
    return requestRaw
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
            return (name === p.name.toLowerCase())
        })
        if (target) {
            const playersAreEqual = u.comparePlayers(p, target)
            if (!playersAreEqual) {
                const r = await aR.patchPB(p, 'collections/players_stats/records/' + target.id)
                results.push(r)
            }
        } else {
            if (!p.out_of_game) {
                const r = await aR.postPB(p, 'collections/players_stats/records')
                results.push(r)
            }
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
        if (Number(target.fvote) !== Number(s.fvote)) {
            const r = await aR.patchPB(s, 'collections/players_votes/records/' + target.id)
            results.push(r)
        }
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

const writeSquads = async (squads, players) => {
    const resultsPurchases = []
    const resultsSquads = []
    for (let s of squads) {
        for (let p of s.players) {
            const r = await aR.patchPB({fanta_team: s.id}, 'collections/players_stats/records/' + p)
            resultsPurchases.push(r)
        }
        const rs = await updateTeam(s.id, {credits: s.credits})
        resultsSquads.push(rs)
    }
    return [resultsPurchases, resultsSquads]
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

const getSortedSchedule = async () => {
    const result = await aR.pb.collection('schedules').getList(1, 40, {
        sort: 'day'
    });
    return result.items
}

const writeTeamScore = async (teamId, score) => {
    return await updateTeam(teamId, {score})
}

const writePurchase = async (playerID, fromsquad, tosquad, price, maxprice) => {
    const requestRaw = await aR.postPB({
        player: playerID,
        from_team: fromsquad,
        to_team: tosquad,
        price: price,
        max_price: maxprice,
        league: 'ernyanuus7tdszx',
    }, 'collections/purchases/records')

    return requestRaw
}

const getArticleByDay = async (day) => {
    const urlParams = `day=${day}`
    const requestRaw = await aR.getPB('collections/articles/records?filter=(' + urlParams + ')')
    return requestRaw.items   
}

const writeArticle = async (day, title, content, category) => {
    const existingArticle = await getArticleByDay(day)
    const sameCategoryArticle = existingArticle.find(a => a.category === category)
    if (sameCategoryArticle) {
        const res = await aR.patchPB({
            title,
            content
        }, 'collections/articles/records/' + sameCategoryArticle.id)
        return res
    } else {
        const res = await aR.postPB({
            day,
            title,
            content,
            category,
            league: "ernyanuus7tdszx"
        }, 'collections/articles/records')
        return res
    }
}

const getPurchaseByTeam = async (teamId) => {
    const urlParams = `team='${teamId}'`
    const requestRaw = await aR.getPB('collections/purchases/records?filter=(' + urlParams + ')')
    return requestRaw.items
}

const getSinglePurchase = async (id) => {
    const requestRaw = await aR.getPB('collections/purchases/records/' + id )
    return requestRaw
}

const getAllPurchases = async () => {
    const requestRaw = await aR.getPB('collections/purchases/records?perPage=500&filter=(closed=false)')
    return requestRaw.items
}

const updatePurchase = async (id, values) => {
    const requestRaw = await aR.patchPB(values, 'collections/purchases/records/' + id)
    return requestRaw
}

const getAllOpenPurchases = async () => {
    const requestRaw = await aR.getPB('collections/purchases/records?perPage=500&filter=(closed=false)')
    return requestRaw.items
}

module.exports = {
    getAllPlayers: getAllPlayers,
    getSinglePlayer: getSinglePlayer,
    getPlayersByIds: getPlayersByIds,
    getPurchaseByTeam: getPurchaseByTeam,
    getSinglePurchase: getSinglePurchase,
    getAllPurchases: getAllPurchases,
    getAllOpenPurchases: getAllOpenPurchases,
    getAllVotes: getAllVotes,
    getArticleByDay: getArticleByDay,
    getVotesByDay: getVotesByDay,
    getAllSquads: getAllSquads,
    getSingleSquad: getSingleSquad,
    getAllMatches: getAllMatches,
    getMatchByDay: getMatchByDay,
    getMatchById: getMatchById,
    getMatchByDayAndTeam: getMatchByDayAndTeam,
    getAllTeamMatches: getAllTeamMatches,
    getTeamPlayers: getTeamPlayers,
    getSortedSchedule: getSortedSchedule,
    writeArticle: writeArticle,
    writePlayer: writePlayer,
    writePlayers: writePlayers,
    writeStats: writeStats,
    writeSquads: writeSquads,
    writeMatches: writeMatches,
    writeTeamScore: writeTeamScore,
    writePurchase: writePurchase,
    updateMatch: updateMatch,
    updateTeam: updateTeam,
    updatePlayer: updatePlayer,
    updatePurchase: updatePurchase,
    deletePlayer: deletePlayer,
    deleteVote: deleteVote,
    deleteTeam: deleteTeam,
    deleteMatch: deleteMatch
}