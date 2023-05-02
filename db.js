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

module.exports = { 
    connect,
    createUser,
    loginUser
}
