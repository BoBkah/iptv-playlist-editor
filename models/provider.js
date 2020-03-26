'use strict'
module.exports = (sequelize, DataTypes) => {
  const Provider = sequelize.define('Provider', {
    name: DataTypes.STRING,
    host: DataTypes.STRING,
    port: DataTypes.INTEGER,
    username: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    freezeTableName: true
  })
  Provider.associate = (models) => {
    // associations can be defined here
    Provider.hasMany(models.LiveCategory, {
      foreignKey: 'id',
      as: 'liveCategories'
    })
    Provider.hasMany(models.PlaylistLiveCategory, {
      foreignKey: 'id',
      as: 'PlaylistLiveCategory'
    })
  }
  return Provider
}
