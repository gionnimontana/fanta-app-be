const u = require('./utils')
const aRC = require('../api/restCollection')
const h = require('../helpers/index')

const statsScraper = async (day) => {
    const URL = `https://www.fantacalcio.it/voti-fantacalcio-serie-a/2023-24/${day}`;
    console.log('StatsScraper - Opening the browser...')
    const browser = await u.puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
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
                day: Number(gamesWeek.match(regex).join('')),
                team: team.name,
                name: player.name,
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
            return p.name === s.name
        })
        s.player_id = player ? player.id : 'NOT FOUND'
    })
    return stats.filter(s => s.player_id !== 'NOT FOUND')
}

async function scrapeAndWrite (day) {
    const stats = await statsScraper(day)
    console.log('StatsScraper - turnsPlayerAndSquadIntoId')
    const cleanedStats = await turnsPlayerAndSquadIntoId(stats)
    const result = await aRC.writeStats(cleanedStats)
    console.log('StatsScraper - END updated: ', result.length, ' records')
}

const audoDayScraper = async () => {
    const schedule = await aRC.getSortedSchedule()
    const matchDayInProgess = h.isMatchDayInProgess(schedule)
    const matchDayEndedLessThanADayAgo = h.isMatchDayEndedLessThanADayAgo(schedule)
    if (matchDayInProgess || matchDayEndedLessThanADayAgo) {
        console.log('@@@CONDITIONAL-SCRAPER@@@ - Create Stats:', matchDayInProgess?.day || matchDayEndedLessThanADayAgo.day)
        return await scrapeAndWrite(matchDayInProgess?.day || matchDayEndedLessThanADayAgo.day)
    } else {
        console.log('@@@CONDITIONAL-SCRAPER@@@ - Create Stats: NO RUN')
    }
}

module.exports = {
    run: scrapeAndWrite,
    byDay: scrapeAndWrite,
    allAutomated: audoDayScraper
}
