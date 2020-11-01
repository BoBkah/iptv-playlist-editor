'use strict'
module.exports = (sequelize, DataTypes) => {
  const LiveStream = sequelize.define('LiveStream', {
    name: DataTypes.STRING,
    archive: DataTypes.INTEGER,
    archiveDuration: DataTypes.INTEGER,
    streamId: DataTypes.INTEGER,
    epgChannelId: DataTypes.STRING,
    icon: DataTypes.STRING,
    serviceId: DataTypes.STRING,
    position: DataTypes.INTEGER,
    status: DataTypes.BOOLEAN
  }, {
    freezeTableName: true
  })
  LiveStream.associate = function (models) {
    LiveStream.belongsTo(models.Provider, {
      foreignKey: 'providerId'
    })
    LiveStream.belongsTo(models.LiveCategory, {
      foreignKey: 'liveCategoryId'
    })
  }
  return LiveStream
}
