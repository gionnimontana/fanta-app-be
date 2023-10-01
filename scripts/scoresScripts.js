const aRC = require('../api/restCollection')
const u = require('./utils')
const h = require('../helpers/index')

const maxSubstitutions = 5

const getAllFormPlayersIds = (form) => {
    if (!form || !form.s) return []
    if (!form.b) return form.s
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


const calculateFormVotes = (form, votesMap, rolesMap) => {
    if (!form || !form.s || !form.b) return {}
    const { s, b } = form
    const votes = s.reduce((acc, playerId) => {
        acc[playerId] = votesMap[playerId]
        return acc
    }, {})
    const unVotedPlayers = Object.keys(votes).filter(v => !votes[v])
    if (unVotedPlayers.length === 0) return votes
    let subCount = 0
    const benchers = {
        a: b.filter(playerId => rolesMap[playerId] === 'a' && votesMap[playerId]),
        d: b.filter(playerId => rolesMap[playerId] === 'd' && votesMap[playerId]),
        c: b.filter(playerId => rolesMap[playerId] === 'c' && votesMap[playerId]),
        p: b.filter(playerId => rolesMap[playerId] === 'p' && votesMap[playerId]),
    }
    unVotedPlayers.forEach(playerId => {
        if (subCount === maxSubstitutions) return
        const role = rolesMap[playerId]
        const benchCandidates = benchers[role]
        if (benchCandidates && benchCandidates.length > 0) {
            const benchPlayerId = benchCandidates[0]
            votes[benchPlayerId] = votesMap[benchPlayerId]
            benchers[role].shift()
            subCount++
        } else {
            const currentOccupiedRoles = Object.keys(votes).map(id => votesMap[id] && rolesMap[id])
            const addableRoles = getAddableRole(currentOccupiedRoles, role)
            if (addableRoles.length > 0) {
                const firstRole = addableRoles[0]
                const secondRole = addableRoles[1]
                const targetB = benchers[firstRole] || benchers[secondRole]
                if (targetB && targetB.length > 0) {
                    const target = targetB[0]
                    if (target) {
                        const targetRole = rolesMap[target]
                        benchers[targetRole].shift()
                        votes[target] = votesMap[target]
                        subCount++
                    }
                }
            }
        }
    })
    return votes
}

const getAddableRole = (currentRoles, currentMissing) => {
    const addableRoles = []
    const numberA = currentRoles.filter(r => r === 'a').length
    const numberC = currentRoles.filter(r => r === 'c').length
    const numberD = currentRoles.filter(r => r === 'd').length
    const condA = (numberA < 3 && (numberC + numberD) <= 7) || (numberA < 2 && (numberC + numberD) <= 8)
    const condC = (numberC < 6 && (numberD + numberA) <= 4) || (numberC < 5 && (numberD + numberA) <= 5) 
        || (numberC < 4 && (numberD + numberA) <= 6) || (numberC < 3 && (numberD + numberA) <= 7)
    const condD = (numberD < 5 && (numberC + numberA) <= 5) || (numberD < 4 && (numberC + numberA) <= 6)
        || (numberD < 3 && (numberC + numberA) <= 7)
    if (condA) addableRoles.push('a')
    if (condC) addableRoles.push('c')
    if (condD) addableRoles.push('d')
    return addableRoles.filter(r => r !== currentMissing)
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
        result: payload
    })
    
    // reduce rate limit on multiple requests (max 10 req/sec)
    await u.sleep(100)

    return result
}

const calculateMatchesScoresByDay = async (day) => {
    const matches = await aRC.getMatchByDay(day)
    const result = []
    for (const m of matches) {
        const matchScore = await calculateMatchScore(m.id)
        result.push(matchScore)
    }
    return result
}

const allAutomated = async () => {
    const schedule = await aRC.getSortedSchedule()
    const matchDayInProgess = h.isMatchDayInProgess(schedule)
    const matchDayEndedLessThanADayAgo = h.isMatchDayEndedLessThanADayAgo(schedule)
    if (matchDayInProgess || matchDayEndedLessThanADayAgo) {
        console.log('@@@CONDITIONAL-SCRIPT@@@ - calculateMatchesScoresByDay:', matchDayInProgess?.day || matchDayEndedLessThanADayAgo.day)
        return await calculateMatchesScoresByDay(matchDayInProgess?.day || matchDayEndedLessThanADayAgo.day)
    } else {
        console.log('@@@CONDITIONAL-SCRIPT@@@ - calculateMatchesScoresByDay: NO RUN')
    }
}

module.exports = {
    allByDay: calculateMatchesScoresByDay,
    singleByMatch: calculateMatchScore,
    allAutomated: allAutomated,
}

