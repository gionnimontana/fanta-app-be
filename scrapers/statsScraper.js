const u = require('./utils')
const aRC = require('../api/restCollection')

const statsScraper = async () => {
    const URL = 'https://www.fantacalcio.it/voti-fantacalcio-serie-a/2022-23/24';
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
            const regex = /[0-9]/g;
            return {
                giornata: Number(gamesWeek.match(regex).join('')),
                squadra: team.name,
                giocatore: player.name,
                vote: voto === 55 ? null : voto,
                fvote: fvoto === 55 ? null : fvoto,
        }})]
    }, [])
    return output
};

const turnsPlayerAndSquadIntoId = async (stats) => {
    const players_stats = await aRC.getAllPlayers()
    stats.forEach((s) => {
        const player = players_stats.find(p => {
            return p.giocatore === s.giocatore && p.squadra === s.squadra
        })
        s.player_id = player ? player.id : 'NOT FOUND'
    })
    return stats.filter(s => s.player_id !== 'NOT FOUND')
}

async function scrapeAndWrite () {
    const stats = await statsScraper()
    console.log('stats', stats)
    const cleanedStats = await turnsPlayerAndSquadIntoId(stats)
    const result = await aRC.writeStats(cleanedStats)
    console.log('scrapeAndWrite done - updated: ', result.length, ' records')
}

module.exports = {
    run: scrapeAndWrite,
    scrape: statsScraper,
}



// const aQL = require('../api/graphQL')
// async function writeStatsQL(stats) {
// 	const json = JSON.stringify(stats)
// 	const unquoted = json.replace(/"([^"]+)":/g, '$1:')
// 	const mutationString = `
//         mutation insert_fanta_stats {
//             insert_fanta_stats(
//                 objects: ${unquoted},
//                 on_conflict: {
//                     constraint: fanta_stats_pkey1,
//                     update_columns: [voto, fantavoto]
//                 }
//             ) {
//                 affected_rows
//             }
//         }
//     `
//     return await aQL.fetchGraphQL(mutationString, 'insert_fanta_stats', {})
// }