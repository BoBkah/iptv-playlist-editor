const express = require('express')
const fetch = require('node-fetch')
const nodemailer = require('nodemailer')
const open = require('open')
const path = require('path')
const querystring = require('querystring')
const db = require('./models')
const env = process.env.NODE_ENV || 'development'
const config = require(path.join(__dirname, '/config/config.json'))[env]

// Email transporter
let mailTransporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.username,
    pass: config.email.password
  }
})
// Express server
let expressApp = express()
expressApp.use(express.json())
expressApp.set('view engine', 'pug')
// Logs
expressApp.use(function (req, res, next) {
  console.log(req.connection.remoteAddress + ' "' + req.method + ' ' + req._parsedUrl.path + '"')
  next()
})
// Manager interface
expressApp.get('/manager', function (req, res) {
  res.sendFile('./views/index.html', {
    root: __dirname
  })
})
/**
 * Provider
 * ----------------------------------------------------------------------------
 */
// List providers
expressApp.get('/manager/api/provider', function (req, res) {
  db.Provider.findAll().then(function (providers) {
    res.json(providers)
  }).catch(function (error) {
    if (error) {
      res.status(500).send(error.message)
    }
  })
})
// Get provider
expressApp.get('/manager/api/provider/:providerId', function (req, res) {
  db.Provider.findOne({
    where: {
      id: req.params.providerId
    }
  }).then(function (provider) {
    if (provider === null) {
      return res.status(404).send('Provider not exists')
    }
    res.status(200).send(provider)
  })
})
// Add provider
expressApp.post('/manager/api/provider', function (req, res) {
  let body = req.body
  // Control parameters
  if (!body.hasOwnProperty('name')) {
    return res.status(400).send('Missing provider name')
  }
  if (!body.hasOwnProperty('host')) {
    return res.status(400).send('Missing provider host')
  }
  if (!body.hasOwnProperty('port')) {
    return res.status(400).send('Missing provider port')
  }
  if (!body.hasOwnProperty('username')) {
    return res.status(400).send('Missing provider username')
  }
  if (!body.hasOwnProperty('password')) {
    return res.status(400).send('Missing provider password')
  }
  // Add to database
  db.Provider.create(body).then(function (provider) {
    res.status(200).json({
      'message': 'Provider successfully added',
      'providerId': provider.id
    })
  }).catch(function (error) {
    if (error) {
      res.status(500).send(error.message)
    }
  })
})
// Update provider
expressApp.put('/manager/api/provider/:providerId', async function (req, res) {
  // Get provider
  let provider = await db.Provider.findByPk(req.params.providerId)
  if (provider === null) {
    return res.status(400).send('Provider not exists')
  }
  // Construct data
  let body = req.body
  let data = []
  if (body.hasOwnProperty('name')) {
    data.name = body.name
  }
  if (body.hasOwnProperty('host')) {
    data.host = body.host
  }
  if (body.hasOwnProperty('port')) {
    data.port = body.port
  }
  if (body.hasOwnProperty('username')) {
    data.username = body.username
  }
  if (body.hasOwnProperty('password')) {
    data.password = body.password
  }
  db.Provider.update(data, {where: {id: req.params.providerId}}).then(function () {
    return res.status(200).send('Provider updated')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
// Delete provider
expressApp.delete('/manager/api/provider/:providerId', async function (req, res) {
  let provider = await db.Provider.findByPk(req.params.providerId)
  if (provider === null) {
    return res.status(400).send('Provider not exists')
  }
  provider.destroy().then(function () {
    // Todo - reset stream position into playlist
    res.status(200).send('Provider deleted')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
// Synchronize provider live categories and streams
expressApp.get('/manager/api/provider/:providerId/sync', async function (req, res) {
  let startSyncAt = new Date()
  let actionList = []
  // Get provider infos
  let provider = await db.Provider.findByPk(req.params.providerId)
  if (provider === null) {
    return res.status(400).send('Provider not exists')
  }
  // Test connection
  try {
    await requestProvider(provider, {})
  } catch (error) {
    return res.status(500).send('Cant connect to provider, ' + error.message)
  }
  // Get all live categories
  let providerCategory = []
  try {
    providerCategory = await requestProvider(provider, {
      action: 'get_live_categories'
    })
  } catch (error) {
    return res.status(500).send('Cant get provider categories')
  }
  // Update database
  let localCategory = []
  for (let index in providerCategory) {
    // Find category
    let result = await db.LiveCategory.findOne({
      where: {
        providerId: provider.id,
        categoryId: providerCategory[index].category_id
      }
    })
    if (result === null) {
      // Add it
      let liveCategoryCreated = await db.LiveCategory.create({
        name: providerCategory[index].category_name,
        categoryId: providerCategory[index].category_id,
        providerId: provider.id
      })
      if (liveCategoryCreated !== null) {
        localCategory[providerCategory[index].category_id] = liveCategoryCreated.id
      }
      actionList.push({
        'context': 'category',
        'action': 'add',
        'message': providerCategory[index].category_name
      })
    } else {
      // Update
      await db.LiveCategory.update({
        name: providerCategory[index].category_name,
        categoryId: providerCategory[index].category_id
      }, {
        where: {
          id: result.id
        }
      })
      localCategory[providerCategory[index].category_id] = result.id
    }
  }
  // Get all live streams
  let providerLiveStream = []
  try {
    providerLiveStream = await requestProvider(provider, {
      action: 'get_live_streams'
    })
  } catch (error) {
    return res.status(500).send('Cant get provider live streams')
  }
  // Update database
  let bulkCreate = []
  for (let index in providerLiveStream) {
    // Find stream
    let result = await db.LiveStream.findOne({
      where: {
        providerId: provider.id,
        streamId: providerLiveStream[index].stream_id
      }
    })
    if (result === null) {
      // Add it
      bulkCreate.push({
        name: providerLiveStream[index].name.trim(),
        archive: providerLiveStream[index].tv_archive,
        archiveDuration: providerLiveStream[index].tv_archive_duration,
        streamId: providerLiveStream[index].stream_id,
        epgChannelId: providerLiveStream[index].epg_channel_id,
        icon: providerLiveStream[index].stream_icon,
        serviceId: providerLiveStream[index].custom_sid,
        position: providerLiveStream[index].num,
        providerId: provider.id,
        liveCategoryId: localCategory[providerLiveStream[index].category_id]
      })
      if (bulkCreate.length > 1000) {
        await db.LiveStream.bulkCreate(bulkCreate)
        bulkCreate = []
      }
      actionList.push({
        'context': 'stream',
        'action': 'add',
        'message': providerLiveStream[index].name.trim()
      })
    } else {
      await db.LiveStream.update({
        name: providerLiveStream[index].name.trim(),
        archive: providerLiveStream[index].tv_archive,
        archiveDuration: providerLiveStream[index].tv_archive_duration,
        epgChannelId: providerLiveStream[index].epg_channel_id,
        icon: providerLiveStream[index].stream_icon,
        serviceId: providerLiveStream[index].custom_sid,
        position: providerLiveStream[index].num,
        liveCategoryId: localCategory[providerLiveStream[index].category_id]
      }, {
        where: {
          id: result.id
        }
      })
    }
  }
  if (bulkCreate.length > 0) {
    await db.LiveStream.bulkCreate(bulkCreate)
  }
  bulkCreate = []
  localCategory = []
  // Get category/stream will be deleted
  try {
    let categoryList = await db.LiveCategory.findAll({
      where: {
        providerId: provider.id,
        updatedAt: {
          [db.Sequelize.Op.lt]: startSyncAt
        }
      }
    })
    for (let categoryIndex in categoryList) {
      actionList.push({
        'context': 'category',
        'action': 'delete',
        'message': categoryList[categoryIndex].name
      })
    }
    let streamList = await db.LiveStream.findAll({
      where: {
        providerId: provider.id,
        updatedAt: {
          [db.Sequelize.Op.lt]: startSyncAt
        }
      }
    })
    for (let streamIndex in streamList) {
      actionList.push({
        'context': 'stream',
        'action': 'delete',
        'message': streamList[streamIndex].name
      })
    }
  } catch (error) { }
  // Delete old stream/category
  // Next step: notify before delete
  try {
    await db.LiveCategory.destroy({
      where: {
        providerId: provider.id,
        updatedAt: {
          [db.Sequelize.Op.lt]: startSyncAt
        }
      }
    })
    await db.LiveStream.destroy({
      where: {
        providerId: provider.id,
        updatedAt: {
          [db.Sequelize.Op.lt]: startSyncAt
        }
      }
    })
  } catch (error) {
    return res.status(500).send(error.message)
  }
  // Send mail
  /*
  if (actionList.length > 0) {
    let message = ''
    for (let actionIndex in actionList) {
      message += 'Context: ' + actionList[actionIndex].context + '\n'
      message += 'Action: ' + actionList[actionIndex].action + '\n'
      message += 'Message: '+ actionList[actionIndex].message + '\n\n'
    }
    try {
      await mailTransporter.sendMail({
        from: 'Xtream Playlist Editor <noreply@local>',
        to: config.email.mailAddress,
        subjet: 'Changes for provider ' + provider.name,
        text: message
      })
    } catch (error) {}
  }
  */
  res.send('Live streams updated')
})
// Get provider categories
expressApp.get('/manager/api/provider/:providerId/live/category', function (req, res) {
  db.LiveCategory.findAll({
    where: {
      providerId: req.params.providerId
    },
    attributes: ['id', 'name']
  }).then(function (categories) {
    res.json(categories)
  }).catch(function (error) {
    res.status(500).send(error.message)
  })
})
// Get streams category
expressApp.get('/manager/api/provider/:providerId/live/category/:categoryId', function (req, res) {
  db.LiveStream.findAll({
    where: {
      providerId: req.params.providerId,
      liveCategoryId: req.params.categoryId
    }
  }).then(function (streams) {
    res.json(streams)
  }).catch(function (error) {
    res.status(500).send(error.message)
  })
})
/**
 * Playlist
 * ----------------------------------------------------------------------------
 */
// List playlist live
expressApp.get('/manager/api/playlist/live', function (req, res) {
  db.PlaylistLive.findAll({
    order: [
      ['name', 'ASC']
    ],
    attributes: [
      'id',
      'name'
    ]
  }).then(function (PlaylistLive) {
    res.json(PlaylistLive)
  }).catch(function (error) {
    res.status(500).send(error.message)
  })
})
// Get playlist
expressApp.get('/manager/api/playlist/live/:playlistLiveId', function (req, res) {
  db.PlaylistLive.findOne({
    where: {
      id: req.params.playlistLiveId
    }
  }).then(function (playlistLive) {
    if (playlistLive === null) {
      return res.status(404).send('playlistLive not exists')
    }
    res.status(200).send(playlistLive)
  })
})
// Add playlist live
expressApp.post('/manager/api/playlist/live', function (req, res) {
  let body = req.body
  // Control parameters
  if (!body.hasOwnProperty('name')) {
    return res.status(400).send('Missing playlist name')
  }
  // Add to database
  db.PlaylistLive.create(body).then(function () {
    res.status(200).send('Live playlist added')
  }).catch(function (error) {
    if (error) {
      res.status(500).send(error.message)
    }
  })
})
// Update playlist
expressApp.put('/manager/api/playlist/live/:playlistLiveId', async function (req, res) {
  // Get playlist
  let playlistLive = await db.PlaylistLive.findByPk(req.params.playlistLiveId)
  if (playlistLive === null) {
    return res.status(400).send('Playlist not exists')
  }
  // Construct data
  let body = req.body
  let data = []
  if (body.hasOwnProperty('name')) {
    data.name = body.name
  }
  if (body.hasOwnProperty('epgProvider')) {
    data.epgProvider = body.epgProvider
  }
  // Update
  db.PlaylistLive.update(data, {where: {id: req.params.playlistLiveId}}).then(function () {
    return res.status(200).send('Playlist updated')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
// Delete playlist
expressApp.delete('/manager/api/playlist/live/:playlistLiveId', async function (req, res) {
  let playlistLive = await db.PlaylistLive.findByPk(req.params.playlistLiveId)
  if (playlistLive === null) {
    return res.status(400).send('Playlist not exists')
  }
  playlistLive.destroy().then(function () {
    res.status(200).send('Playlist Live deleted')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
// List playlist live category
expressApp.get('/manager/api/playlist/live/:playlistLiveId/category', function (req, res) {
  db.PlaylistLiveCategory.findAll({
    where: {
      playlistLiveId: req.params.playlistLiveId
    },
    order: [
      ['position', 'ASC']
    ],
    attributes: [
      'id', 'name'
    ]
  }).then(function (PlaylistLiveCategory) {
    res.json(PlaylistLiveCategory)
  }).catch(function (error) {
    res.status(500).send(error.message)
  })
})
// Get playlist category
expressApp.get('/manager/api/playlist/live/:playlistId/category/:playlistLiveCategoryId', function (req, res) {
  db.PlaylistLiveCategory.findOne({
    where: {
      id: req.params.playlistLiveCategoryId
    }
  }).then(function (playlistLiveCategory) {
    if (playlistLiveCategory === null) {
      return res.status(404).send('Playlist category not exists')
    }
    res.status(200).send(playlistLiveCategory)
  })
})
// Add playlist live category
expressApp.post('/manager/api/playlist/live/:playlistLiveId/category', async function (req, res) {
  let body = req.body
  // Control parameters
  if (!body.hasOwnProperty('name')) {
    return res.status(400).send('Missing playlist category name')
  }
  // Position
  if (!body.hasOwnProperty('position')) {
    await db.PlaylistLiveCategory.max('position', {
      where: {
        playlistLiveId: req.params.playlistLiveId
      }
    }).then(function (max) {
      if (isNaN(max)) {
        max = 0
      }
      body.position = max + 1
    })
  }
  body.playlistLiveId = req.params.playlistLiveId
  // Add to database
  db.PlaylistLiveCategory.create(body).then(function () {
    res.status(200).send('Live playlist added')
  }).catch(function (error) {
    if (error) {
      res.status(500).send(error.message)
    }
  })
})
// Update playlist live category
expressApp.put('/manager/api/playlist/live/:playlistLiveId/category/:playlistLiveCategoryId', async function (req, res) {
  // Get playlist
  let playlistLiveCategory = await db.PlaylistLiveCategory.findByPk(req.params.playlistLiveCategoryId)
  if (playlistLiveCategory === null) {
    return res.status(400).send('Playlist category not exists')
  }
  // Construct data
  let body = req.body
  let data = []
  if (body.hasOwnProperty('name')) {
    data.name = body.name
  }
  // Position
  if (req.body.hasOwnProperty('position')) {
    // Get max position
    let max = 0
    try {
      max = await db.PlaylistLiveCategory.max('position', {
        where: {
          playlistLiveId: req.params.playlistLiveId
        }
      })
      if (isNaN(max)) {
        max = 0
      }
    } catch (error) {
      return res.status(500).send(error.message)
    }
    data.position = req.body.position
    if (req.body.position < 0 || req.body.position > max) {
      return res.status(400).send('Wrong position value ' + req.body.position)
    }
    if (req.body.position > playlistLiveCategory.position) {
      const transaction = await db.sequelize.transaction()
      try {
        await db.PlaylistLiveCategory.update({ position: db.Sequelize.literal('position - 1') }, {
          where: {
            [db.Sequelize.Op.and]: [
              {position: {[db.Sequelize.Op.gt]: playlistLiveCategory.position}},
              {position: {[db.Sequelize.Op.lte]: req.body.position}},
              {playlistLiveId: req.params.playlistLiveId}
            ]
          }
        }, { transaction: transaction })
        await playlistLiveCategory.update(data, {transaction: transaction})
        await transaction.commit()
      } catch (error) {
        transaction.rollback()
        return res.status(500).send(error.message)
      }
      return res.send('Live playlist category updated')
    } else if (req.body.position < playlistLiveCategory.position) {
      const transaction = await db.sequelize.transaction()
      try {
        await db.PlaylistLiveCategory.update({ position: db.Sequelize.literal('position + 1') }, {
          where: {
            [db.Sequelize.Op.and]: [
              {position: {[db.Sequelize.Op.gte]: req.body.position}},
              {position: {[db.Sequelize.Op.lt]: playlistLiveCategory.position}},
              {playlistLiveId: req.params.playlistLiveId}
            ]
          }
        }, {transaction: transaction})
        await playlistLiveCategory.update(data, {transaction: transaction})
        await transaction.commit()
      } catch (error) {
        transaction.rollback()
        return res.status(500).send(error.message)
      }
      return res.send('Live playlist category updated')
    } else {
      try {
        await playlistLiveCategory.update(data)
      } catch (error) {
        return res.status(500).send(error.message)
      }
      return res.send('Live playlist category updated with the same position')
    }
  } else {
    playlistLiveCategory.update(data).then(function () {
      return res.send('Live playlist category updated')
    }).catch(function (error) {
      return res.status(500).send(error.message)
    })
  }
})
// Delete playlist
expressApp.delete('/manager/api/playlist/live/:playlistLiveId/category/:playlistLiveCategoryId', async function (req, res) {
  let playlistLiveCategory = await db.PlaylistLiveCategory.findByPk(req.params.playlistLiveCategoryId)
  if (playlistLiveCategory === null) {
    return res.status(400).send('Live playlist category not exists')
  }
  const transaction = await db.sequelize.transaction()
  try {
    // Move existing position to position - 1 > new position
    await db.PlaylistLiveCategory.update({ position: db.Sequelize.literal('position - 1') }, {
      where: {
        [db.Sequelize.Op.and]: [
          { playlistLiveId: req.params.playlistLiveId },
          { position: {
            [db.Sequelize.Op.gt]: playlistLiveCategory.position
          }}
        ]
      }
    }, { transaction: transaction })
    // Delete row
    await playlistLiveCategory.destroy()
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    return res.status(500).send(error.message)
  }
  return res.status(200).send('Live playlist category deleted')
})
// List stream to playlist live category
expressApp.get('/manager/api/playlist/live/:playlistLiveId/category/:playlistLiveCategoryId/stream', async function (req, res) {
  // Get playlist streams
  db.PlaylistLiveStream.findAll({
    where: {
      playlistLiveCategoryId: req.params.playlistLiveCategoryId
    },
    order: [
      ['position', 'ASC']
    ],
    include: [{
      model: db.LiveStream,
      include: [db.Provider, db.LiveCategory]
    }]
  }).then(function (streams) {
    let result = []
    for (let streamIndex in streams) {
      let tmpStream = {}
      tmpStream.id = streams[streamIndex].id
      tmpStream.position = streams[streamIndex].position
      tmpStream.name = streams[streamIndex].name !== null ? streams[streamIndex].name : streams[streamIndex].LiveStream.name
      tmpStream.icon = streams[streamIndex].icon !== null ? streams[streamIndex].icon : streams[streamIndex].LiveStream.icon
      tmpStream.epgChannelId = streams[streamIndex].epgChannelId !== null ? streams[streamIndex].epgChannelId : streams[streamIndex].LiveStream.epgChannelId
      tmpStream.streamId = streams[streamIndex].LiveStream.streamId
      tmpStream.archive = streams[streamIndex].LiveStream.archive
      tmpStream.archiveDuration = streams[streamIndex].LiveStream.archiveDuration
      tmpStream.provider = streams[streamIndex].LiveStream.Provider.name
      tmpStream.providerCategory = streams[streamIndex].LiveStream.LiveCategory.name
      tmpStream.providerStreamName = streams[streamIndex].LiveStream.name
      result.push(tmpStream)
    }
    res.json(result)
  })
})
// Get stream playlist entry
expressApp.get('/manager/api/playlist/live/:playlistLiveId/category/:playlistLiveCategoryId/stream/:streamId', function (req, res) {
  db.PlaylistLiveStream.findOne({
    where: {
      id: req.params.streamId
    },
    include: [{
      model: db.LiveStream,
      include: [db.Provider]
    }]
  }).then(function (playlistLiveStream) {
    if (playlistLiveStream === null) {
      return res.status(404).send('Playlist category not exists')
    }
    res.status(200).send(playlistLiveStream)
  })
})
// Add stream playlist entry
expressApp.post('/manager/api/playlist/live/:playlistLiveId/category/:playlistLiveCategoryId/stream', async function (req, res) {
  let body = req.body
  // Control parameters
  if (!body.hasOwnProperty('streamId')) {
    return res.status(400).send('Missing streamId')
  }
  if (!body.hasOwnProperty('position')) {
    await db.PlaylistLiveStream.max('position', {
      where: {
        playlistLiveCategoryId: req.params.playlistLiveCategoryId
      }
    }).then(function (max) {
      if (isNaN(max)) {
        max = 0
      }
      body.position = max + 1
    })
  }
  // Verify streamId
  let liveStream = await db.LiveStream.findByPk(body.streamId)
  if (liveStream === null) {
    return res.status(400).send('Wrong or unknown streamId')
  }
  // Add entry
  body.liveStreamId = body.streamId
  body.playlistLiveCategoryId = req.params.playlistLiveCategoryId
  const transaction = await db.sequelize.transaction()
  try {
    // Move existing position to position + 1 > new position
    await db.PlaylistLiveStream.update({ position: db.Sequelize.literal('position + 1') }, {
      where: {
        [db.Sequelize.Op.and]: [
          { playlistLiveCategoryId: req.params.playlistLiveCategoryId },
          { position: {
            [db.Sequelize.Op.gte]: body.position
          }}
        ]
      }
    }, {transaction: transaction})
    // Add row
    await db.PlaylistLiveStream.create(body, {transaction: transaction})
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    return res.status(500).send(error.message)
  }
  return res.send('Playlist entry added')
})
// Update stream playlist entry
expressApp.put('/manager/api/playlist/live/:playlistLiveId/category/:playlistLiveCategoryId/stream/:streamId', async function (req, res) {
  // Get stream
  let playlistLiveStream = await db.PlaylistLiveStream.findByPk(req.params.streamId)
  if (playlistLiveStream === null) {
    return res.status(400).send('Unknown streamId')
  }
  let data = {}
  if (req.body.hasOwnProperty('streamId')) {
    data.liveStreamId = req.body.streamId
  }
  if (req.body.hasOwnProperty('name')) {
    if (req.body.name === '') {
      data.name = null
    } else {
      data.name = req.body.name
    }
  }
  if (req.body.hasOwnProperty('epgChannelId')) {
    if (req.body.epgChannelId === '') {
      data.epgChannelId = null
    } else {
      data.epgChannelId = req.body.epgChannelId
    }
  }
  if (req.body.hasOwnProperty('icon')) {
    if (req.body.icon === '') {
      data.icon = null
    } else {
      data.icon = req.body.icon
    }
  }
  // Position
  if (req.body.hasOwnProperty('position')) {
    // Get max position
    let max = 0
    try {
      max = await db.PlaylistLiveStream.max('position', {
        where: {
          playlistLiveCategoryId: req.params.playlistLiveCategoryId
        }
      })
      if (isNaN(max)) {
        max = 0
      }
    } catch (error) {
      return res.status(500).send(error.message)
    }
    data.position = req.body.position
    if (req.body.position < 0 || req.body.position > max) {
      return res.status(400).send('Wrong position value ' + req.body.position)
    }
    if (req.body.position > playlistLiveStream.position) {
      const transaction = await db.sequelize.transaction()
      try {
        await db.PlaylistLiveStream.update({ position: db.Sequelize.literal('position - 1') }, {
          where: {
            [db.Sequelize.Op.and]: [
              {position: {[db.Sequelize.Op.gt]: playlistLiveStream.position}},
              {position: {[db.Sequelize.Op.lte]: req.body.position}},
              {playlistLiveCategoryId: req.params.playlistLiveCategoryId}
            ]
          }
        }, { transaction: transaction })
        await playlistLiveStream.update(data, {transaction: transaction})
        await transaction.commit()
      } catch (error) {
        transaction.rollback()
        return res.status(500).send(error.message)
      }
    } else if (req.body.position < playlistLiveStream.position) {
      const transaction = await db.sequelize.transaction()
      try {
        await db.PlaylistLiveStream.update({ position: db.Sequelize.literal('position + 1') }, {
          where: {
            [db.Sequelize.Op.and]: [
              {position: {[db.Sequelize.Op.gte]: req.body.position}},
              {position: {[db.Sequelize.Op.lt]: playlistLiveStream.position}},
              {playlistLiveCategoryId: req.params.playlistLiveCategoryId}
            ]
          }
        }, {transaction: transaction})
        await playlistLiveStream.update(data, {transaction: transaction})
        await transaction.commit()
      } catch (error) {
        transaction.rollback()
        return res.status(500).send(error.message)
      }
    } else {
      playlistLiveStream.update(data).catch(function (error) {
        return res.status(500).send(error.message)
      })
    }
  } else {
    playlistLiveStream.update(data).catch(function (error) {
      return res.status(500).send(error.message)
    })
  }
  return res.send('Playlist stream updated')
})
// Delete stream playlist entry
expressApp.delete('/manager/api/playlist/live/:playlistLiveId/category/:playlistLiveCategoryId/stream/:streamId', async function (req, res) {
  // Get stream
  let playlistLiveStream = {}
  try {
    playlistLiveStream = await db.PlaylistLiveStream.findOne({
      where: {
        id: req.params.streamId
      }
    })
  } catch (error) {
    return res.status(500).send(error.message)
  }
  if (playlistLiveStream === null) {
    return res.status(400).send('Unknown streamId')
  }
  let currentPosition = playlistLiveStream.position
  const transaction = await db.sequelize.transaction()
  try {
    // Move existing position to position - 1 > new position
    await db.PlaylistLiveStream.update({ position: db.Sequelize.literal('position - 1') }, {
      where: {
        [db.Sequelize.Op.and]: [
          { playlistLiveCategoryId: req.params.playlistLiveCategoryId },
          { position: {
            [db.Sequelize.Op.gt]: currentPosition
          }}
        ]
      }
    }, { transaction: transaction })
    // Delete row
    await playlistLiveStream.destroy({ transaction: transaction })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    return res.status(500).send(error.message)
  }
  return res.send('Playlist entry removed')
})
// Download M3U playlist
expressApp.get('/manager/api/provider/:providerId/live/playlist/:playlistId/m3u', function (req, res) {

})
/**
 * Xtream Codes adapter
 * ----------------------------------------------------------------------------
 */
// Download M3U
expressApp.get('/get.php', function (req, res) {
  if (!req.query.hasOwnProperty('username') || !req.query.hasOwnProperty('password')) {
    return res.status(400).send('Bad request')
  }
  // Get playlist infos
  db.PlaylistLiveStream.findAll({
    where: {
      '$PlaylistLiveCategory.playlistLiveId$': req.query.username
    },
    include: [
      {
        model: db.PlaylistLiveCategory,
        as: db.PlaylistLiveCategory.tableName,
        include: [
          {
            model: db.PlaylistLive,
            as: db.PlaylistLive.tableName
          }
        ]
      },
      {
        model: db.LiveStream,
        include: [db.Provider]
      }
    ],
    order: [
      [db.PlaylistLiveCategory, 'position', 'ASC'],
      ['position', 'ASC']
    ]
  }).then(function (streams) {
    if (streams.length > 0) {
      res.setHeader('Content-disposition', 'attachment; filename="' + streams[0].PlaylistLiveCategory.PlaylistLive.name + '.m3u"');
      res.write('#EXTM3U\n')
      for (let index in streams) {
        // Stream info
        let name = streams[index].name === null ? streams[index].LiveStream.name : streams[index].name
        let logo = streams[index].icon === null ? streams[index].LiveStream.icon : streams[index].icon
        let epgId = streams[index].epgChannelId === null ? streams[index].LiveStream.epgChannelId === null ? "" : streams[index].LiveStream.epgChannelId : streams[index].epgChannelId
        res.write('#EXTINF:-1 tvg-id="' + epgId + '" tvg-name="' + name + '" tvg-logo="' + logo + '" tvg-rec="' + streams[index].LiveStream.archiveDuration + '" timeshift="' + streams[index].LiveStream.archiveDuration + '" group-title="' + streams[index].PlaylistLiveCategory.name + '",' + name + '\n')
        // Stream url
        res.write('http://' + streams[index].LiveStream.Provider.host + ':' + streams[index].LiveStream.Provider.port + '/' + streams[index].LiveStream.Provider.username + '/' + streams[index].LiveStream.Provider.password + '/' + streams[index].LiveStream.streamId + '\n')
      }
      res.end()
    } else {
      res.send('#EXTM3U\n')
    }
  })
})
// Xtream API
expressApp.get('/player_api.php', function (req, res) {
  if (!req.query.hasOwnProperty('username') || !req.query.hasOwnProperty('password')) {
    return res.status(400).send('Bad request')
  }
  switch (req.query.action) {
    case 'get_live_categories':
      // List live categories
      db.PlaylistLiveCategory.findAll({
        where: {
          playlistLiveId: req.query.username
        },
        order: [
          ['position', 'ASC']
        ],
        attributes: [
          'id', 'name'
        ]
      }).then(function (PlaylistLiveCategory) {
        let responseCategory = []
        for (let index in PlaylistLiveCategory) {
          responseCategory.push({
            category_id: PlaylistLiveCategory[index].id,
            category_name: PlaylistLiveCategory[index].name,
            parent_id: 0
          })
        }
        return res.json(responseCategory)
      })
      break
    case 'get_live_streams':
      let whereQuery = {}
      if (req.query.hasOwnProperty('category_id')) {
        whereQuery = {
          playlistLiveCategoryId: req.query.category_id
        }
      }
      // List category live streams
      db.PlaylistLiveStream.findAll({
        where: whereQuery,
        order: [
          ['position', 'ASC']
        ],
        include: [db.LiveStream]
      }).then(function (streams) {
        let responseStream = []
        for (let index in streams) {
          responseStream.push({
            num: streams[index].position,
            name: streams[index].name === null ? streams[index].LiveStream.name : streams[index].name,
            stream_type: 'live',
            stream_id: streams[index].liveStreamId,
            stream_icon: streams[index].icon === null ? streams[index].LiveStream.icon : streams[index].icon,
            epg_channel_id: streams[index].epgChannelId === null ? streams[index].LiveStream.epgChannelId === null ? "" : streams[index].LiveStream.epgChannelId : streams[index].epgChannelId,
            added: String(Date.parse(streams[index].createdAt) / 1000),
            category_id: req.query.category_id,
            custom_sid: streams[index].LiveStream.serviceId,
            tv_archive: streams[index].LiveStream.archive,
            direct_source: '',
            tv_archive_duration: streams[index].LiveStream.archiveDuration
          })
        }
        return res.json(responseStream)
      })
      break
    case 'get_short_epg':
      // Verify input
      if (!req.query.hasOwnProperty('username') || !req.query.hasOwnProperty('password')) {
        return res.status(400).send('Bad request')
      }
      if (!req.query.hasOwnProperty('stream_id')) {
        return res.status(200).json({ epg_listings: [] })
      }
      // Redirect to provider url
      db.PlaylistLiveStream.findOne({
        where: {
          id: req.query.stream_id
        },
        include: [{
          model: db.LiveStream, 
          include: [db.Provider]
        }]
      }).then(function (stream) {
        if (stream === null) {
          return res.status(200).json({ epg_listings: [] })
        }
        return res.redirect('http://' + stream.LiveStream.Provider.host + ':' + stream.LiveStream.Provider.port + '/player_api.php?username=' + stream.LiveStream.Provider.username + '&password=' + stream.LiveStream.Provider.password + '&action=get_short_epg&stream_id=' + stream.LiveStream.streamId)
      })
      break
    case 'get_simple_data_table':
      // Verify input
      if (!req.query.hasOwnProperty('username') || !req.query.hasOwnProperty('password')) {
        return res.status(400).send('Bad request')
      }
      if (!req.query.hasOwnProperty('stream_id')) {
        return res.status(200).json({ epg_listings: [] })
      }
      // Redirect to provider url
      db.PlaylistLiveStream.findOne({
        where: {
          id: req.query.stream_id
        },
        include: [{
          model: db.LiveStream, 
          include: [db.Provider]
        }]
      }).then(function (stream) {
        if (stream === null) {
          return res.status(200).json({ epg_listings: [] })
        }
        return res.redirect('http://' + stream.LiveStream.Provider.host + ':' + stream.LiveStream.Provider.port + '/player_api.php?username=' + stream.LiveStream.Provider.username + '&password=' + stream.LiveStream.Provider.password + '&action=get_simple_data_table&stream_id=' + stream.LiveStream.streamId)
      })
      break
    default:
      db.Provider.findAll().then(function (providers) {
        if (providers === null) {
          return res.status(404).send('No provider available')
        }
        res.redirect('http://' + providers[0].host + ':' + providers[0].port + '/player_api.php?username=' + providers[0].username + '&password=' + providers[0].password)
      }).catch(function (error) {
        res.status(500).send(error.message)
      })
      break
  }
})
// Timeshift
expressApp.get(['/streaming/timeshift.php', '/timeshift/:username/:password/:duration/:start/:streamId.:extension', '/timeshifts/:username/:password/:duration/:start/:streamId.:extension'], function (req, res) {

})
// Play list stream
expressApp.get('/:username/:password/:id', function (req, res) {

})
// EPG
expressApp.get('/xmltv.php', function (req, res) {
  if (!req.query.hasOwnProperty('username') || !req.query.hasOwnProperty('password')) {
    return res.status(400).send('Bad request')
  }
  // Get playlist infos
  db.PlaylistLive.findOne({
    where: {
      id: req.query.username
    },
    include: [db.Provider]
  }).then(function (playlist) {
    if (playlist.Provider !== null) {
      // Redirect to EPG provider
      return res.redirect('http://' + playlist.Provider.host + ':' + playlist.Provider.port + '/xmltv.php?username=' + playlist.Provider.username + '&password=' + playlist.Provider.password)
    } else {
      // Get first provider
      db.Provider.findAll().then(function (providers) {
        return res.redirect('http://' + providers[0].host + ':' + providers[0].port + '/xmltv.php?username=' + providers[0].username + '&password=' + providers[0].password)
      })
    }
  })
})
// Play live stream
expressApp.get(['/streaming/client_live.php', '/live/:username/:password/:streamId', '/live/:username/:password/:streamId.:extension', '/:username/:password/:streamId.:extension', '/:streamId.:extension', '/ch:streamId.m3u8', '/hls/:username/:password/:streamId/:token/:segment', '/hlsr/:username/:password/:streamId/:token/:segment'], function (req, res) {

})
// Redirect to manager interface
expressApp.get('/', function (req, res) {
  res.redirect('/manager')
})

// Start service
expressApp.listen(process.env.LISTEN || 3000, async function () {
  console.log('Playlist editor listening on ' + (process.env.LISTEN || 3000))
  open('http://localhost:' + (process.env.LISTEN || 3000))
})

// Request HTTP
let requestProvider = function (provider, parameters) {
  let query = parameters
  query.username = provider.username
  query.password = provider.password
  return new Promise(function (resolve, reject) {
    fetch('http://' + provider.host + ':' + provider.port + '/player_api.php?' + querystring.stringify(query)).then(function (result) {
      if (result.status !== 200) {
        return reject(new Error('Status ' + result.status))
      }
      return resolve(result.json())
    }).catch (function (error) {
      return reject(error)
    })
  })
}
