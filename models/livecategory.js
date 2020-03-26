'use strict'
module.exports = (sequelize, DataTypes) => {
  const LiveCategory = sequelize.define('LiveCategory', {
    name: DataTypes.STRING,
    categoryId: DataTypes.STRING
  }, {
    freezeTableName: true
  })
  LiveCategory.associate = (models) => {
    LiveCategory.belongsTo(models.Provider, {
      foreignKey: 'providerId'
    })
  }
  return LiveCategory
}
