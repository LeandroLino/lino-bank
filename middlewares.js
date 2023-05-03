const jwt = require('jsonwebtoken');
const db = require('./db');

async function verifyTables(req, res, next){
    const userTable = await db.hasTable("User")
    const movimentsTable = await db.hasTable("Moviments")
    if(!movimentsTable || !userTable) res.status(400).send("Bad request, search for tables")
    next()
  }
  
  async function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(401).send({ auth: false, message: 'No token provided.' });
    }
  
    jwt.verify(token, process.env.SECRET_KEY_JWT, function(err, decoded) {
      if (err) {
        return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
      }
  
      req.userId = decoded.userId;
      next();
    });
  }

  module.exports ={
    verifyToken,
    verifyTables
  }
