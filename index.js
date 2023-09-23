require('dotenv').config({path: __dirname + '/.env'})

const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const teamsScripts = require('./scripts/teamsScripts')
const calendarsScripts = require('./scripts/calendarsScripts')
const cleanDBscripts = require('./helpers/cleanDBscripts')
const formationsScripts = require('./scripts/formationsScripts')
const scoresScripts = require('./scripts/scoresScripts')
const rankingScripts = require('./scripts/rankingScripts')
const articlesScripts = require('./scripts/articlesScripts')
const validatePurchase = require('./scripts/market/purchasesValidationScripts')

const main = async () => {

    // await cleanDBscripts.removeOutOfGamesRefoundingTeams()
    // await teamsScripts.run()
    // await calendarsScripts.run('1bn2o4kzza0ufc1')

    // await quotsScraper.run()
    // await statsScraper.allAutomated()
    // await titolaritaScraper.run()
    
    // await formationsScripts.allAutomated()
    // await scoresScripts.allAutomated()
    // await rankingScripts.all()
    // await articlesScripts.allAutomated()
    // await validatePurchase.allAutomated()
}

main()