const aRC = require('../api/restCollection')
const u = require('./utils')
const h = require('../helpers')

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
      if (x > sortedRoster.length) break
    }
    const starters = [goalKeepers[0], ...defenders, ...midFielders, ...strikers]
    const startersId = starters.map(el => el.id)
    const benchers = allnonGK.reduce((acc, el) => {
      if (acc.length < 10 && !startersId.includes(el.id)) acc.push(el.id)
      return acc
    }, [])
    return {
      s: startersId,
      b: [goalKeepers[1].id, ...benchers],
      m: `${defenders.length}${midFielders.length}${strikers.length}`
    }
  }

const getPlayersFormData = (players) => {
    return players.map(p => {
        return {
            fux: u.getPlayerFux(p),
            id: p.id,
            role: p.role
        }
    })
}

const writeTeamFormation = async (team, match, formation) => {
  const teamsIds = match.match.split('-')
  const isHomeTeam = teamsIds[0] === team.id
  const isAwayTeam = teamsIds[1] === team.id
  let values = {}
  if (isHomeTeam) values.home_form = formation
  if (isAwayTeam) values.away_form = formation
  const results = await aRC.updateMatch(match.id, values)
  return results
}

const loadSingleAutoFormation = async (team, day, purchases) => {
    const teamId = team.id
    const targetMatch = await aRC.getMatchByDayAndTeam(day, teamId)
    const teamPlayers = await aRC.getTeamPlayers(teamId)

    const needFormation = await teamNeedFormationUpdate(team, targetMatch, purchases)
    if (!needFormation) return `loadformation NO RUN for team ${team.name}`

    const nonLeavingPlayers = getNonLeavingPlayers(teamPlayers, purchases)
    const playersFormData = getPlayersFormData(nonLeavingPlayers)
    const sortedRoster = playersFormData.sort((a, b) => b.fux - a.fux)
    const formation = buildFormation(sortedRoster)
    const results = await writeTeamFormation(team, targetMatch, formation)

    // reduce rate limit on multiple requests (max 10 req/sec)
    await u.sleep(1000)

    return results
}

const teamNeedFormationUpdate = async (team, targetMatch, purchases) => {
  if (team.auto_formation) return true
  const formation = await getTargetTeamFormation(team, targetMatch)
  if (!formation) return true
  const teamLeavingPlayers = purchases.filter(p => p.from_team === team.id)
  const haveLeavingPlayers = await formationHaveLeavingPlayers(formation, teamLeavingPlayers)
  return haveLeavingPlayers
}

const getTargetTeamFormation = async (team, match) => {
  const isHome = match?.match.split('-') === team.id
  if (isHome) return match.home_form
  return match.away_form
}

const formationHaveLeavingPlayers = async (formation, leavingPlayers) => {
  const leavingPlayersIds = leavingPlayers.map(lp => lp.player)
  const allPlayersIds = [...formation.b, ...formation.s]
  const target = Boolean(allPlayersIds.find(p => leavingPlayersIds.includes(p)))
    return target
}

const getNonLeavingPlayers = (teamPlayers, purchases) => {
  const leavingPlayersIds = purchases.map(p => p.player)
  const filteredPlayers = teamPlayers.filter(p => !leavingPlayersIds.includes(p.id))
  return filteredPlayers
}

const loadAllTeamsFormationsByDay = async (day) => {
  const teams = await aRC.getAllSquads()
  const openValidPurchases = await aRC.getAllOpeValidatedPurchases()
  const results = []
  for (const t of teams) {
    const res = await loadSingleAutoFormation(t, day, openValidPurchases.items)
    results.push(res)
  }
}

const allAutomated = async () => {
  const schedule = await aRC.getSortedSchedule()
  const nowTS = new Date().getTime()
  const currentMatch = h.getCurrentMatchDay(schedule)
  const matchDayHasStarted = new Date(currentMatch.start).getTime() < nowTS
  if (!matchDayHasStarted) {
      console.log('@@@CONDITIONAL-SCRIPT@@@ - loadAllTeamsFormationsByDay:', currentMatch.day)
      return await loadAllTeamsFormationsByDay(currentMatch.day)
  } else {
    console.log('@@@CONDITIONAL-SCRIPT@@@ - loadAllTeamsFormationsByDay: NO RUN')
  }
}

module.exports = {
    byDay: loadAllTeamsFormationsByDay,
    single: loadSingleAutoFormation,
    allAutomated: allAutomated
}