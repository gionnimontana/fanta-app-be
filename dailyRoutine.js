require('dotenv').config({path: __dirname + '/.env'})

const utils = require('./scripts/utils')
const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const createScores = require('./scripts/scoresScripts')
const createRanking = require('./scripts/rankingScripts')
const loadAutoFormation = require('./scripts/formationsScripts')
const createArticles = require('./scripts/articlesScripts')
const validatePurchase = require('./scripts/market/purchasesValidationScripts')

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