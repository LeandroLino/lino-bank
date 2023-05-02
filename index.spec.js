const request = require("supertest")
const app = require('./index')

describe('Test My app server',  () => {
  it('should get main route', async  () => {
     const res = await request(app).get("/")
     expect(res.text).toBe("OK");
    })
}) 

describe('Test deposit route',  () => {
    it('should return 200 and the document number', async  () => {
       const res = await request(app).post("/deposit")
       .send({
        "documentNumber": "51832223809"
       })
       expect(res.text).toBe("Successfully deposited");
      })
  }) 
  