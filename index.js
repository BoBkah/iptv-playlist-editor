const os = require('os')
const IS_PACKAGED = process.argv[0].indexOf(os.platform() === 'win32' ? 'node.exe' : 'node') === -1
console.log(IS_PACKAGED ? 'Packaged version' : 'Dev version')
// Rename native modules (pkg)
const fs = require('fs-extra')
const path = require('path')
/*
fs.ensureDirSync('ipe')
process.chdir('ipe')
console.log(fs.readdirSync('.'))
if (IS_PACKAGED) {
  let files = [
    '../node_modules/sqlite3/lib/binding/node-v72-darwin-x64/node_sqlite3.foolpkg',
    '../node_modules/fsevents/fsevents.foolpkg'
  ]
  for (let fileIndex in files) {
    if (fs.existsSync(files[fileIndex])) {
      console.log('Rename file ' + files[fileIndex])
      fs.writeFileSync(
        path.basename(files[fileIndex]),
        fs.readFileSync(
          path.join(__dirname, files[fileIndex].replace('.node', '.foolpkg'))
        )
      )
    } else {
      console.log('File ' + files[fileIndex] + ' not found')
    }
  }
}
*/
const compression = require('compression')
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const moment = require('moment')
const nodemailer = require('nodemailer')
const open = require('open')
const querystring = require('querystring')
const xmlescape = require('xml-escape')
const db = require('./models')
const epgGrabber = require('./epg_grabber')
const env = process.env.NODE_ENV || 'development'
const i18n = require('i18n')
const hbs = require('hbs')

moment.suppressDeprecationWarnings = true

// Load config
const configData = fs.readFileSync(path.join(process.cwd(), 'config/config.json'))
const config = JSON.parse(configData)[env]
// Email transporter
const mailTransporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.username,
    pass: config.email.password
  },
  tls: {
    rejectUnauthorized: false
  }
})
// Migrate database
db.migrate().then(function () {
  epgGrabber.init(db)
})
// i18n configuration
i18n.configure({
  locales: ['en', 'fr'],
  cookie: 'locales',
  directory: path.join(__dirname, '/locales')
})
// Express server init
const expressApp = express()
expressApp.use(compression())
expressApp.use(express.static(path.join(__dirname, '/views')))
expressApp.set('views', path.join(__dirname, '/views'))
expressApp.set('view engine', 'hbs')
expressApp.engine('hbs', hbs.__express)
expressApp.use(i18n.init)
expressApp.use(bodyParser.json())
expressApp.use(bodyParser.urlencoded({ extended: true }))
// Handlebars init
hbs.registerHelper('__', function () {
  return i18n.__.apply(this, arguments)
})
hbs.registerHelper('__n', function () {
  return i18n.__n.apply(this, arguments)
})
// Logs
expressApp.use(function (req, res, next) {
  console.log('[API] ' + req.connection.remoteAddress + ' "' + req.method + ' ' + req._parsedUrl.path + '"')
  next()
})
// Manager interface
expressApp.get('/manager', function (req, res) {
  res.render('index')
  /*
  res.sendFile('./views/index.html', {
    root: __dirname
  })
  */
})
/**
 * EPG
 */
