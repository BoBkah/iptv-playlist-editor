'use strict'
module.exports = (sequelize, DataTypes) => {
  const PlaylistLiveCategory = sequelize.define('PlaylistLiveCategory', {
    name: DataTypes.STRING,
    position: DataTypes.INTEGER
  }, {
    freezeTableName: true
  })
  PlaylistLiveCategory.associate = function (models) {
    PlaylistLiveCategory.belongsTo(models.PlaylistLive, {
      foreignKey: 'playlistLiveId'
    })
    PlaylistLiveCategory.hasMany(models.PlaylistLiveStream, {
      foreignKey: 'id',
      as: 'PlaylistLiveStream'
    })
  }
  return PlaylistLiveCategory
}
