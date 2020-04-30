'use strict'
module.exports = (sequelize, DataTypes) => {
  const PlaylistLive = sequelize.define('PlaylistLive', {
    name: DataTypes.STRING
  }, {
    freezeTableName: true
  })
  PlaylistLive.associate = function (models) {
    // associations can be defined here
    PlaylistLive.belongsToMany(models.Epg, {
      through: 'PlaylistLiveEpg',
      foreignKey: 'playlistLiveId'
    })
  }
  return PlaylistLive
}
