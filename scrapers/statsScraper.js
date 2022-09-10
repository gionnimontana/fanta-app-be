const u = require('./utils')

const statsScraper = async () => {
    const URL = 'https://www.fantacalcio.it/voti-fantacalcio-serie-a/';
    console.log('StatsScraper - Opening the browser...')
    const browser = await u.puppeteer.launch()
    const page = await browser.newPage()
    console.log(`StatsScraper - Navigating to ${URL}...`)
    await page.goto(URL, { waitUntil: 'load' })
    console.log('StatsScraper - finding games week...')
    await page.waitForSelector('#matchweek')
    const  gamesWeek = await page.evaluate(() => {
        const options = document.querySelector('#matchweek')
        const target = options.querySelector('[selected=""]')
        return target.innerText
    })
    console.log(`StatsScraper - Collecting the stats...`)
    await page.waitForSelector('.team-table')
    const stats = await page.evaluate(() => {
    return [...document.querySelectorAll('.team-table')]
        .map((row) => {
        return {
            name: row.querySelector('a').innerText,
            players: [...row.querySelectorAll('tbody > tr')].map(player => ({
                name: player.querySelector('.player-name')?.innerText,
                fvote: player.querySelector('.player-fanta-grade')?.getAttribute('data-value'),
                vote: player.querySelector('.player-grade')?.getAttribute('data-value'),
            }))
        };
        });
    });
    console.log('StatsScraper - Closing the browser...')
    await page.close()
    await browser.close()
    console.log('StatsScraper - Scrape done!')
    const output = stats.reduce((acc, team) => {
        return [...acc, ...team.players.map(player => {
            const voto = Number(player.vote.replace(',', '.'))
            const fvoto = Number(player.fvote.replace(',', '.'))
            return {
                giornata: gamesWeek,
                squadra: team.name,
                giocatore: player.name,
                voto: voto === 55 ? null : voto,
                fantavoto: fvoto === 55 ? null : fvoto,
                id: `${gamesWeek}-${team.name}-${player.name}`,
        }})]
    }, [])
    return output
};

async function writeStats(stats) {
	const json = JSON.stringify(stats)
	const unquoted = json.replace(/"([^"]+)":/g, '$1:')
	const mutationString = `
        mutation insert_fanta_stats {
            insert_fanta_stats(
                objects: ${unquoted},
                on_conflict: {
                    constraint: fanta_stats_pkey1,
                    update_columns: [voto, fantavoto]
                }
            ) {
                affected_rows
            }
        }
    `
    return await u.fetchGraphQL(mutationString, 'insert_fanta_stats', {})
}

async function scrapeAndWrite () {
    const stats = await statsScraper()
    const result = await writeStats(stats)
    console.log(result)
}

module.exports = {
    run: scrapeAndWrite,
    scrape: statsScraper,
    write: writeStats
}