'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const Umzug = require('umzug')
const basename = path.basename(__filename)
const env = process.env.NODE_ENV || 'development'
const db = {
  migrationComplete: false
}

// Load config
const configData = fs.readFileSync(path.join(process.cwd(), 'config/config.json'))
const config = JSON.parse(configData)[env]
// Update storage path
config.storage = path.join(process.cwd(), config.storage)

let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config)
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
}

sequelize.query('PRAGMA journal_mode=WAL')
sequelize.query('PRAGMA cache_size = -20000')

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach(file => {
    const model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

// Migrate database
const migrate = function () {
  const umzug = new Umzug({
    migrations: {
      path: path.join(__dirname, '/../migrations'),
      params: [
        sequelize.getQueryInterface()
      ]
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize: sequelize
    }
  })
  return new Promise(function (resolve, reject) {
    umzug.up().then(function (result) {
      return resolve()
    }).catch(function (error) {
      return reject(error)
    })
  })
}

db.sequelize = sequelize
db.Sequelize = Sequelize
db.migrate = migrate

module.exports = db
