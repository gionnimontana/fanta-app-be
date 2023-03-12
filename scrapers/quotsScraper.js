const u = require('./utils')
const aRC = require('../api/restCollection')

const quotsScraper = async () => {
    const URL = 'https://www.fantacalcio.it/quotazioni-fantacalcio';
    console.log('QuotsScraper - Opening the browser...')
    const browser = await u.puppeteer.launch()
    const page = await browser.newPage()
    console.log(`QuotsScraper - Navigating to ${URL}...`)
    await page.goto(URL, { waitUntil: 'load' })
    console.log(`QuotsScraper - Collecting the stats...`)
    await page.waitForSelector('.pills-table')
    const stats = await page.evaluate(() => {
        return [...document.querySelectorAll('.pills-table > tbody > tr')].map((row) => {
            const td = {
                ATA: 'Atalanta',
                BOL: 'Bologna',
                CRE: 'Cremonese',
                EMP: 'Empoli',
                FIO: 'Fiorentina',
                INT: 'Inter',
                JUV: 'Juventus',
                LAZ: 'Lazio',
                LEC: 'Lecce',
                MIL: 'Milan',
                MON: 'Monza',
                NAP: 'Napoli',
                ROM: 'Roma',
                SAL: 'Salernitana',
                SAM: 'Sampdoria',
                SAS: 'Sassuolo',
                SPE: 'Spezia',
                TOR: 'Torino',
                UDI: 'Udinese',
                VER: 'Verona'
            }
            const teamSign = row.querySelector('.player-team').innerText.trim().replace('\n', '')
            const squadra = td[teamSign] || teamSign
            const giocatore = row.querySelector('.player-name > a').innerText.trim().replace('\n', '')
            const fvm = Number(row.querySelector('.player-classic-fvm').innerText)
            const quotazione = Number(row.querySelector('.player-classic-current-price').innerText)
            const undiciideale = Number(row.getAttribute('data-filter-playeds'))
            const ruolo = row.getAttribute('data-filter-role-classic')
            return {
                giocatore,
                squadra,
                quotazione,
                fvm,
                undiciideale,
                ruolo
            };
        });
    });
    console.log('QuotsScraper - Closing the browser...')
    await page.close()
    await browser.close()
    console.log('QuotsScraper - Scrape done, scraped ' + stats.length + ' players')
    return stats
};

async function scrapeAndWrite () {
    const stats = await quotsScraper()
    console.log('QuotsScraper - Writing the stats...')
    const result = await aRC.writePlayers(stats)
    console.log('QuotsScraper - Write done, ' + result.length + ' players written')
}

module.exports = {
    run: scrapeAndWrite,
    scrape: quotsScraper
}


// const aQL = require('../api/graphQL')
// async function writeQuotsQL(quots) {
// 	const json = JSON.stringify(quots)
// 	const unquoted = json.replace(/"([^"]+)":/g, '$1:')
// 	const mutationString = `
//         mutation insert_fanta_quots {
//             insert_fanta_quots(
//                 objects: ${unquoted},
//                 on_conflict: {
//                     constraint: fanta_stats_pkey,
//                     update_columns: [quotazione, fvm, undiciideale, ruolo]
//                 }
//             ) {
//                 affected_rows
//             }
//         }
//     `
//     return await aQL.fetchGraphQL(mutationString, 'insert_fanta_quots', {})
// }