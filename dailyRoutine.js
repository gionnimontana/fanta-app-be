require('dotenv').config({path: __dirname + '/.env'})

const utils = require('./scripts/utils')
const statsScraper = require('./scrapers/statsScraper')
const quotsScraper = require('./scrapers/quotsScraper')
const titolaritaScraper = require('./scrapers/titolaritaScraper')

const main = async () => {
    await quotsScraper.run()
    await utils.sleep(10000)
    await statsScraper.run()
    await utils.sleep(10000)
    await titolaritaScraper.run()
}

const exec = async () => {
    await main()
    await utils.sleep(20000)
    await main()
}

exec()