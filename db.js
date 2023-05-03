require('dotenv').config()
const mysql = require('mysql2')
const utils = require('./utils')

function connect() {
  const connection = mysql.createConnection(process.env.DATABASE_URL)
  console.log('Connected to PlanetScale!')
  return connection
}

const db = connect()

function getUser(documentNumber) {
    return new Promise((resolve, reject) => {
      db.execute(`SELECT * FROM User WHERE documentNumber=${documentNumber}`, (err, results, _) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
}

function hasTable(table) {
    return new Promise((resolve, reject) => {
      db.execute(`DESCRIBE ${table}`, (err, results, _) => {
        if (err) {
          resolve(!err);
        } else {
          resolve(!!results);
        }
      });
    });
}

function updateFounds(value, documentNumber) {
    return new Promise((resolve, reject) => {
      db.execute(`UPDATE User SET founds = ${value} WHERE documentNumber=${documentNumber};`, (err, results, _) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
}

async function createUser(documentNumber, userName, birthDate, password){
    const user = await getUser(documentNumber);
    if(user){
        return {code: "400",
                message: "Bad Request"}
    }
    await db.execute(`INSERT INTO User (documentNumber, userName, birthDate, password) VALUES ('${documentNumber}', '${userName}', DATE('${birthDate}'), '${password}')`);
    return {code: "200",
            message: "Create success"}
}

async function loginUser(documentNumber, password){
    const user = await getUser(documentNumber);
    const isCorretPassword = await utils.matchPassword(password, user.password)
    return isCorretPassword
}

async function createMoviment(userTokenData, value, movimentType){
    try{
        const user = await getUser(userTokenData.documentNumber)
        const correctValue = utils.doCalculations(value, user.founds, movimentType)
        if(correctValue < 0) return {code: "403",
                                    message: "User do not has founds"}
        if(correctValue.code == 400) return {code: "400",
                                             message: "Bad Request"}
        db.execute(`UPDATE User SET founds = ${correctValue} WHERE documentNumber=${userTokenData.documentNumber};`)
        db.execute(`INSERT INTO Moviments (userId, value, movimentType) VALUES ('${userTokenData.userId}', '${value}', '${movimentType}')`)
        return {code: "200",
                message: "Successfully"}
    } catch{
        return {code: "400",
                message: "Bad Request"}
    }
}

async function createTransfer(userTokenData, value, recipientDocument ,movimentType){
    try{
        const user = await getUser(userTokenData.documentNumber)
        const recipientUser = await getUser(recipientDocument)
        const calculated = utils.doCalculationToTransfer(value, user.founds, recipientUser.founds)
        if(calculated.userFounds < 0) return {code: 403,
                                              message: "User do not has founds"} 
        await updateFounds(calculated.recipientFounds, recipientDocument)
        await updateFounds(calculated.userFounds, userTokenData.documentNumber)
        db.execute(`INSERT INTO Moviments (userId, value, movimentType) VALUES ('${userTokenData.userId}', '${value}', '${movimentType}')`)
        return {code: "200",
                message: "Successfully"}
    } catch{
        return {code: "400",
                message: "Bad Request"}
    }
}

async function doExtract(documentNumber, userId){
    return new Promise((resolve, reject) => {
        db.execute(`SELECT * FROM Moviments WHERE userId=${userId}`, (err, results, _) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
}

module.exports = { 
    connect,
    createUser,
    loginUser,
    getUser,
    createMoviment,
    doExtract,
    createTransfer,
    hasTable
}
