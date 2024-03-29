const u = require('./utils')
const aRC = require('../api/restCollection')

const titolaritaScraper = async () => {
    const URL = 'https://www.fantacalcio.it/probabili-formazioni-serie-a';
    console.log('TitolaritaScraper - Opening the browser...')
    const browser = await u.puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
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
                play_next_match: Number(player.querySelector('.progress-value')?.innerText.replace('%', '')),
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
            team: team.name,
            name: player.name,
            play_next_match: player.play_next_match || 0,
        }))]
    }, [])
    return output   
};

async function scrapeAndWrite () {
    const stats = await titolaritaScraper()
    console.log('TitolaritaScraper - Getting players')
    const players = await aRC.getAllPlayers()
    const updatedPlayers = players.map(p => {
        const player = stats.find(s => s.name === p.name && s.team === p.team)
        return {
            ...p,
            play_next_match: player ? player.play_next_match : 0,
        }
    })
    console.log('TitolaritaScraper - updating players')
    const result = await aRC.writePlayers(updatedPlayers)
    console.log('TitolaritaScraper - END updated ', result.length , ' records')
}

module.exports = {
    run: scrapeAndWrite,
    scrape: titolaritaScraper,
}
