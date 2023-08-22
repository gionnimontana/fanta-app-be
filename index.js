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
    // await createCalendar.run()

    // await quotsScraper.run()
    // await statsScraper.run()
    // await titolaritaScraper.run()
    
    // await loadAutoFormation.byDay(35)
    // await createScores.allByDay(32)
    // await createRanking.all()
    // await createAritcle.allAutomated()
    await validatePurchase.singleById('2dr2viqdiwh95nq')
}

main()