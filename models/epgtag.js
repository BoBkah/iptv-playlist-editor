'use strict'
module.exports = (sequelize, DataTypes) => {
  const EpgTag = sequelize.define('EpgTag', {
    programId: DataTypes.STRING,
    channel: DataTypes.STRING,
    start: DataTypes.DATE,
    stop: DataTypes.DATE,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    genre: DataTypes.STRING,
    icon: DataTypes.STRING
  }, {
    freezeTableName: true
  })
  EpgTag.associate = function (models) {
    EpgTag.belongsTo(models.Epg, {
      foreignKey: 'epgId'
    })
  }
  return EpgTag
}
