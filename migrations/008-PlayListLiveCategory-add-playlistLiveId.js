'use strict'
module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addColumn('PlaylistLiveCategory', 'playlistLiveId', {
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
    return queryInterface.removeColumn('PlaylistLiveCategory', 'playlistLiveId')
  }
}