// List EPGs
expressApp.get('/manager/api/epg', function (req, res) {
  db.Epg.findAll({
    include: [{
      model: db.Provider
    }],
    order: [
      ['name', 'ASC']
    ]
  }).then(async function (epgs) {
    const result = []
    for (const epgIndex in epgs) {
      const channels = await db.EpgTag.aggregate('channel', 'count', {
        where: {
          epgId: epgs[epgIndex].id
        },
        distinct: true
      })
      const dates = await db.EpgTag.findOne({
        raw: true,
        attributes: [
          [db.Sequelize.fn('min', db.Sequelize.col('EpgTag.start')), 'min'],
          [db.Sequelize.fn('max', db.Sequelize.col('EpgTag.start')), 'max']
        ],
        where: {
          epgId: epgs[epgIndex].id
        }
      })
      result.push({
        id: epgs[epgIndex].id,
        name: epgs[epgIndex].name,
        channels: channels,
        min: dates.min,
        max: dates.max,
        status: epgs[epgIndex].status
      })
    }
    res.json(result)
  }).catch(function (error) {
    if (error) {
      res.status(500).send(error.message)
    }
  })
})
// Search channel
expressApp.get('/manager/api/epg/channel/:query', async function (req, res) {
  const channels = await db.EpgTag.findAll({
    where: {
      channel: {
        [db.Sequelize.Op.like]: '%' + req.params.query + '%'
      }
    },
    attributes: [
      'channel'
    ],
    group: [
      'channel'
    ],
    order: [
      'channel'
    ]
  })
  const result = []
  for (const channelIndex in channels) {
    result.push(channels[channelIndex].channel)
  }
  res.json(result)
})
// Get EPG info
expressApp.get('/manager/api/epg/:epgId', function (req, res) {
  db.Epg.findOne({
    where: {
      id: req.params.epgId
    }
  }).then(function (epg) {
    if (epg === null) {
      return res.status(404).send('EPG not exists')
    }
    res.status(200).send(epg)
  })
})
// Update Epg
expressApp.put('/manager/api/epg/:epgId', async function (req, res) {
  // Get EPG
  const epg = await db.Epg.findByPk(req.params.epgId)
  if (epg === null) {
    return res.status(400).send('EPG not exists')
  }
  // Construct data
  const body = req.body
  const data = []
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    data.status = body.status
  }
  db.Epg.update(data, { where: { id: req.params.epgId } }).then(function () {
    return res.status(200).send('EPG updated')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
// Update EPG catalog
expressApp.get('/manager/api/epg/:epgId/update', async function (req, res) {
  for (const grabberIndex in epgGrabber.grabber) {
    if (epgGrabber.grabber[grabberIndex].epgid === parseInt(req.params.epgId)) {
      await epgGrabber.grabber[grabberIndex].updateEpg()
      return res.status(200).send('EPG updated')
    }
  }
  return res.status(404).send('EPG grabber not found')
})
// Delete EPG
expressApp.delete('/manager/api/epg/:epgId', async function (req, res) {
  const epg = await db.Epg.findByPk(req.params.epgId)
  if (epg === null) {
    return res.status(400).send('EPG not exists')
  }
  epg.destroy().then(function () {
    res.status(200).send('EPG deleted')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
/**
 * Provider
 * ----------------------------------------------------------------------------
 */
// List providers
expressApp.get('/manager/api/provider', function (req, res) {
  db.Provider.findAll({
    order: [
      ['name', 'ASC']
    ]
  }).then(function (providers) {
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
  const body = req.body
  // Control parameters
  if (!Object.prototype.hasOwnProperty.call(body, 'name')) {
    return res.status(400).send('Missing provider name')
  }
  if (!Object.prototype.hasOwnProperty.call(body, 'host')) {
    return res.status(400).send('Missing provider host')
  }
  if (!Object.prototype.hasOwnProperty.call(body, 'port')) {
    return res.status(400).send('Missing provider port')
  }
  if (!Object.prototype.hasOwnProperty.call(body, 'username')) {
    return res.status(400).send('Missing provider username')
  }
  if (!Object.prototype.hasOwnProperty.call(body, 'password')) {
    return res.status(400).send('Missing provider password')
  }
  // Add to database
  db.Provider.create(body).then(function (provider) {
    res.status(200).json({
      message: 'Provider successfully added',
      providerId: provider.id
    })
    // Add provider EPG
    epgGrabber.addProvider(provider)
  }).catch(function (error) {
    if (error) {
      console.error(error)
      res.status(500).send(error.message)
    }
  })
})
// Update provider
expressApp.put('/manager/api/provider/:providerId', async function (req, res) {
  // Get provider
  const provider = await db.Provider.findByPk(req.params.providerId)
  if (provider === null) {
    return res.status(400).send('Provider not exists')
  }
  // Construct data
  const body = req.body
  const data = []
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    data.name = body.name
  }
  if (Object.prototype.hasOwnProperty.call(body, 'host')) {
    data.host = body.host
  }
  if (Object.prototype.hasOwnProperty.call(body, 'port')) {
    data.port = body.port
  }
  if (Object.prototype.hasOwnProperty.call(body, 'username')) {
    data.username = body.username
  }
  if (Object.prototype.hasOwnProperty.call(body, 'password')) {
    data.password = body.password
  }
  db.Provider.update(data, { where: { id: req.params.providerId } }).then(function () {
    return res.status(200).send('Provider updated')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
// Delete provider
expressApp.delete('/manager/api/provider/:providerId', async function (req, res) {
  const provider = await db.Provider.findByPk(req.params.providerId)
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
  const startSyncAt = new Date()
  const actionList = []
  // Get provider infos
  const provider = await db.Provider.findByPk(req.params.providerId)
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
  for (const index in providerCategory) {
    // Find category
    const result = await db.LiveCategory.findOne({
      where: {
        providerId: provider.id,
        categoryId: providerCategory[index].category_id
      }
    })
    if (result === null) {
      // Add it
      const liveCategoryCreated = await db.LiveCategory.create({
        name: providerCategory[index].category_name,
        categoryId: providerCategory[index].category_id,
        providerId: provider.id
      })
      if (liveCategoryCreated !== null) {
        localCategory[providerCategory[index].category_id] = liveCategoryCreated.id
      }
      actionList.push({
        context: 'category',
        action: 'add',
        message: providerCategory[index].category_name
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
  for (const index in providerLiveStream) {
    // Find stream
    const result = await db.LiveStream.findOne({
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
        context: 'stream',
        action: 'add',
        message: providerLiveStream[index].name.trim()
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
    const categoryList = await db.LiveCategory.findAll({
      where: {
        providerId: provider.id,
        updatedAt: {
          [db.Sequelize.Op.lt]: startSyncAt
        }
      }
    })
    for (const categoryIndex in categoryList) {
      actionList.push({
        context: 'category',
        action: 'delete',
        message: categoryList[categoryIndex].name
      })
    }
    const streamList = await db.LiveStream.findAll({
      where: {
        providerId: provider.id,
        updatedAt: {
          [db.Sequelize.Op.lt]: startSyncAt
        }
      }
    })
    for (const streamIndex in streamList) {
      actionList.push({
        context: 'stream',
        action: 'delete',
        message: streamList[streamIndex].name
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
  if (actionList.length > 0) {
    let message = ''
    for (const actionIndex in actionList) {
      message += 'Context: ' + actionList[actionIndex].context + '\n'
      message += 'Action: ' + actionList[actionIndex].action + '\n'
      message += 'Message: ' + actionList[actionIndex].message + '\n\n'
    }
    try {
      await mailTransporter.sendMail({
        from: 'Xtream Playlist Editor <noreply@local>',
        to: config.email.mailAddress,
        subject: 'Changes for provider ' + provider.name,
        text: message
      })
    } catch (error) {}
  }
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
    },
    order: [
      ['position', 'ASC']
    ]
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
    ],
    include: {
      model: db.Epg
    }
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
    },
    include: {
      model: db.Epg
    }
  }).then(function (playlistLive) {
    if (playlistLive === null) {
      return res.status(404).send('playlistLive not exists')
    }
    res.status(200).send(playlistLive)
  })
})
// Add playlist live
expressApp.post('/manager/api/playlist/live', async function (req, res) {
  const body = req.body
  // Control parameters
  if (!Object.prototype.hasOwnProperty.call(body, 'name')) {
    return res.status(400).send('Missing playlist name')
  }
  // Add to database
  await db.PlaylistLive.create(body).then(async function (playlistLive) {
    // EPG
    if (Object.prototype.hasOwnProperty.call(body, 'epg')) {
      for (const epgIndex in body.epg) {
        if (!Object.prototype.hasOwnProperty.call(body.epg[epgIndex], 'id')) {
          continue
        }
        const epg = await db.Epg.findByPk(body.epg[epgIndex].id)
        if (epg !== null) {
          await playlistLive.addEpg(epg, { through: { priority: Object.prototype.hasOwnProperty.call(body.epg[epgIndex], 'priority') ? body.epg[epgIndex].priority : 0 } })
        }
      }
    }
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
  const playlistLive = await db.PlaylistLive.findByPk(req.params.playlistLiveId)
  if (playlistLive === null) {
    return res.status(400).send('Playlist not exists')
  }
  // Construct data
  const body = req.body
  const data = []
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    data.name = body.name
  }
  if (Object.prototype.hasOwnProperty.call(body, 'password')) {
    data.password = body.password
  }
  // Update
  db.PlaylistLive.update(data, { where: { id: req.params.playlistLiveId } }).then(async function () {
    // EPG
    if (Object.prototype.hasOwnProperty.call(body, 'epg')) {
      playlistLive.setEpgs([])
      for (const epgIndex in body.epg) {
        const epg = await db.Epg.findByPk(body.epg[epgIndex].id)
        if (epg !== null) {
          await playlistLive.addEpg(epg, { through: { priority: Object.prototype.hasOwnProperty.call(body.epg[epgIndex], 'priority') ? body.epg[epgIndex].priority : 0 } })
        }
      }
    }
    return res.status(200).send('Playlist updated')
  }).catch(function (error) {
    return res.status(500).send(error.message)
  })
})
// Delete playlist
expressApp.delete('/manager/api/playlist/live/:playlistLiveId', async function (req, res) {
  const playlistLive = await db.PlaylistLive.findByPk(req.params.playlistLiveId)
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
  const body = req.body
  // Control parameters
  if (!Object.prototype.hasOwnProperty.call(body, 'name')) {
    return res.status(400).send('Missing playlist category name')
  }
  // Position
  if (!Object.prototype.hasOwnProperty.call(body, 'position')) {
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
  const playlistLiveCategory = await db.PlaylistLiveCategory.findByPk(req.params.playlistLiveCategoryId)
  if (playlistLiveCategory === null) {
    return res.status(400).send('Playlist category not exists')
  }
  // Construct data
  const body = req.body
  const data = []
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    data.name = body.name
  }
  // Position
  if (Object.prototype.hasOwnProperty.call(req.body, 'position')) {
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
              { position: { [db.Sequelize.Op.gt]: playlistLiveCategory.position } },
              { position: { [db.Sequelize.Op.lte]: req.body.position } },
              { playlistLiveId: req.params.playlistLiveId }
            ]
          }
        }, { transaction: transaction })
        await playlistLiveCategory.update(data, { transaction: transaction })
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
              { position: { [db.Sequelize.Op.gte]: req.body.position } },
              { position: { [db.Sequelize.Op.lt]: playlistLiveCategory.position } },
              { playlistLiveId: req.params.playlistLiveId }
            ]
          }
        }, { transaction: transaction })
        await playlistLiveCategory.update(data, { transaction: transaction })
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
  const playlistLiveCategory = await db.PlaylistLiveCategory.findByPk(req.params.playlistLiveCategoryId)
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
          {
            position: {
              [db.Sequelize.Op.gt]: playlistLiveCategory.position
            }
          }
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
    const result = []
    for (const streamIndex in streams) {
      const tmpStream = {}
      tmpStream.id = streams[streamIndex].id
      tmpStream.position = streams[streamIndex].position
      tmpStream.originalName = streams[streamIndex].LiveStream.name
      tmpStream.customName = streams[streamIndex].name
      tmpStream.name = streams[streamIndex].name !== null ? streams[streamIndex].name : streams[streamIndex].LiveStream.name
      tmpStream.originalIcon = streams[streamIndex].LiveStream.icon
      tmpStream.customIcon = streams[streamIndex].icon
      tmpStream.icon = streams[streamIndex].icon !== null ? streams[streamIndex].icon : streams[streamIndex].LiveStream.icon
      tmpStream.originalEpgChannelId = streams[streamIndex].LiveStream.epgChannelId
      tmpStream.customEpgChannelId = streams[streamIndex].epgChannelId
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
  const body = req.body
  // Control parameters
  if (!Object.prototype.hasOwnProperty.call(body, 'streamId')) {
    return res.status(400).send('Missing streamId')
  }
  if (!Object.prototype.hasOwnProperty.call(body, 'position')) {
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
  const liveStream = await db.LiveStream.findByPk(body.streamId)
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
          {
            position: {
              [db.Sequelize.Op.gte]: body.position
            }
          }
        ]
      }
    }, { transaction: transaction })
    // Add row
    await db.PlaylistLiveStream.create(body, { transaction: transaction })
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
  const playlistLiveStream = await db.PlaylistLiveStream.findByPk(req.params.streamId)
  if (playlistLiveStream === null) {
    return res.status(400).send('Unknown streamId')
  }
  const data = {}
  if (Object.prototype.hasOwnProperty.call(req.body, 'streamId')) {
    data.liveStreamId = req.body.streamId
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
    if (req.body.name === '') {
      data.name = null
    } else {
      data.name = req.body.name
    }
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'epgChannelId')) {
    if (req.body.epgChannelId === '') {
      data.epgChannelId = null
    } else {
      data.epgChannelId = req.body.epgChannelId
    }
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'icon')) {
    if (req.body.icon === '') {
      data.icon = null
    } else {
      data.icon = req.body.icon
    }
  }
  // Position
  if (Object.prototype.hasOwnProperty.call(req.body, 'position')) {
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
              { position: { [db.Sequelize.Op.gt]: playlistLiveStream.position } },
              { position: { [db.Sequelize.Op.lte]: req.body.position } },
              { playlistLiveCategoryId: req.params.playlistLiveCategoryId }
            ]
          }
        }, { transaction: transaction })
        await playlistLiveStream.update(data, { transaction: transaction })
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
              { position: { [db.Sequelize.Op.gte]: req.body.position } },
              { position: { [db.Sequelize.Op.lt]: playlistLiveStream.position } },
              { playlistLiveCategoryId: req.params.playlistLiveCategoryId }
            ]
          }
        }, { transaction: transaction })
        await playlistLiveStream.update(data, { transaction: transaction })
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
  const currentPosition = playlistLiveStream.position
  const transaction = await db.sequelize.transaction()
  try {
    // Move existing position to position - 1 > new position
    await db.PlaylistLiveStream.update({ position: db.Sequelize.literal('position - 1') }, {
      where: {
        [db.Sequelize.Op.and]: [
          { playlistLiveCategoryId: req.params.playlistLiveCategoryId },
          {
            position: {
              [db.Sequelize.Op.gt]: currentPosition
            }
          }
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
/**
 * Xtream Codes adapter
 * ----------------------------------------------------------------------------
 */
// Download M3U
expressApp.get('/get.php', async function (req, res) {
  if (!Object.prototype.hasOwnProperty.call(req.query, 'username') || !Object.prototype.hasOwnProperty.call(req.query, 'password')) {
    return res.status(400).send('Bad request')
  }
  if (!await grantAccess(req.query.username, req.query.password)) {
    return res.status(401).send('Wrong username/password')
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
      res.setHeader('Content-disposition', 'attachment; filename="' + streams[0].PlaylistLiveCategory.PlaylistLive.name + '.m3u"')
      res.write('#EXTM3U\n')
      for (const index in streams) {
        // Stream info
        const name = streams[index].name === null ? streams[index].LiveStream.name : streams[index].name
        const logo = streams[index].icon === null ? streams[index].LiveStream.icon : streams[index].icon
        const epgId = streams[index].epgChannelId === null ? streams[index].LiveStream.epgChannelId === null ? '' : streams[index].LiveStream.epgChannelId : streams[index].epgChannelId
        res.write('#EXTINF:-1 tvg-id="' + epgId.toLowerCase() + '" tvg-name="' + name.toLowerCase() + '" tvg-logo="' + logo + '" tvg-rec="' + streams[index].LiveStream.archiveDuration + '" timeshift="' + streams[index].LiveStream.archiveDuration + '" group-title="' + streams[index].PlaylistLiveCategory.name + '",' + name + '\n')
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
expressApp.post('/panel_api.php', async function (req, res) {
  if (!Object.prototype.hasOwnProperty.call(req.body, 'username') || !Object.prototype.hasOwnProperty.call(req.body, 'password')) {
    return res.status(400).send('Bad request')
  }
  if (!await grantAccess(req.body.username, req.body.password)) {
    return res.status(401).send('Wrong username/password')
  }
  const action = Object.prototype.hasOwnProperty.call(req.params, 'action') ? req.params.action : ''
  switch (action) {
    case 'get_epg':
      break
    default:
      db.Provider.findAll().then(async function (providers) {
        if (providers === null) {
          return res.status(404).send('No provider available')
        }
        const playlistLive = await db.PlaylistLive.findByPk(req.body.username)
        if (playlistLive === null) {
          return res.status(404).send('No playlist available')
        }
        fetch('http://' + providers[0].host + ':' + providers[0].port + '/player_api.php?username=' + providers[0].username + '&password=' + providers[0].password).then(function (result) {
          return result.json()
        }).then(async function (result) {
          console.log(req.headers.host.split(':').shift())
          console.log(req.headers.host.split(':').pop())
          const output = {
            user_info: {
              username: req.body.username,
              password: req.body.password,
              auth: 1,
              status: 'Active',
              exp_date: '1593590150',
              is_trial: '0',
              active_cons: 0,
              created_at: parseInt(playlistLive.createdAt.getTime() / 1000),
              max_connections: result.user_info.max_connections,
              allowed_output_formats: result.user_info.allowed_output_formats
            },
            server_info: {
              url: req.hostname,
              port: req.headers.host.split(':').pop(),
              server_protocol: 'http'
            },
            available_channels: {},
            categories: {
              live: [],
              series: [],
              movie: []
            }
          }
          // Get live categories
          const liveCategories = await db.PlaylistLiveCategory.findAll({
            where: {
              playlistLiveId: req.body.username
            },
            order: [
              ['position', 'ASC']
            ],
            attributes: [
              'id', 'name'
            ]
          })
          for (const liveCategoriesIndex in liveCategories) {
            output.categories.live.push({
              category_id: liveCategories[liveCategoriesIndex].id,
              category_name: liveCategories[liveCategoriesIndex].name,
              parent_id: 0
            })
          }
          // Get live channels
          const streams = await db.PlaylistLiveStream.findAll({
            order: [
              ['position', 'ASC']
            ],
            include: [db.LiveStream, db.PlaylistLiveCategory]
          })
          for (const index in streams) {
            output.available_channels[streams[index].id] = {
              num: streams[index].position,
              name: streams[index].name === null ? streams[index].LiveStream.name : streams[index].name,
              stream_type: 'live',
              type_name: 'Live Streams',
              stream_id: streams[index].liveStreamId,
              stream_icon: streams[index].icon === null ? streams[index].LiveStream.icon : streams[index].icon,
              epg_channel_id: streams[index].epgChannelId === null ? streams[index].LiveStream.epgChannelId === null ? '' : streams[index].LiveStream.epgChannelId.toLowerCase() : streams[index].epgChannelId.toLowerCase(),
              added: String(Date.parse(streams[index].createdAt) / 1000),
              category_id: streams[index].PlaylistLiveCategory.id,
              category_name: streams[index].PlaylistLiveCategory.name,
              series_no: null,
              live: 1,
              container_extension: null,
              custom_sid: streams[index].LiveStream.serviceId,
              tv_archive: streams[index].LiveStream.archive,
              direct_source: '',
              tv_archive_duration: streams[index].LiveStream.archiveDuration
            }
          }
          return res.json(output)
        }).catch(function (error) {
          if (error) {
            console.error(error)
          }
          return res.status(404).send('No provider available')
        })
      }).catch(function (error) {
        res.status(500).send(error.message)
      })
  }
})
expressApp.get('/player_api.php', async function (req, res) {
  if (!Object.prototype.hasOwnProperty.call(req.query, 'username') || !Object.prototype.hasOwnProperty.call(req.query, 'password')) {
    return res.status(400).send('Bad request')
  }
  if (!await grantAccess(req.query.username, req.query.password)) {
    return res.status(401).send('Wrong username/password')
  }
  let whereQuery = {}
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
        const responseCategory = []
        for (const index in PlaylistLiveCategory) {
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
      if (Object.prototype.hasOwnProperty.call(req.query, 'category_id')) {
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
        const responseStream = []
        for (const index in streams) {
          responseStream.push({
            num: streams[index].position,
            name: streams[index].name === null ? streams[index].LiveStream.name : streams[index].name,
            stream_type: 'live',
            stream_id: streams[index].liveStreamId,
            stream_icon: streams[index].icon === null ? streams[index].LiveStream.icon : streams[index].icon,
            epg_channel_id: streams[index].epgChannelId === null ? streams[index].LiveStream.epgChannelId === null ? '' : streams[index].LiveStream.epgChannelId.toLowerCase() : streams[index].epgChannelId.toLowerCase(),
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
      if (!Object.prototype.hasOwnProperty.call(req.query, 'username') || !Object.prototype.hasOwnProperty.call(req.query, 'password')) {
        return res.status(400).send('Bad request')
      }
      if (!Object.prototype.hasOwnProperty.call(req.query, 'stream_id')) {
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
      if (!Object.prototype.hasOwnProperty.call(req.query, 'username') || !Object.prototype.hasOwnProperty.call(req.query, 'password')) {
        return res.status(400).send('Bad request')
      }
      if (!Object.prototype.hasOwnProperty.call(req.query, 'stream_id')) {
        return res.status(200).json({ epg_listings: [] })
      }
      // Redirect to provider url
      db.LiveStream.findByPk(req.query.stream_id, {
        include: [db.Provider]
      }).then(function (stream) {
        if (stream === null) {
          return res.status(200).json({ epg_listings: [] })
        }
        return res.redirect('http://' + stream.Provider.host + ':' + stream.Provider.port + '/player_api.php?username=' + stream.Provider.username + '&password=' + stream.Provider.password + '&action=get_simple_data_table&stream_id=' + stream.streamId)
      })
      break
    default:
      /*
      db.Provider.findAll().then(function (providers) {
        if (providers === null) {
          return res.status(404).send('No provider available')
        }
        res.redirect('http://' + providers[0].host + ':' + providers[0].port + '/player_api.php?username=' + providers[0].username + '&password=' + providers[0].password)
      }).catch(function (error) {
        res.status(500).send(error.message)
      })
      */
      return res.json({
        user_info: {
          username: req.query.username,
          password: req.query.password,
          message: '',
          auth: 1,
          status: 'Active',
          exp_date: '1593590150',
          is_trial: '0',
          active_cons: '0',
          created_at: '1593590150',
          max_connections: '1',
          allowed_output_formats: [
            'ts'
          ]
        },
        server_info: {
          url: req.hostname,
          port: req.headers.host.split(':').pop(),
          https_port: '23455',
          server_protocol: 'http',
          timezone: 'Europe/Paris',
          timestamp_now: parseInt(new Date().getTime() / 1000),
          rtmp_port: '23344',
          time_now: moment().format('YYYY-MM-DD HH:mm:ss'),
          process: true
        }
      })
  }
})
// Timeshift
expressApp.get(['/streaming/timeshift.php', '/timeshift/:username/:password/:duration/:start/:stream.:extension', '/timeshifts/:username/:password/:duration/:start/:stream.:extension'], async function (req, res) {
  // Init parameters
  let params = {}
  if (Object.keys(req.query).length > 0) {
    params = req.query
  } else if (Object.keys(req.params).length > 0) {
    params = req.params
  }
  if (params.username === '' || params.password === '' || params.duration === '') {
    return res.status(400).send('Bad request')
  }
  if (!await grantAccess(params.username, params.password)) {
    return res.status(401).send('Wrong username/password')
  }
  // Get provider stream
  const providerLiveStream = await db.LiveStream.findByPk(params.stream, {
    include: [db.Provider]
  })
  if (providerLiveStream === null) {
    return res.status(404).send('Stream unavailable')
  }
  // Redirect to provider
  return res.redirect('http://' + providerLiveStream.Provider.host + ':' + providerLiveStream.Provider.port + '/streaming/timeshift.php?username=' + providerLiveStream.Provider.username + '&password=' + providerLiveStream.Provider.password + '&stream=' + providerLiveStream.streamId + '&start=' + params.start + '&duration=' + params.duration)
})
// Play list stream
expressApp.get('/:username/:password/:id', function (req, res) {

})
// EPG
expressApp.get('/xmltv.php', async function (req, res) {
  if (!Object.prototype.hasOwnProperty.call(req.query, 'username') || !Object.prototype.hasOwnProperty.call(req.query, 'password')) {
    return res.status(400).send('Bad request')
  }
  if (!await grantAccess(req.query.username, req.query.password)) {
    return res.status(401).send('Wrong username/password')
  }
  // Get playlist infos
  const playlist = await db.PlaylistLive.findOne({
    where: {
      id: req.query.username
    },
    include: {
      model: db.Epg
    }
  })
  // If no playlist redirect to provider EPG
  if (playlist === null) {
    // Get first provider
    const providers = await db.Provider.findAll()
    return res.redirect('http://' + providers[0].host + ':' + providers[0].port + '/xmltv.php?username=' + providers[0].username + '&password=' + providers[0].password)
  }
  // Get uniq epgId playlist streams
  const channels = await db.sequelize.query('SELECT distinct IFNULL(lower(PlaylistLiveStream.epgChannelId), lower(LiveStream.epgChannelId)) as channel, IFNULL(PlaylistLiveStream.icon, LiveStream.icon) as icon, IFNULL(PlaylistLiveStream.name, LiveStream.name) as name FROM PlaylistLiveStream LEFT JOIN PlaylistLiveCategory ON playlistLiveCategoryId = PlaylistLiveCategory.id LEFT JOIN LiveStream ON liveStreamId = LiveStream.id WHERE PlaylistLiveCategory.playlistLiveId = :playlistLiveId GROUP BY channel', {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: {
      playlistLiveId: playlist.id
    }
  })
  // Get epgIds
  const epgIds = []
  for (const epgIndex in playlist.Epgs) {
    epgIds.push(playlist.Epgs[epgIndex].id)
  }
  // Send EPG
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.write('<?xml version="1.0" encoding="utf-8" ?><!DOCTYPE tv SYSTEM "xmltv.dtd"><tv generator-info-name="IPTV-Playlist-Editor">')
  // Send channels
  for (const channelIndex in channels) {
    res.write('<channel id="' + channels[channelIndex].channel + '"><display-name>' + xmlescape(channels[channelIndex].name) + '</display-name><icon src="' + channels[channelIndex].icon + '" /></channel>')
  }
  // Send programs
  for (const channelIndex in channels) {
    try {
      const programs = await db.sequelize.query('SELECT * FROM (SELECT start, stop, title, description, icon, epgId FROM EpgTag LEFT JOIN Epg ON EpgTag.epgId = Epg.id WHERE channel = :channel AND epgId IN (:epgIds) ORDER by start, epg.priority DESC) as p GROUP BY start', {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: {
          channel: channels[channelIndex].channel,
          epgIds: epgIds
        }
      })
      for (const programIndex in programs) {
        try {
          const start = moment(programs[programIndex].start).format('YYYYMMDDHHmmss ZZ')
          const stop = moment(programs[programIndex].stop).format('YYYYMMDDHHmmss ZZ')
          res.write('<programme start="' + start + '" stop="' + stop + '" channel="' + channels[channelIndex].channel + '"><title>' + xmlescape(programs[programIndex].title) + '</title><desc>' + xmlescape(programs[programIndex].description) + '</desc></programme>')
        } catch (error) {
          // console.log('[API] ' + error)
        }
      }
    } catch (error) {
      console.log('[API] ' + error)
    }
  }
  res.write('</tv>')
  res.end()
})
// Play live stream
expressApp.get(['/streaming/client_live.php', '/live/:username/:password/:streamId.:extension', '/live/:username/:password/:streamId', '/:username/:password/:streamId.:extension', '/:streamId.:extension', '/ch:streamId.m3u8', '/hls/:username/:password/:streamId/:token/:segment', '/hlsr/:username/:password/:streamId/:token/:segment'], async function (req, res) {
  // Verify username / password
  if (!Object.prototype.hasOwnProperty.call(req.params, 'username') || !Object.prototype.hasOwnProperty.call(req.params, 'password')) {
    return res.status(400).send('Bad request')
  }
  if (!await grantAccess(req.params.username, req.params.password)) {
    return res.status(401).send('Wrong username/password')
  }
  // Get provider stream
  const providerLiveStream = await db.LiveStream.findByPk(req.params.streamId, {
    include: [db.Provider]
  })
  if (providerLiveStream === null) {
    return res.status(404).send('Stream unavailable')
  }
  // Redirect to provider
  return res.redirect('http://' + providerLiveStream.Provider.host + ':' + providerLiveStream.Provider.port + '/live/' + providerLiveStream.Provider.username + '/' + providerLiveStream.Provider.password + '/' + providerLiveStream.streamId + (Object.prototype.hasOwnProperty.call(req.params, 'extension') ? '.' + req.params.extension : ''))
})
// Redirect to manager interface
expressApp.get('/', function (req, res) {
  res.redirect('/manager')
})

// Start service
expressApp.listen(process.env.LISTEN || 3000, async function () {
  console.log('[API] Playlist editor listening on ' + (process.env.LISTEN || 3000))
  // Find local ip address
  const networkInterfaces = os.networkInterfaces()
  let localIp = ''
  Object.keys(networkInterfaces).forEach(function (interfaceName) {
    networkInterfaces[interfaceName].forEach(function (interfaceObj) {
      if (interfaceObj.internal === false && interfaceObj.family === 'IPv4' && localIp === '') {
        localIp = interfaceObj.address
      }
    })
  })
  if (env !== 'development') {
    open('http://' + localIp + ':' + (process.env.LISTEN || 3000))
  }
})

// Verify username/password
const grantAccess = async function (username, password) {
  if (username === '') {
    return false
  }
  const playlistLive = await db.PlaylistLive.findByPk(username)
  if (playlistLive === null) {
    return false
  }
  if (playlistLive.password !== password) {
    return false
  }
  return true
}

// Request HTTP
const requestProvider = function (provider, parameters) {
  const query = parameters
  query.username = provider.username
  query.password = provider.password
  return new Promise(function (resolve, reject) {
    fetch('http://' + provider.host + ':' + provider.port + '/player_api.php?' + querystring.stringify(query)).then(function (result) {
      if (result.status !== 200) {
        return reject(new Error('Status ' + result.status))
      }
      return resolve(result.json())
    }).catch(function (error) {
      return reject(error)
    })
  })
}
