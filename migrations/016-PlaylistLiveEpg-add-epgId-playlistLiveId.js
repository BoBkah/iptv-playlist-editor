
'use strict'
module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addColumn('PlaylistLiveEpg', 'epgId', {
        type: 'integer',
        references: {
          model: 'Epg',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }),
      queryInterface.addColumn('PlaylistLiveEpg', 'playlistLiveId', {
        type: 'integer',
        references: {
          model: 'PlaylistLive',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      })
    ])
  },
  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('PlaylistLiveEpg', 'epgId'),
      queryInterface.removeColumn('PlaylistLiveEpg', 'playlistLiveId')
    ])
  }
}
