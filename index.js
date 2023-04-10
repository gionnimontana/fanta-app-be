require('dotenv').config({path: __dirname + '/.env'})

const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const createTeams = require('./scripts/createTeams')
const createCalendar = require('./scripts/createCalendar')
const cleanPBdatabase = require('./scripts/cleanPBdatabase')
const loadAutoFormation = require('./scripts/createFormations')
const createScores = require('./scripts/createScores')

const main = async () => {
    // await cleanPBdatabase.cleanCalendar()
    // await quotsScraper.run()
    // await statsScraper.run()
    // await titolaritaScraper.run()
    // await createTeams.run()
    // await createCalendar.run()
    // await loadAutoFormation.byDay(28)
    // await createScores.allByDay(27)
    await createRanking.run()
}

main()