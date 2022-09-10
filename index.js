require('dotenv').config({path: __dirname + '/.env'})

const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')
const titolaritaGenerale = require('./scripts/loadTitolaritaGenerale')

const main = async () => {
    await statsScraper.run()
    await quotsScraper.run()
    await titolaritaScraper.run()
    // titolaritaGenerale.run()
}

main()