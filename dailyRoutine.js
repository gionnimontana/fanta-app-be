require('dotenv').config({path: __dirname + '/.env'})

const utils = require('./scripts/utils')
const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const createScores = require('./scripts/createScores')
const createRanking = require('./scripts/createRanking')
const loadAutoFormation = require('./scripts/createFormations')
const createAritcle = require('./scripts/createArticles')

const main = async () => {
    // always excecuted
    await quotsScraper.run()
    await utils.sleep(5000)
    await statsScraper.run()
    await utils.sleep(5000)
    await titolaritaScraper.run()
    
    // conditionally executed
    await loadAutoFormation.allAutomated()
    await createScores.allAutomated()
    await utils.sleep(3000)
    await createRanking.allAutomated()
    await utils.sleep(3000)
    await createAritcle.allAutomated()
}

main()