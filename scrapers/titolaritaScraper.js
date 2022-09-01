const u = require('./utils')

const titolaritaScraper = async () => {
    const URL = 'https://www.fantacalcio.it/probabili-formazioni-serie-a';
    console.log('TitolaritaScraper - Opening the browser...')
    const browser = await u.puppeteer.launch()
    const page = await browser.newPage()
    console.log(`TitolaritaScraper - Navigating to ${URL}...`)
    await page.goto(URL, { waitUntil: 'load' })
    console.log(`TitolaritaScraper - Collecting the stats...`)
    await page.waitForSelector('.team-card')
    const stats = await page.evaluate(() => {
    return [...document.querySelectorAll('.team-card')]
        .map((row) => {
        return {
            name: row.querySelector('.team-name').innerText,
            players: [...row.querySelectorAll('.player-item')].map(player => ({
                name: player.querySelector('.player-name')?.innerText,
                titolarita: Number(player.querySelector('.progress-value')?.innerText.replace('%', '')),
            }))
        };
        });
    });
    console.log('TitolaritaScraper - Closing the browser...')
    await page.close()
    await browser.close()
    console.log('TitolaritaScraper - Scrape done!')
    const output = stats.reduce((acc, team) => {
        return [...acc, ...team.players.map(player => ({
            squadra: team.name,
            giocatore: player.name,
            titolarita: player.titolarita || 0,
            id: `${team.name}-${player.name}`,
        }))]
    }, [])
    return output   
};

async function writeTitolarita(titolarita) {
	const json = JSON.stringify(titolarita)
	const unquoted = json.replace(/"([^"]+)":/g, '$1:')
	const mutationString = `
        mutation insert_fanta_quots {
            insert_fanta_quots(
                objects: ${unquoted},
                on_conflict: {
                    constraint: fanta_stats_pkey,
                    update_columns: [titolarita]
                }
            ) {
                affected_rows
            }
        }
    `
    return await u.fetchGraphQL(mutationString, 'insert_fanta_quots', {})
}

async function scrapeAndWrite () {
    const stats = await titolaritaScraper()
    const result = await writeTitolarita(stats)
    console.log(result)
}

module.exports = {
    run: scrapeAndWrite,
    scrape: titolaritaScraper,
    write: writeTitolarita
}