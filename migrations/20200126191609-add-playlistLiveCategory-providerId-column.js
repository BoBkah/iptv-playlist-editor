'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('PlaylistLiveCategory', 'playlistLiveId', {
      type: 'integer',
      references: {
        model: 'PlaylistLive',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('PlaylistLiveCategory', 'playlistLiveId')
  }
}
