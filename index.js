const app = require('express')()
require('dotenv').config();
const bodyParser = require('body-parser')
const utils = require('./utils')
const messages = require('./messages')

const db = require('./db');

app.use(bodyParser.json())

app.get('/', (req, res)=>{
    res.send("OK")
})

app.post('/register', async (req, res) => {
    if(!utils.IsValidDocument(req.body.documentNumber)){
        res.send({error: messages.InvalidDocument})
    }
    if(req.body.password < 8)res.status(400).send(messages.InvalidPassword);
   
    const hashPassword = await utils.encryptPassword(req.body.password)
    const response = await db.createUser(utils.formatDocument(req.body.documentNumber), req.body.userName, req.body.birthDate, hashPassword)
    
    if(response.code !== "200") res.status(400).send(messages.InvalidDocument);
    if(response.code === "200") res.send(messages.successfullyRegister)
})

app.post('/login', async (req, res) => {
    if(!utils.IsValidDocument(req.body.documentNumber)){
        res.status(400).send({error: messages.InvalidDocument})
    }
    if(req.body.password < 8)res.status(400).send(messages.InvalidPassword);

    const isCorrectPassword = await db.loginUser(req.body.documentNumber, req.body.password)
    if(isCorrectPassword) res.send("Login successfully")
    if(!isCorrectPassword) res.status(403).send("Failed login")
})

app.listen(process.env.PORT || 3000, () => console.log(`Server running at http://localhost:${process.env.PORT || 3000}`))

module.exports = app
