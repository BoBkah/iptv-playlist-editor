'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addColumn('LiveStream', 'providerId', {
        type: 'integer',
        references: {
          model: 'Provider',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }),
      queryInterface.addColumn('LiveStream', 'liveCategoryId', {
        type: 'integer',
        references: {
          model: 'LiveCategory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      })
    ])
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('LiveStream', 'providerId'),
      queryInterface.removeColumn('LiveStream', 'liveCategoryId')
    ])
  }
}
