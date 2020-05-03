'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('PlaylistLive', 'password', {
      type: Sequelize.DataTypes.STRING
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('PlaylistLive', 'password')
  }
}
