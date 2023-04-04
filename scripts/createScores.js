const aRC = require('../api/restCollection')
const u = require('./utils')

const getAllFormPlayersIds = (formRaw) => {
    const form = JSON.parse(formRaw)
    return [...form.s, ...form.b]
}

const getAllPlayersIds = (match) => {
    const { home_form, away_form } = match
    const homePlayersIds = getAllFormPlayersIds(home_form)
    const awayPlayersIds = getAllFormPlayersIds(away_form)
    return [...homePlayersIds, ...awayPlayersIds]
}
 
const getMatchPlayerVotesMap = (allPlayersIds, votes) => {
    const targetVotes = votes.filter(v => allPlayersIds.includes(v.player_id))
    const playersVotesMap = allPlayersIds.reduce((acc, playerId) => {
        const targetVote = targetVotes.find(v => v.player_id === playerId)
        acc[playerId] = targetVote ? targetVote.fvote : undefined
        return acc
    }, {})
    return playersVotesMap
}

const getPlayersRolesMap = async (allPlayersIds) => {
    const middleIndex = Math.ceil(allPlayersIds.length / 2);
    const firstHalf = allPlayersIds.splice(0, middleIndex);   
    const secondHalf = allPlayersIds.splice(-middleIndex);
    const firstPlayerBatch = await aRC.getPlayersByIds(firstHalf)
    const secondPlayerBatch = await aRC.getPlayersByIds(secondHalf)
    const players = [...firstPlayerBatch, ...secondPlayerBatch]
    const playersRolesMap = players.reduce((acc, p) => {
        acc[p.id] = p.role
        return acc
    }, {})
    return playersRolesMap
}


const calculateFormVotes = (formRaw, votesMap, rolesMap) => {
    const form = JSON.parse(formRaw)
    const { s, b, m } = form
    const votes = s.reduce((acc, playerId) => {
        acc[playerId] = votesMap[playerId]
        return acc
    }, {})
    const unVotedPlayers = Object.keys(votes).filter(v => votesMap[v] === undefined)
    if (unVotedPlayers.length === 0) return votes
    let subCount = 0
    const benchers = {
        a: b.filter(playerId => rolesMap[playerId] === 'a' && votesMap[playerId] !== undefined),
        d: b.filter(playerId => rolesMap[playerId] === 'd' && votesMap[playerId] !== undefined),
        c: b.filter(playerId => rolesMap[playerId] === 'c' && votesMap[playerId] !== undefined),
        p: b.filter(playerId => rolesMap[playerId] === 'p' && votesMap[playerId] !== undefined),
    }
    unVotedPlayers.forEach(playerId => {
        if (subCount === 5) return
        const role = rolesMap[playerId]
        const benchCandidates = benchers[role]
        if (benchCandidates.length > 0) {
            const benchPlayerId = benchCandidates[0]
            votes[benchPlayerId] = votesMap[benchPlayerId]
            benchers[role].shift()
            subCount++
        } 
    })
    return votes
}

const calculateScore = (votes) => {
    const values = Object.values(votes)
    const sum = values.reduce((acc, v) => {
        acc += v || 0
        return acc
    }, 0)
    const goals = Math.floor((sum - 60) / 6)
    return goals < 0 ? 0 : goals
}

const calculateMatchScore = async (matchId) => {
    const match = await aRC.getMatchById(matchId)
    const { home_form, away_form, day } = match
    const allVotes = await aRC.getVotesByDay(day)
    const playersIds = getAllPlayersIds(match)
    const playersVotesMap = getMatchPlayerVotesMap(playersIds, allVotes)
    const playersRolesMap = await getPlayersRolesMap(playersIds)
    const homeVotes = calculateFormVotes(home_form, playersVotesMap, playersRolesMap)
    const awayVotes = calculateFormVotes(away_form, playersVotesMap, playersRolesMap)
    const payload = {
        home: homeVotes,
        away: awayVotes,
        score: {
            home: calculateScore(homeVotes),
            away: calculateScore(awayVotes)
        }
    }
    const result = await aRC.updateMatch(matchId, {
        result: JSON.stringify(payload)
    })
    
    // reduce rate limit on multiple requests (max 10 req/sec)
    await u.sleep(100)

    return result
}

const calculateMatchesScoresByDay = async (day) => {
    const matches = await aRC.getMatchByDay(day)
    const promiseArray = matches.map((m) => {
        return calculateMatchScore(m.id)
    })
    const result = await Promise.all(promiseArray)
    return result
}

module.exports = {
    allByDay: calculateMatchesScoresByDay,
    singleByMatch: calculateMatchScore
}

