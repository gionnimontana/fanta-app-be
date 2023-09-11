require('dotenv').config({path: __dirname + '/.env'})
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const sa = require('./api/serverAuth')
const formationScript = require('./scripts/createFormations')

const app = express()
const port = 8085

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}))
app.listen(port, () => { console.log(`Fantabot editing endpoint listening on port ${port}`)})

app.post('/update_match_formation', async (req, res) => {
  const teamId = await sa.getAuthenticatedSquad(req, res)
  await sa.sfc(() => formationScript.singleByTeamAndDay(teamId, req.body.day, req.body.formation))
  sa.safeServerResponse(res, 'formation updated')
})
