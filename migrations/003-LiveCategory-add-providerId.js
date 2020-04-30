'use strict'
module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addColumn('LiveCategory', 'providerId', {
        type: 'integer',
        references: {
          model: 'Provider',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      })
    ])
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('LiveCategory', 'providerId')
    ])
  }
}
