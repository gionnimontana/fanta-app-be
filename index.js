require('dotenv').config({path: __dirname + '/.env'})

const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const titolaritaGenerale = require('./scripts/loadTitolaritaGenerale')
const createTeams = require('./scripts/createTeams')

const main = async () => {
    // await statsScraper.run()
    // await quotsScraper.run()
    // await titolaritaScraper.run()
    // await fvmScraper.run()
    await createTeams.run()
    // titolaritaGenerale.run()
}

main()