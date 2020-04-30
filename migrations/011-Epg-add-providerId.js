'use strict'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('Epg', 'providerId', {
      type: 'integer',
      references: {
        model: 'Provider',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('Epg', 'providerId')
  }
}
