'use strict'

const fetch = require('node-fetch')
const fs = require('fs')
const momentTz = require('moment-timezone')
const path = require('path')
const xmltv = require('xmltv')

module.exports = class Grabber {
  // Create EPG entry
  constructor (db, providerId) {
    this.db = db
    this.providerId = providerId
    this.initProvider()
  }

  async initProvider () {
    // Get provider
    const provider = await this.db.Provider.findByPk(this.providerId)
    if (provider === null) {
      return false
    }
    // Create provider Epg
    let epg = await this.db.Epg.findOne({
      where: {
        providerId: provider.id
      }
    })
    if (epg === null) {
      epg = await this.db.Epg.create({
        name: provider.name,
        providerId: provider.id
      })
    }
    this.epgid = epg.id
    const that = this
    console.log('[EPG provider ' + provider.name + '] initialized')
    // Verify archive file
    if (fs.existsSync(path.join(process.cwd(), 'temp/' + provider.name + '.xml'))) {
      const fileStat = fs.statSync(path.join(process.cwd(), 'temp/' + provider.name + '.xml'))
      if (fileStat.ctime.getTime() < new Date().getTime() - 86400000) {
        this.updateEpg()
      }
    } else {
      this.updateEpg()
    }
    // Add update job
    setInterval(function () {
      that.updateEpg()
    }, 86400000)
  }

  async updateEpg () {
    const that = this
    // Get provider
    const provider = await this.db.Provider.findByPk(this.providerId)
    if (provider === null) {
      return false
    }
    // Create provider Epg
    let epg = await this.db.Epg.findOne({
      where: {
        providerId: provider.id
      }
    })
    if (epg === null) {
      epg = await this.db.Epg.create({
        name: provider.name,
        providerId: provider.id,
        status: true
      })
    } else if (epg.status === false) {
      return false
    }
    this.epgid = epg.id
    console.log('[EPG provider ' + provider.name + '] updating...')
    // Download XMLTV from provider only if file older than 1 day
    let fileStat = {}
    if (fs.existsSync(path.join(process.cwd(), 'temp/' + provider.name + '.xml'))) {
      fileStat = fs.statSync(path.join(process.cwd(), 'temp/' + provider.name + '.xml'))
    }
    if (!fs.existsSync(path.join(process.cwd(), 'temp/' + provider.name + '.xml')) || fileStat.ctime.getTime() < new Date().getTime() - 86400000) {
      console.log('[EPG provider ' + provider.name + '] downloading http://' + provider.host + ':' + provider.port + '/xmltv.php?username=' + provider.username + '&password=' + provider.password + '&prev_days=' + 15 + '&next_days=1')
      const response = await fetch('http://' + provider.host + ':' + provider.port + '/xmltv.php?username=' + provider.username + '&password=' + provider.password)
      const fileStream = fs.createWriteStream(path.join(process.cwd(), 'temp/' + provider.name + '.xml'))
      await new Promise(function (resolve, reject) {
        response.body.pipe(fileStream)
        response.body.on('error', function (error) {
          return reject(error)
        })
        response.body.on('finish', function () {
          console.log('[EPG provider ' + provider.name + '] Download finished')
          return resolve()
        })
      })
    }
    // Parse XML provider
    console.log('[EPG provider ' + provider.name + '] parsing XMLTV file')
    const fileStream = fs.createReadStream(path.join(process.cwd(), 'temp/' + provider.name + '.xml'), {
      highWaterMark: 100
    })
    fileStream.pause()
    const XMLParser = new xmltv.Parser()
    fileStream.pipe(XMLParser)
    let bulkCreate = []
    XMLParser.on('programme', async function (programme) {
      fileStream.unpipe()
      // Search programme
      let epgTags = []
      try {
        epgTags = await that.db.sequelize.query('SELECT id FROM epgTag WHERE epgId = :epgid AND channel = :channel AND start = :startDate', {
          type: that.db.sequelize.QueryTypes.SELECT,
          replacements: {
            epgid: that.epgid,
            channel: programme.channel.toLowerCase(),
            startDate: momentTz(programme.start).utcOffset('+00:00').format('YYYY-MM-DD HH:mm:ss.SSS Z')
          }
        })
      } catch (error) {
        console.log(error)
        return
      }
      if (epgTags.length === 0) {
        // console.log('Programme not found for channel ' + programme.channel.toLowerCase() + ' title ' + programme.title[0] + ', start ' + new Date(programme.start).toISOString())
        bulkCreate.push({
          epgid: that.epgid,
          channel: programme.channel.toLowerCase(),
          start: new Date(programme.start),
          stop: new Date(programme.end),
          title: programme.title[0],
          description: programme.desc[0]
        })
      }
      // Flush bulk
      if (bulkCreate.length === 10000) {
        await that.db.EpgTag.bulkCreate(bulkCreate)
        bulkCreate = []
        fileStream.pipe(XMLParser)
      } else {
        fileStream.pipe(XMLParser)
      }
    })
    XMLParser.on('end', async function () {
      // Flush bulk
      if (bulkCreate.length > 0) {
        await that.db.EpgTag.bulkCreate(bulkCreate)
      }
      // Update last update
      await that.db.Epg.update({
        lastScan: new Date()
      }, {
        where: {
          id: that.epgid
        }
      })
      console.log('[EPG provider ' + provider.name + '] XMLTV parsing finished')
      // Clean EPG programmes
      try {
        const liveStream = await that.db.LiveStream.findOne({
          where: {
            providerId: provider.id
          },
          order: [
            ['archiveDuration', 'DESC']
          ],
          limit: 1
        })
        if (liveStream !== null) {
          const stopDate = Math.round(new Date().getTime() / 1000) - (liveStream.archiveDuration * 86400)
          // Delete old entries
          await that.db.sequelize.query('DELETE FROM EpgTag WHERE epgId = :epgid AND stop < :stopDate', {
            type: that.db.sequelize.QueryTypes.SELECT,
            replacements: {
              epgid: that.epgid,
              stopDate: new Date(stopDate)
            }
          })
          console.log('[EPG provider ' + provider.name + '] cleaned')
          // Optimize database
          await that.db.sequelize.query('VACUUM')
        }
      } catch (error) {
        console.log('[EPG provider ' + provider.name + '] ' + error)
      }
    })
  }
}
