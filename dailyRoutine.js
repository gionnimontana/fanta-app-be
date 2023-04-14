require('dotenv').config({path: __dirname + '/.env'})

const utils = require('./scripts/utils')
const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')

const main = async () => {
    await quotsScraper.run()
    await utils.sleep(5000)
    await statsScraper.run()
    await utils.sleep(5000)
    await titolaritaScraper.run()
}

main()