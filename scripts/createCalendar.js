const aRC = require('../api/restCollection')

const createCalendar = async () => {
    let days = 38
    const squads = await aRC.getAllSquads()
    const squadIds = squads.map(s => s.id)
    const teamsPairs = createMatchCalendar(squadIds)
    const pairsNumber = teamsPairs.length
    const matches = []
    
    for (let day = 0; day < days; day++) {
        const round = Math.floor(day / pairsNumber)
        const pairsIndex = (day) - (round * pairsNumber)
        const targetPair = teamsPairs[pairsIndex]
        targetPair.forEach(teamPair => {
            matches.push({
                day: day + 1,
                match: `${teamPair[0]}-${teamPair[1]}`
            })
        })
    }
    const result = await aRC.writeMatches(matches)
    console.log('result', result)
}

function createMatchCalendar(teams) {
    const numberOfTeams = teams.length;
    const matchesPerRound = numberOfTeams / 2;
    const rounds = [];
    // Generate rounds
    for (let roundIndex = 0; roundIndex < numberOfTeams - 1; roundIndex++) {    
      const round = [];
      for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
        const homeIndex = (roundIndex + matchIndex) % (numberOfTeams - 1);
        const awayIndex = (numberOfTeams - 1 - matchIndex + roundIndex) % (numberOfTeams - 1);
        if (matchIndex === 0) {
          round.push([teams[homeIndex], teams[numberOfTeams - 1]]);
        } else {
          round.push([teams[homeIndex], teams[awayIndex]]);
        }
      }
      rounds.push(round);
    }
    return rounds;
  }

module.exports = {
    run: createCalendar
}