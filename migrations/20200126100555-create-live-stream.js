'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.createTable('LiveStream', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      archive: {
        type: Sequelize.INTEGER
      },
      archiveDuration: {
        type: Sequelize.INTEGER
      },
      streamId: {
        type: Sequelize.INTEGER
      },
      epgChannelId: {
        type: Sequelize.STRING
      },
      icon: {
        type: Sequelize.STRING
      },
      serviceId: {
        type: Sequelize.STRING
      },
      position: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('LiveStream')
  }
}
