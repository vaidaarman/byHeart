import { expect } from 'chai'
const db = require('../db')
const Passage = db.model('passage')
const User = db.model('user')
const app = require('../index')
const request = require('supertest')
const assert = require('assert')
// const requestAgent = require('superagent')

const initialPassages = [
  {
    title: 'speech',
    content: 'Several paragraphs of golden words',
    isPublic: true
  },
  {
    title: 'monolog',
    content: 'Extremely dramatic lines',
    isPublic: true
  },
  {
    title: 'another speech',
    content: 'Several private paragraphs of golden words',
    isPublic: false
  },
  {
    title: 'monolog from play',
    content: 'Not yet for publication',
    isPublic: false
  },
  {
    title: 'mark 1:2',
    content: 'Bible quotations',
    isPublic: true
  },
]

const newPassage = {
  title: 'new passage',
  content: 'some lines to learn'
}

const userOwner = {
  email: 'chris@chris.com',
  password: 'chris123'
}

const userOther = {
  email: 'sam@sam.com',
  password: 'sam123'
}

describe('Passage routes', () => {
  let dbUsers = []

  before(async () => {
    await db.sync({ force: true })
    dbUsers = await Promise.all([
      User.create(userOwner),
      User.create(userOther)
    ])

    const passages = await initialPassages.map(passage => {
      passage.authorId = dbUsers[0].id // i.e. userOwner
      return passage
    })

    await Passage.bulkCreate(passages)
  })

  describe('with guest user', () => {

    describe('GET /api/passages', () => {
      it('should return public passages only', () => {
        return request(app)
          .get('/api/passages')
          .expect(200)
          .then(res => {
            expect(res.body).to.be.an('array')
            expect(res.body.length).to.be.equal(3)
          })
      })
    })

    describe('GET /api/passages/:id', () => {
      it('should return a public passage', () => {
        return request(app)
          .get('/api/passages/1')
          .expect(200)
          .then(res => {
            expect(res.body.title).to.equal('speech')
          })
      })

      it('should NOT return a private passage', () => {
        return request(app)
          .get('/api/passages/3')
          .expect(401)
      })
    })

    describe('POST /api/passages', () => {
      it('should return an error', () => {
        return request(app)
          .post(`/api/passages/`)
          .send(newPassage)
          .expect(401)
      })
    })

    describe('PUT /api/passages', () => {
      it('should return an error', () => {
        return request(app)
          .put(`/api/passages/1`)
          .send({title: 'new title'})
          .expect(401)
      })
    })

    describe('DELETE /api/passages', () => {
      it('should return an error', () => {
        return request(app)
          .delete(`/api/passages/1`)
          .send({title: 'new title'})
          .expect(401)
      })
    })

  })

  describe('with authenticated user', () => {

    describe('who owns passage', () => {
      const authenticatedUser = request.agent(app)

      beforeEach((done) => {
        authenticatedUser
          .post('/auth/login')
          .send(userOwner)
          .end((err, res) => {
            if (err) throw err
            assert(res.statusCode === 200, 'Login failed for tests with authentication')
            done()
          })
      })

      describe('GET /api/passages', () => {
        it('should retrieve all passages', () => {
          return authenticatedUser
            .get('/api/passages')
            .expect(200)
            .then(res => {
              expect(res.body).to.be.an('array')
              expect(res.body.length).to.be.equal(5)
            })
        })
      })

      describe('GET /api/passages/:id', () => {
        it('should retrieve public passage', () => {
          return authenticatedUser
            .get('/api/passages/1')
            .expect(200)
            .then(res => {
              expect(res.body.title).to.equal('speech')
            })
        })

        it('should retrieve private passage', () => {
          return authenticatedUser
            .get('/api/passages/3')
            .expect(200)
            .then(res => {
              expect(res.body.title).to.equal('another speech')
            })
        })
      })

      describe('POST /api/passages/', () => {
        it('should save a new message', () => {
          newPassage.authorId = dbUsers[0].id
          return authenticatedUser
            .post(`/api/passages/`)
            .send(newPassage)
            .expect(201)
            .then(res => {
              expect(res.body.title).to.be.equal('new passage')
            })
        })
      })


      describe('PUT /api/passages/:id', () => {
        it('should edit a saved message', () => {
          return authenticatedUser
            .put(`/api/passages/4`)
            .send({ title: 'new title' })
            .expect(201)
            .then(res => {
              expect(res.body.title).to.equal('new title')
            })
        })
      })

      describe('DELETE /api/passages/:id', () => {
        it('should delete a saved message', () => {
          return authenticatedUser
            .delete('/api/passages/4')
            .expect(204)
        })
      })

    })

    describe('who does not own passage', () => {
      const authenticatedOtherUser = request.agent(app)

      beforeEach((done) => {
        authenticatedOtherUser
          .post('/auth/login')
          .send(userOther)
          .end((err, res) => {
            if (err) throw err
            assert(res.statusCode === 200, 'Login failed for tests with authentication')
            done()
          })
      })


      describe('GET /api/passages', () => {
        it('should retrieve all public passages', () => {
          return authenticatedOtherUser
            .get('/api/passages')
            .expect(200)
            .then(res => {
              expect(res.body).to.be.an('array')
              expect(res.body.length).to.be.equal(3)
            })
        })
      })

      describe('GET /api/passages/:id', () => {
        it('should retrieve public passage', () => {
          return authenticatedOtherUser
            .get('/api/passages/1')
            .expect(200)
            .then(res => {
              expect(res.body.title).to.equal('speech')
            })
        })
        it('should NOT retrieve private passage', () => {
          return authenticatedOtherUser
            .get('/api/passages/3')
            .expect(401)
            .then(res => {
              expect(res.body).to.deep.equal({})
            })
        })
      })

      describe('PUT /api/passages/:id', () => {
        it('should NOT edit a saved message', () => {
          return authenticatedOtherUser
            .put(`/api/passages/4`)
            .send({ title: 'new title' })
            .expect(401)
            .then(res => {
              expect(res.body).to.deep.equal({})
            })
        })
      })

      describe('DELETE /api/passages/:id', () => {
        it('should NOT delete a saved message', () => {
          return authenticatedOtherUser
            .delete('/api/passages/4')
            .expect(401)
        })
      })

    })
  })

})
