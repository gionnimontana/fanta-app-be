require('dotenv').config({path: __dirname + '/.env'})
const puppeteer = require('puppeteer')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const statsScraper = async () => {
    const URL = 'https://www.fantacalcio.it/voti-fantacalcio-serie-a';
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

    const output = stats.reduce((acc, team) => {
        return [...acc, ...team.players.map(player => ({
            giornata: gamesWeek,
            squadra: team.name,
            giocatore: player.name,
            voto: Number(player.vote.replace(',', '.')),
            fantavoto: Number(player.fvote.replace(',', '.')),
            id: `${gamesWeek}-${team.name}-${player.name}`,
        }))]
    }, [])

    return output
};

async function fetchGraphQL(operationsDoc, operationName, variables) {
	const result = await fetch(process.env.GRAPHQL_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-hasura-admin-secret': process.env.GRAPHQL_TOKEN
		},
		body: JSON.stringify({
			query: operationsDoc,
			variables: variables,
			operationName: operationName
		})
	})

	return await result.json()
}

async function writeStats(stats) {
	const json = JSON.stringify(stats)
	const unquoted = json.replace(/"([^"]+)":/g, '$1:')

	const mutationString = `
        mutation insert_fanta_stats {
            insert_fanta_stats(
                objects: ${unquoted},
                on_conflict: {
                    constraint: fanta_stats_pkey,
                    update_columns: [voto, fantavoto]
                }
            ) {
                affected_rows
            }
        }
    `

    return await fetchGraphQL(mutationString, 'insert_fanta_stats', {})
}

const main = async () => {
    const stats = await statsScraper()
    const result = await writeStats(stats)
    console.log(result) 
}

main()
