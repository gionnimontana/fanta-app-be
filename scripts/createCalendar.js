const squads = require('../mock/squads.json')
const squadIds = squads.map(s => s.id)
const missingDays = 11

const createCalendar = () => {
    console.log(squadIds)
    const calendar = {}
    let squadOrder = squadIds
    for (let x = 0; x < missingDays; x++) {
        const matchDay = x + 1
        calendar[matchDay] = [
            { home: squadOrder[0], await: squadOrder[1], scoreH: null, scoreA: null },
            { home: squadOrder[2], await: squadOrder[3], scoreH: null, scoreA: null },
            { home: squadOrder[4], await: squadOrder[5], scoreH: null, scoreA: null },
            { home: squadOrder[6], await: squadOrder[7], scoreH: null, scoreA: null },
            { home: squadOrder[8], await: squadOrder[1], scoreH: null, scoreA: null },
        ]
        const last = squadOrder.pop()
        squadOrder.unshift(last)
        console.log(squadOrder)
    }


}

module.exports = {
    run: createCalendar
}