'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex('EpgTag', ['epgId', 'programId'],
        {
          indexName: 'EpgTagUniqProgram',
          indicesType: 'UNIQUE'
        }
      ),
      queryInterface.addIndex('EpgTag', ['channel'])
    ])
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('EpgTag', 'EpgTagUniqProgram'),
      queryInterface.removeIndex('EpgTag', ['channel'])
    ])
  }
}
