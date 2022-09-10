const titolariRaw = require('../data/titolaritaGenerale.js')
const u = require('../scrapers/utils')

function getPlayerData() {
	const operationsDoc = `
	query MyQuery {
		fanta_quots {
		id,
		giocatore,
		squadra,
		}
	}
	`;
  return u.fetchGraphQL(operationsDoc, "MyQuery", {});
}

const f = (str) => {
	return str.replaceAll('$', '').toLowerCase().trim().split(" ")[0];
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
                    update_columns: [undiciideale]
                }
            ) {
                affected_rows
            }
        }
    `
    return await u.fetchGraphQL(mutationString, 'insert_fanta_quots', {})
}

async function startFetchMyQuery() {
  const { errors, data } = await getPlayerData();
  if (errors) {
    console.error(errors);
  }

  const titolari = Object.keys(titolariRaw).reduce((acc, squad) => {
	  acc[squad] = titolariRaw[squad].split(',')
	  return acc
  }, {})

  const playerToUpdate = []

  data.fanta_quots.forEach(player => {
	const target = titolari[player.squadra].find(el => {
		const a = f(player.giocatore)
		const b = f(el)
		return f(el) === f(player.giocatore)
	}) 
	if (target) {
		playerToUpdate.push({
			...player,
			undiciideale: target.includes('$') ? 50 : 100
		})
	}
  })

  const output = await writeQuots(playerToUpdate)
  console.log(output)
}


module.exports = {
	run: startFetchMyQuery
}
