'use strict'
module.exports = (sequelize, DataTypes) => {
  const PlaylistLive = sequelize.define('PlaylistLive', {
    name: DataTypes.STRING
  }, {
    freezeTableName: true
  })
  PlaylistLive.associate = function (models) {
    // associations can be defined here
    PlaylistLive.belongsTo(models.Provider, {
      foreignKey: 'epgProvider'
    })
  }
  return PlaylistLive
}
