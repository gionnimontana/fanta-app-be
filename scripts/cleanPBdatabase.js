const aRC = require('../api/restCollection')

const cleanPlayerStats = async () => {
    console.log('Cleaning player_stats collection...')
    const stats = await aRC.getAllPlayers()
    console.log('Found ' + stats.length + ' players')
    const promiseArray = stats.map((s) => {
        return aRC.deletePlayer(s.id)
    })
    const result = await Promise.all(promiseArray)
    return result
}

const cleanPlayerVotes = async () => {
    console.log('Cleaning player_votes collection...')
    const votes = await aRC.getAllVotes()
    console.log('Found ' + votes.length + ' votes')
    const promiseArray = votes.map((v) => {
        return aRC.deleteVote(v.id)
    })
    const result = await Promise.all(promiseArray)
    return result
}

const cleanTeams = async () => {
    console.log('Cleaning teams collection...')
    const teams = await aRC.getAllSquads()
    console.log('Found ' + teams.length + ' teams')
    const promiseArray = teams.map((t) => {
        return aRC.deleteTeam(t.id)
    })
    const result = await Promise.all(promiseArray)
    return result
}

const cleanCalendar = async () => {
    console.log('Cleaning calendar collection...')
    const matches = await aRC.getAllMatches()
    console.log('Found ' + (matches?.length || 'no') + ' matches')
    const promiseArray = (matches || []).map((m) => {
        return aRC.deleteMatch(m.id)
    })
    const result = await Promise.all(promiseArray)
    return result
}

module.exports = {
    cleanPlayerStats: cleanPlayerStats,
    cleanPlayerVotes: cleanPlayerVotes,
    cleanTeams: cleanTeams,
    cleanCalendar: cleanCalendar
}