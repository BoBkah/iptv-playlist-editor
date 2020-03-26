'use strict'
const Sequelize = require('sequelize')
module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addColumn('PlaylistLiveStream', 'playlistLiveCategoryId', {
        type: 'integer',
        references: {
          model: 'PlaylistLiveCategory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }),
      queryInterface.addColumn('PlaylistLiveStream', 'liveStreamId', {
        type: 'integer',
        references: {
          model: 'LiveStream',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      })
    ])
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('PlaylistLiveStream', 'playlistLiveCategoryId'),
      queryInterface.removeColumn('PlaylistLiveStream', 'liveStreamId')
    ])
  }
}
