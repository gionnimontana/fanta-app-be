const aR = require('./rest')

const updateDayRanking = async (day) => {
    const allSquads = await aRC.getAllSquads()
    const matches = await aRC.getMatchByDay(day)
    const squadWithUpdatedScore = allSquads.map((s) => {
        const targetMatch = matches.find(m => m.match.includes(s.id))
        if (targetMatch) {
            const isHome = targetMatch.match.split('-') === s.id
        } 
    })
}


module.exports = {
    all: calculateTeamsRanking,
    byDay: updateDayRanking
}