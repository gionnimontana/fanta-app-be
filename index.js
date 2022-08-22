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

const quotsScraper = async () => {
    const URL = 'https://www.fantacalcio.it/quotazioni-fantacalcio';
    console.log('Opening the browser...')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    console.log(`Navigating to ${URL}...`)
    await page.goto(URL, { waitUntil: 'load' })
    console.log(`Collecting the stats...`)
    await page.waitForSelector('.pills-table')
    const stats = await page.evaluate(() => {
    return [...document.querySelectorAll('.pills-table > tbody > tr')]
        .map((row) => {
            const teamSign = row.querySelector('.player-team').innerText.replace('\n                        ', '').replace('\n                    ', '')
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
    console.log('Closing the browser...')
    await page.close()
    await browser.close()
    console.log('Job done!')
    return stats
};

const titolaritaScraper = async () => {
    const URL = 'https://www.fantacalcio.it/probabili-formazioni-serie-a';
    console.log('Opening the browser...')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    console.log(`Navigating to ${URL}...`)
    await page.goto(URL, { waitUntil: 'load' })
    
    console.log(`Collecting the stats...`)
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
    console.log('Closing the browser...')
    await page.close()
    await browser.close()
    console.log('Job done!')
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
                    constraint: fanta_stats_pkey1,
                    update_columns: [voto, fantavoto]
                }
            ) {
                affected_rows
            }
        }
    `
    return await fetchGraphQL(mutationString, 'insert_fanta_stats', {})
}

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
    return await fetchGraphQL(mutationString, 'insert_fanta_quots', {})
}

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
    return await fetchGraphQL(mutationString, 'insert_fanta_quots', {})
}

const main = async () => {
    const stats = await statsScraper()
    const quots = await quotsScraper()
    const titolarita = await titolaritaScraper()
    const resultS = await writeStats(stats)
    const resultT = await writeTitolarita(titolarita)
    const resultQ = await writeQuots(quots)
    console.log(resultS, resultT, resultQ)
}

main()