const aRC = require('../api/restCollection')
const u = require('./utils')

const buildFormation = (sortedRoster) => {
    const goalKeepers =  sortedRoster.filter(el => el.role === 'p')
    const allnonGK = sortedRoster.filter(el => el.role !== 'p')
    const strikers = []
    const midFielders = []
    const defenders = []
    let x = 0

    const calculateMaxStrikers = () => {
      if (midFielders.length === 6) return 1
      return 3
    }

    const calculateMaxMidfielders = () => {
      if (strikers.length === 3 || defenders.length === 5) return 4
      if (strikers.length > 1) return 5
      return 6
    }

    while ([...strikers, ...midFielders, ...defenders].length < 10) {
      const el = allnonGK[x]
      const maxStrikers = calculateMaxStrikers()
      const maxMidfielders = calculateMaxMidfielders()
      if (el.role === 'a' && strikers.length < maxStrikers) strikers.push(el)
      if (el.role === 'c' && midFielders.length < maxMidfielders) midFielders.push(el) 
      if (el.role === 'd' && defenders.length < 5) defenders.push(el)
      x++
      if (x > 25) break
    }
    const starters = [goalKeepers[0], ...defenders, ...midFielders, ...strikers]
    const startersId = starters.map(el => el.id)
    const benchers = allnonGK.reduce((acc, el) => {
      if (acc.length < 10 && !startersId.includes(el.id)) acc.push(el.id)
      return acc
    }, [])
    return {
      s: startersId,
      b: [goalKeepers[1].id, goalKeepers[2].id, ...benchers],
      m: `${defenders.length}${midFielders.length}${strikers.length}`
    }
  }

const getPlayersFormData = (players) => {
    return players.map(p => {
        return {
            fux: u.getPlayerFux(p),
            id: p.id,
            role: p.ruolo
        }
    })
}

const writeTeamFormation = async (team, match, formation) => {
  const teamsIds = match.match.split('-')
  const isHomeTeam = teamsIds[0] === team.id
  const isAwayTeam = teamsIds[1] === team.id
  let values = {}
  const f = JSON.stringify(formation)
  if (isHomeTeam) values.home_form = f
  if (isAwayTeam) values.away_form = f
  const results = await aRC.updateMatch(values, match.id)
  return results
}

const loadSingleAutoFormation = async (teamId, day) => {
    const team = await aRC.getSingleSquad(teamId)
    const playersIds = team.giocatori.split('@')
    const teamPlayers = await aRC.getPlayersByIds(playersIds)
    const playersFormData = getPlayersFormData(teamPlayers)
    const sortedRoster = playersFormData.sort((a, b) => b.fux - a.fux)
    const formation = buildFormation(sortedRoster)
    const targetMatch = await aRC.getMatchByDayAndTeam(day, teamId)
    const results = await writeTeamFormation(team, targetMatch, formation)

    // reduce rate limit on multiple requests (max 10 req/sec)
    await u.sleep(100)

    return results
}

const loadAllTeamsFormationsByDay = async (day) => {
  const teams = await aRC.getAllSquads()
  const teamsIds = teams.map(el => el.id)
  const promises = teamsIds.map((teamId) => loadSingleAutoFormation(teamId, day))
  const results = await Promise.all(promises)
  return results
}

module.exports = {
    byDay: loadAllTeamsFormationsByDay,
    single: loadSingleAutoFormation
}