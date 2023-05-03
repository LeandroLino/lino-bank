const app = require('express')()
require('dotenv').config();
const bodyParser = require('body-parser')
const utils = require('./utils')
const middlewares = require('./middlewares')
const messages = require('./messages')
const jwt = require('jsonwebtoken');

const db = require('./db');

app.use(bodyParser.json())

app.get('/', middlewares.verifyTables, middlewares.verifyToken, (req, res)=>{
    res.send("OK")
})

app.post('/register', middlewares.verifyTables, async (req, res, next) => {
    if(!utils.IsValidDocument(req.body.documentNumber)){
        res.send({error: messages.InvalidDocument})
    }
    if(req.body.password < 8)res.status(400).send(messages.InvalidPassword);
   
    const hashPassword = await utils.encryptPassword(req.body.password)
    const response = await db.createUser(utils.formatDocument(req.body.documentNumber), req.body.userName, req.body.birthDate, hashPassword)
    
    if(response.code !== "200") res.status(400).send(messages.InvalidDocument);
    const user = await db.getUser(req.body.documentNumber)
    const token = jwt.sign({userId: user.id, documentNumber: req.body.documentNumber}, process.env.SECRET_KEY_JWT, { expiresIn: '120h' });
    if(response.code === "200") res.send({code: 200, message: token})
    next()
})

app.post('/login', middlewares.verifyTables, async (req, res, next) => {
    if(!utils.IsValidDocument(req.body.documentNumber)){
        res.status(400).send({error: messages.InvalidDocument})
    }
    if(req.body.password < 8)res.status(400).send(messages.InvalidPassword);

    const isCorrectPassword = await db.loginUser(req.body.documentNumber, req.body.password)
    if(!isCorrectPassword) res.status(403).send("Failed login")
    const user = await db.getUser(req.body.documentNumber)
    const token = jwt.sign({userId: user.id, documentNumber: req.body.documentNumber}, process.env.SECRET_KEY_JWT, { expiresIn: '120h' });

    if(isCorrectPassword) res.send({code: 200, message: token})
    next()
})

app.post('/deposit', middlewares.verifyTables, middlewares.verifyToken, async (req, res, next) => {
    const token = req.headers['authorization'];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY_JWT);
    if(!utils.IsValidDocument(decodedToken.documentNumber)){
        res.status(400).send({error: messages.InvalidDocument})
    }
    const response = await db.createMoviment(decodedToken, req.body.value, 'DEPOSIT')
    if(response.code === "200") res.send({code: 200, message: "Successfully deposit"})
    if(response.code !== "200") res.status(400).send({code: 400, message: "We can't deposit now"});
    next()
})

app.post('/withdrawal', middlewares.verifyTables, middlewares.verifyToken, async (req, res, next) => {
    const token = req.headers['authorization'];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY_JWT);
    if(!utils.IsValidDocument(decodedToken.documentNumber)){
        res.status(400).send({error: messages.InvalidDocument})
    }
    const response = await db.createMoviment(decodedToken, req.body.value, 'WITHDRAWAL')
    if(response.code === "200") res.send({code: 200, message: "Successfully withdrawal"})
    if(response.code !== "200") res.status(400).send({code: 400, message: "We can't withdrawal now"});
    next()
})

app.post('/transfer', middlewares.verifyTables, middlewares.verifyToken, async (req, res, next) => {
    const token = req.headers['authorization'];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY_JWT);
    if(!utils.IsValidDocument(decodedToken.documentNumber)){
        res.status(400).send({error: messages.InvalidDocument})
    }
    const response = await db.createTransfer(decodedToken, req.body.value, req.body.recipientDocument, 'TRANSFER')
    if(response.code === "200") res.send({code: 200, message: "Successfully transfer"})
    if(response.code !== "200") res.status(400).send({code: 400, message: "We can't transfer now"});
    next()
})

app.get('/extract', middlewares.verifyTables, middlewares.verifyToken, async (req, res, next) => {
    const token = req.headers['authorization'];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY_JWT);
    if(!utils.IsValidDocument(decodedToken.documentNumber)){
        res.status(400).send({error: messages.InvalidDocument})
    }

    const user = await db.getUser(decodedToken.documentNumber)
    if(!user) res.status(404).send("User not found")
    const extract = utils.formatExtract(await db.doExtract(decodedToken.documentNumber, decodedToken.userId) || [])
    res.send({totalFounds: user.founds, moviments: extract})
    next()
})

app.listen(process.env.PORT || 3000, () => console.log(`Server running at http://localhost:${process.env.PORT || 3000}`))

module.exports = app
