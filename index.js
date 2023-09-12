require('dotenv').config({path: __dirname + '/.env'})

const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const createTeams = require('./scripts/createTeams')
const createCalendar = require('./scripts/createCalendar')
const cleanPBdatabase = require('./scripts/cleanPBdatabase')
const loadAutoFormation = require('./scripts/createFormations')
const createScores = require('./scripts/createScores')
const createRanking = require('./scripts/createRanking')
const createAritcle = require('./scripts/createArticles')
const validatePurchase = require('./scripts/validatePurchase')

const main = async () => {

    // await cleanPBdatabase.cleanPlayerVotes()
    // await createTeams.run()
    await createCalendar.run('1bn2o4kzza0ufc1')

    // await quotsScraper.run()
    // await statsScraper.allAutomated()
    // await titolaritaScraper.run()
    
    // await loadAutoFormation.allAutomated()
    // await createScores.allAutomated()
    // await createRanking.all()
    // await createAritcle.allAutomated()
    // await validatePurchase.allAutomated()
}

main()