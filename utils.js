const bcrypt = require('bcryptjs');

function IsValidDocument(documentNumber){
    let responseObject = {valid: false,
                          type: "INVALID"}
    if(ValidCPF(documentNumber)){
        responseObject = {valid: true,
                          type: "CPF"}
    }
    if(ValidCNPJ(documentNumber)){
        responseObject = {valid: true,
                          type: "CNPJ"}
    }
    return responseObject
}

function formatDocument(doc){
    return doc.replace(/[^\d]+/g,'');
}

function ValidCPF(cpf) {
    cpf = formatDocument(cpf)
  
    if (cpf.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rest = 11 - (sum % 11);
    let firstDigit = (rest >= 10) ? 0 : rest;
  
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rest = 11 - (sum % 11);
    let secondDigit = (rest >= 10) ? 0 : rest;
  
    if (cpf.charAt(9) != firstDigit || cpf.charAt(10) != secondDigit) {
      return false;
    }
  
    return true;
}

function ValidCNPJ(cnpj) {
    cnpj = formatDocument(cnpj)
  
    if (cnpj.length !== 14) {
      return false;
    }
  
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }
  
    let size = cnpj.length - 2;
    let number = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
  
    for (let i = size; i >= 1; i--) {
      sum += number.charAt(size - i) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
  
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result != digits.charAt(0)) {
      return false;
    }
  
    size = size + 1;
    number = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
  
    for (let i = size; i >= 1; i--) {
      sum += number.charAt(size - i) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
  
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result != digits.charAt(1)) {
      return false;
    }
  
    return true;
}

function encryptPassword(password){
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function(err, hash) {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        });
    });
}

async function matchPassword(password, userPassword){
    return await bcrypt.compare(password, userPassword)
}

module.exports = {
    IsValidDocument,
    ValidCPF,
    ValidCNPJ,
    formatDocument,
    encryptPassword,
    matchPassword
};
