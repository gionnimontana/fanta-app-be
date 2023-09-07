require('dotenv').config({path: __dirname + '/.env'})
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const port = 8085
const sa = require('./api/serverAuth')

app.use(cors())
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.listen(port, () => {
  console.log(`Fantabot DB editing endpoint APIs listening on port ${port}`)
})

app.post('/testRoute', async (req, res) => {
  const body = req.body
  const userID = body.userID
  const userToken = req.headers.authorization

  const user = await sa.getUserData(userID, userToken)

  let userName = 'unknown'
  if (user) {
    userName = user.username
  }

  res.send(JSON.stringify({ userName: userName }))
})
