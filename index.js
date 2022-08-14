const puppeteer = require('puppeteer');

const URL = 'https://www.fantacalcio.it/voti-fantacalcio-serie-a';

const statsScraper = async () => {
    console.log('Opening the browser...')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    console.log(`Navigating to ${URL}...`)
    await page.goto(URL, { waitUntil: 'load' })

    console.log('finding games week...')
    await page.waitForSelector('#matchweek')
    const  gamesWeek = await page.evaluate(() => {
        const options = document.querySelector('#matchweek')
        const target = options.querySelector('[selected=""]')
        return target.innerText
    })

    console.log(`Collecting the stats...`)
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

    console.log('Closing the browser...')

    await page.close()
    await browser.close()

    console.log('Job done!')
    console.log('gamesWeek', gamesWeek)
    console.log('TEST first team stats:', stats[0].players)
    return stats
};

statsScraper()