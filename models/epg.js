'use strict'
module.exports = (sequelize, DataTypes) => {
  const Epg = sequelize.define('Epg', {
    name: DataTypes.STRING,
    grabber: DataTypes.STRING,
    lastScan: DataTypes.DATE,
    updateTime: DataTypes.STRING,
    status: DataTypes.BOOLEAN
  }, {
    freezeTableName: true
  })
  Epg.associate = function (models) {
    Epg.belongsTo(models.Provider, {
      foreignKey: 'providerId'
    })
    Epg.belongsToMany(models.PlaylistLive, {
      through: 'PlaylistLiveEpg',
      foreignKey: 'epgId'
    })
  }
  return Epg
}
