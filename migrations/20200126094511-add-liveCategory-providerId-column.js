'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('LiveCategory', 'providerId', {
      type: 'integer',
      references: {
        model: 'Provider',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('LiveCategory', 'providerId')
  }
}
