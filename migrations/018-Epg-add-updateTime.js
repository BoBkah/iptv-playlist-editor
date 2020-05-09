'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('Epg', 'updateTime', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: '00:00'
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('Epg', 'updateTime')
  }
}
