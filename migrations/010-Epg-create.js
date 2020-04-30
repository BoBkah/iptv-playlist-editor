'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.createTable('Epg', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      grabber: {
        type: Sequelize.STRING
      },
      lastScan: {
        type: Sequelize.DATE
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      updatePeriod: {
        type: Sequelize.INTEGER,
        defaultValue: 24
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Epg')
  }
}
