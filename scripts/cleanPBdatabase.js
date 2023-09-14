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

const removeOutOfGamesRefoundingTeams = async () => {
    console.log('Removing out of game players from player_stats refounding teams...')
    const stats = await aRC.getAllPlayers()
    const leagues = await aRC.getAllLeagues()
    for (let l of leagues) {
        const teamPlayers = await aRC.getTeamPlayersByLeague(l.id)
        const out_of_game = stats.filter(s => s.out_of_game)
        for (let s of out_of_game) {
            const teamPlayerRecords = teamPlayers.filter(tp => tp.player === s.id)
            if (teamPlayerRecords.length > 0) {
                for (let tpr of teamPlayerRecords) {
                    const teamId = tpr.team
                    const team = await aRC.getSingleSquad(teamId)
                    if (team) {
                        const newTeamCredits = team.credits + s.fvm
                        console.log('Removing ' + s.name + ' from team ' + team.name + ' and refounding ' + s.fvm + ' credits')
                        await aRC.updateTeam(teamId, {credits: newTeamCredits})
                        console.log('Deleting ' + s.name + ' from team_players')
                        await aRC.deleteTeamPlayer(tpr.id)
                    }
                }
            }
            console.log('Deleting ' + s.name + ' from player_stats')
            await aRC.deletePlayer(s.id)
        }
    }
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
    cleanCalendar: cleanCalendar,
    removeOutOfGamesRefoundingTeams: removeOutOfGamesRefoundingTeams
}