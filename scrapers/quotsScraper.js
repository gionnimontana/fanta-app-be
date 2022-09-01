const u = require('./utils')

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
    return [...document.querySelectorAll('.pills-table > tbody > tr')]
        .map((row) => {
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
            const teamSign = row.querySelector('.player-team').innerText.replace('\n                        ', '').replace('\n                    ', '')
            const squadra = td[teamSign] || teamSign
            const giocatore = row.querySelector('.player-name > a').innerText.replace('\n    \n    ', '')
            const quotazione = Number(row.querySelector('.player-classic-current-price').innerText)
            return {
                giocatore,
                squadra,
                quotazione,
                id: `${squadra}-${giocatore}`
            };
        });
    });
    console.log('QuotsScraper - Closing the browser...')
    await page.close()
    await browser.close()
    console.log('QuotsScraper - Scrape done!')
    return stats
};

async function writeQuots(quots) {
	const json = JSON.stringify(quots)
	const unquoted = json.replace(/"([^"]+)":/g, '$1:')
	const mutationString = `
        mutation insert_fanta_quots {
            insert_fanta_quots(
                objects: ${unquoted},
                on_conflict: {
                    constraint: fanta_stats_pkey,
                    update_columns: [quotazione]
                }
            ) {
                affected_rows
            }
        }
    `
    return await u.fetchGraphQL(mutationString, 'insert_fanta_quots', {})
}

async function scrapeAndWrite () {
    const stats = await quotsScraper()
    const result = await writeQuots(stats)
    console.log(result)
}

module.exports = {
    run: scrapeAndWrite,
    scrape: quotsScraper,
    write: writeQuots
}
