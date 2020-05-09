'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeColumn('Epg', 'updatePeriod')
  },
  down: (queryInterface) => {
    return queryInterface.addColumn('Epg', 'updatePeriod', {
      type: Sequelize.DataTypes.STRING
    })
  }
}
