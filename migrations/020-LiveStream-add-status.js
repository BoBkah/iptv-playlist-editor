'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('LiveStream', 'status', {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: true
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('LiveStream', 'status')
  }
}
