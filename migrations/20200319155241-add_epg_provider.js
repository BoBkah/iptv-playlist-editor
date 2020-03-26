'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('PlaylistLive', 'epgProvider', {
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
    return queryInterface.removeColumn('PlaylistLive', 'epgProvider')
  }
};
