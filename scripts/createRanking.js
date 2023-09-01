const aRC = require('../api/restCollection')
const { sleep } = require('./utils')
const h = require('../helpers/index')

const calculateTeamRanking = async (teamId) => {
    const matches = await aRC.getAllTeamMatches(teamId)
    const dailyScore = matches.reduce((acc, m) => {
        const result = JSON.parse(m.result)
        const isHome = m.match.split('-')[0] === teamId
        const votes = isHome ? result.home : result.away
        const votesSum = Object.values(votes).reduce((acc, v) => acc + v, 0) 
        const gf = isHome ? result.score.home : result.score.away
        const ga = isHome ? result.score.away : result.score.home
        const pts = gf - ga < 0 ? 0 : gf - ga === 0 ? 1 : 3
        acc.push({
            gf,
            ga,
            pts,
            vs: votesSum
        })
        return acc
    }, [])
    const globalScore = dailyScore.reduce((acc, d) => {
        acc.gf += d.gf
        acc.ga += d.ga
        acc.pts += d.pts
        acc.vs += d.vs
        if (d.pts === 3) {
            acc.w += 1
        } else if (d.pts === 1) {
            acc.d += 1
        } else {
            acc.l += 1
        }
        return acc
    }, { gf: 0, ga: 0, pts: 0, w: 0, d: 0, l: 0, vs: 0 })
    globalScore.mp = dailyScore.length
    const result = await aRC.writeTeamScore(teamId, globalScore)
    return result
}

const calculateTeamsRanking = async () => {
    const allSquads = await aRC.getAllSquads()
    const results = []
    for (const squad of allSquads) {
        const result = await calculateTeamRanking(squad.id)
        results.push(result)
        await sleep(100)
    }
    return results
}

const allAutomated = async () => {
    const schedule = await aRC.getSortedSchedule()
    const matchDayEndedLessThanADayAgo = h.isMatchDayEndedLessThanADayAgo(schedule)
    if (matchDayEndedLessThanADayAgo) {
        console.log('@@@CONDITIONAL-SCRIPT@@@ - calculateTeamRanking:', matchDayEndedLessThanADayAgo.day)
        return await calculateTeamsRanking(matchDayEndedLessThanADayAgo.day)
    } else {
        console.log('@@@CONDITIONAL-SCRIPT@@@ - calculateTeamRanking: NO RUN')
    }
}


module.exports = {
    byTeam: calculateTeamRanking,
    all: calculateTeamsRanking,
    allAutomated: allAutomated,
}