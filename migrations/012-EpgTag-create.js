'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.createTable('EpgTag', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        programId: {
          type: Sequelize.STRING
        },
        channel: {
          type: Sequelize.STRING
        },
        start: {
          type: Sequelize.DATE
        },
        stop: {
          type: Sequelize.DATE
        },
        title: {
          type: Sequelize.STRING
        },
        description: {
          type: Sequelize.TEXT
        },
        genre: {
          type: Sequelize.STRING
        },
        icon: {
          type: Sequelize.STRING
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
    ])
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropTable('EpgTag')
    ])
  }
}
