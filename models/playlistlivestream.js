'use strict'
module.exports = (sequelize, DataTypes) => {
  const PlaylistLiveStream = sequelize.define('PlaylistLiveStream', {
    name: DataTypes.STRING,
    position: DataTypes.INTEGER,
    epgChannelId: DataTypes.STRING,
    icon: DataTypes.STRING
  }, {
    freezeTableName: true
  })
  PlaylistLiveStream.associate = function (models) {
    PlaylistLiveStream.belongsTo(models.PlaylistLiveCategory, {
      foreignKey: 'playlistLiveCategoryId'
    })
    PlaylistLiveStream.belongsTo(models.LiveStream, {
      foreignKey: 'liveStreamId'
    })
  }
  return PlaylistLiveStream
}
