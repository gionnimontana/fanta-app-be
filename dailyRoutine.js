require('dotenv').config({path: __dirname + '/.env'})

const utils = require('./scripts/utils')
const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const createScores = require('./scripts/createScores')
const createRanking = require('./scripts/createRanking')
const loadAutoFormation = require('./scripts/createFormations')
const createArticles = require('./scripts/createArticles')
const validatePurchase = require('./scripts/validatePurchase')

const main = async () => {
    // always excecuted
    await quotsScraper.run()
    await utils.sleep(5000)
    await titolaritaScraper.run()
    
    // conditionally executed
    await validatePurchase.allAutomated()
    await utils.sleep(2000)
    await loadAutoFormation.allAutomated()
    await utils.sleep(2000)
    await statsScraper.allAutomated()
    await utils.sleep(2000)
    await createScores.allAutomated()
    await utils.sleep(2000)
    await createRanking.allAutomated()
    await utils.sleep(2000)
    await createArticles.allAutomated()

}

main()