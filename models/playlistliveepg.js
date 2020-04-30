'use strict'
module.exports = (sequelize, DataTypes) => {
  const PlaylistLiveEpg = sequelize.define('PlaylistLiveEpg', {
    priority: DataTypes.INTEGER
  }, {
    freezeTableName: true
  })
  PlaylistLiveEpg.associate = function (models) {
    PlaylistLiveEpg.belongsTo(models.Epg, {
      foreignKey: 'epgId'
    })
    PlaylistLiveEpg.belongsTo(models.PlaylistLive, {
      foreignKey: 'playlistLiveId'
    })
  }
  return PlaylistLiveEpg
}
