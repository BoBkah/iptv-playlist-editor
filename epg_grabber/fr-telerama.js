'use strict'

const crypto = require('crypto')
const fetch = require('node-fetch')
const querystring = require('querystring')

const channels = {
  2: {
    name: '13ème RUE',
    id: '13rue.fr'
  },
  1403: {
    name: '6ter',
    id: '6ter.fr'
  },
  421: {
    name: '8 Mont-Blanc',
    id: 'tv8montblanc.fr'
  },
  5: {
    name: 'AB1',
    id: 'ab1.fr'
  },
  254: {
    name: 'AB3',
    id: 'ab3.fr'
  },
  10: {
    name: 'Action',
    id: 'action.fr'
  },
  524: {
    name: 'Alsace 20',
    id: 'alsace20.fr'
  },
  2320: {
    name: 'Altice Studio',
    id: 'alticestudio.fr'
  },
  12: {
    name: 'Animaux',
    id: 'animaux.fr'
  },
  111: {
    name: 'Arte',
    id: 'arte.fr'
  },
  15: {
    name: 'Automoto La chaîne',
    id: 'automoto.fr'
  },
  483: {
    name: 'Baby TV',
    id: 'babytv.fr'
  },
  1290: {
    name: 'beIN SPORTS 1',
    id: 'beinsports1.fr'
  },
  1304: {
    name: 'beIN SPORTS 2',
    id: 'beinsports2.fr'
  },
  1335: {
    name: 'beIN SPORTS 3',
    id: 'beinsports3.fr'
  },
  1342: {
    name: 'beIN SPORTS MAX 10',
    id: 'beinsportmax10.fr'
  },
  1336: {
    name: 'beIN SPORTS MAX 4',
    id: 'beinsportmax4.fr'
  },
  1337: {
    name: 'beIN SPORTS MAX 5',
    id: 'beinsportmax5.fr'
  },
  1338: {
    name: 'beIN SPORTS MAX 6',
    id: 'beinsportmax6.fr'
  },
  1339: {
    name: 'beIN SPORTS MAX 7',
    id: 'beinsportmax7.fr'
  },
  1340: {
    name: 'beIN SPORTS MAX 8',
    id: 'beinsportmax8.fr'
  },
  1341: {
    name: 'beIN SPORTS MAX 9',
    id: 'beinsportmax9.fr'
  },
  1960: {
    name: 'BET',
    id: 'bet.fr'
  },
  1073: {
    name: 'BFM Business',
    id: 'BFMBusiness.fr'
  },
  481: {
    name: 'BFM TV',
    id: 'bfmtv.fr'
  },
  924: {
    name: 'Boing',
    id: 'boing.fr'
  },
  321: {
    name: 'Boomerang',
    id: 'boomerang.fr'
  },
  192: {
    name: 'TF1',
    id: 'tf1.fr'
  },
  445: {
    name: 'C8',
    id: 'c8.fr'
  },
  34: {
    name: 'Canal+',
    id: 'canalplus.fr'
  },
  33: {
    name: 'Canal+ Cinéma',
    id: 'canalpluscinema.fr'
  },
  30: {
    name: 'Canal+ Décalé',
    id: 'canalplusdecale.fr'
  },
  657: {
    name: 'Canal+ Family',
    id: 'canalplusfamily.fr'
  },
  32: {
    name: 'Canal J',
    id: 'canalj.fr'
  },
  1563: {
    name: 'Canal+ Séries',
    id: 'canalplusseries.fr'
  },
  35: {
    name: 'Canal+ Sport',
    id: 'canalplussport.fr'
  },
  36: {
    name: 'Cartoon Network',
    id: 'cartoonnetwork.fr'
  },
  38: {
    name: 'Chasse et pêche',
    id: 'chassepeche.fr'
  },
  1399: {
    name: 'Chérie 25',
    id: 'cherie25.fr'
  },
  287: {
    name: 'Ciné+ Classic',
    id: 'cinecinemaclassic.fr'
  },
  285: {
    name: 'Ciné+ Club',
    id: 'cinecinemaclub.fr'
  },
  283: {
    name: 'Ciné+ Emotion',
    id: 'cinecinemaemotion.fr'
  },
  332: {
    name: 'Ciné+ Famiz',
    id: 'cinecinemafamiz.fr'
  },
  332: {
    name: 'Ciné+ Famiz',
    id: 'cinecinemafamiz.fr'
  },
}

module.exports = class Grabber {
  // Create EPG entry
  constructor (db) {
    this.epgid = null
    this.db = db
    const that = this
    // Add this grabber
    db.Epg.findOne({
      where: {
        name: 'Télérama'
      }
    }).then(function (epg) {
      if (epg === null) {
        db.Epg.create({
          name: 'Télérama',
          grabber: 'telerama',
          status: false
        }).then(function (epg) {
          that.epgid = epg.id
          // Create channel list
          that.updateEpg()
        })
      } else {
        that.epgid = epg.id
        // Get last EPG entry
        db.EpgTag.findOne({
          where: {
            epgId: epg.id
          },
          order: [
            ['start', 'DESC']
          ],
          limit: 1
        }).then(async function (epgTag) {
          if (epgTag === null) {
            that.updateEpg()
          } else {
            // Get max archive
            let maxArchiveDuration = await that.getMaxArchive()
            if (maxArchiveDuration > 11) {
              maxArchiveDuration = 11
            }
            if (epgTag.start.getTime() < new Date().getTime() + ((maxArchiveDuration - 1) * 86400000)) {
              that.updateEpg()
            }
          }
        })
      }
      console.log('[EPG grabber Télérama] initialized')
      // Set periodic update (every day)
      setInterval(function () {
        that.updateEpg()
      }, 86400000)
    })
  }

  async updateEpg () {
    // Verify EPG status
    const epg = await this.db.Epg.findByPk(this.epgid)
    if (epg === null || epg.status === false) {
      return false
    }
    console.log('[EPG grabber Télérama] updating...')
    // Get max archive
    const maxArchiveDuration = await this.getMaxArchive()
    // Generate random hash to prevent API flood detection
    const hash = crypto.randomBytes(32).toString('hex')
    // Get channel grid
    let channelGrid = {}
    try {
      channelGrid = await this.requestTeleramaApi('/v1/application/initialisation', {
        appareil: 'android_tablette',
        hash: hash
      })
    } catch (error) {
      console.error(error)
    }
    // For each channel exists in channels, get EPG
    const channelGroup = [[]]
    let channelGroupIndex = 0
    let startDate = 0
    for (const channelIndex in channelGrid.donnees.chaines) {
      if (Object.prototype.hasOwnProperty.call(channels, channelGrid.donnees.chaines[channelIndex].id)) {
        // Get last program date
        const lastEpgTagChannel = await this.db.EpgTag.findOne({
          where: {
            epgId: this.epgid,
            channel: channels[channelGrid.donnees.chaines[channelIndex].id].id
          },
          order: [
            ['start', 'DESC']
          ],
          limit: 1
        })
        // Define start date
        if (lastEpgTagChannel !== null) {
          const lastEpgTagChannelStart = new Date(lastEpgTagChannel.start).getTime() / 1000
          // Check if older EPG date higher than maxArchiveDuration
          const olderEpgTagChannel = await this.db.EpgTag.findOne({
            where: {
              epgId: this.epgid,
              channel: channels[channelGrid.donnees.chaines[channelIndex].id].id
            },
            order: [
              ['start', 'ASC']
            ],
            limit: 1
          })
          let olderEpgTagChannelStart = 0
          if (olderEpgTagChannel === null) {
            olderEpgTagChannelStart = Math.round(new Date().getTime() / 1000) - (maxArchiveDuration * 86400)
          } else {
            olderEpgTagChannelStart = new Date(olderEpgTagChannel.start).getTime() / 1000
          }
          if (olderEpgTagChannelStart > Math.round(new Date().getTime() / 1000) - (maxArchiveDuration * 86400)) {
            startDate = Math.round(new Date().getTime() / 1000) - (maxArchiveDuration * 86400)
          } else if (lastEpgTagChannelStart < startDate || startDate === 0) {
            startDate = lastEpgTagChannelStart
          }
        } else {
          // If no start date defined, set to max archive duration provider
          if (startDate === 0 || startDate > Math.round(new Date().getTime() / 1000) - (maxArchiveDuration * 86400)) {
            startDate = Math.round(new Date().getTime() / 1000) - (maxArchiveDuration * 86400)
          }
        }
        // Group channel by 32
        if (channelGroup[channelGroupIndex].length === 32) {
          channelGroupIndex++
          channelGroup[channelGroupIndex] = []
        }
        channelGroup[channelGroupIndex].push(channelGrid.donnees.chaines[channelIndex].id)
      }
    }
    // Get EpgTag
    // https://api.telerama.fr/v3/programmes/grille?appareil=android_tablette&date=2020-03-29&heure_debut=00:00&heure_fin=23:59&id_chaines=2,3,4,5,6,7,10,12,13,15,16,17,18,19,23,24,29,30,32,33,34,35,36,38,47,49,50,51,52,53,54,57&nb_par_page=3200&page=1&api_cle=apitel-g4aatlgif6qzf&api_signature=9730fbf645b799dca4135e060ea227a77648740f
    for (const channelGroupIndex in channelGroup) {
      if (channelGroup[channelGroupIndex].length === 0) {
        continue
      }
      // End date: today + 10 days
      const endDate = new Date(new Date().getTime() + 11 * 24 * 60 * 60000)
      let epgDay = new Date(startDate * 1000)
      while (Math.round(endDate.getTime() / 86400000) > Math.round(epgDay.getTime() / 86400000)) {
        let epgTagList = {}
        try {
          epgTagList = await this.requestTeleramaApi('/v3/programmes/grille', {
            appareil: 'android_tablette',
            date: epgDay.toISOString().substr(0, 10),
            heure_debut: '00:00',
            heure_fin: '23:59',
            id_chaines: channelGroup[channelGroupIndex].join(','),
            nb_par_page: 3200,
            page: 1
          })
        } catch (error) {
          console.log(error)
        }
        epgDay = new Date(epgDay.getTime() + 86400000)
        if (Object.prototype.hasOwnProperty.call(epgTagList, 'donnees')) {
          const bulkCreate = []
          for (const epgTagListIndex in epgTagList.donnees) {
            // Check if programId not exists
            const epgTag = await this.db.sequelize.query('SELECT id FROM epgTag WHERE epgId = ' + this.epgid + ' AND programId = ' + epgTagList.donnees[epgTagListIndex].id_programme, {
              type: this.db.sequelize.QueryTypes.SELECT
            })
            if (epgTag.length === 0) {
              bulkCreate.push({
                epgId: this.epgid,
                programId: epgTagList.donnees[epgTagListIndex].id_programme,
                channel: channels[epgTagList.donnees[epgTagListIndex].id_chaine].id,
                start: new Date(epgTagList.donnees[epgTagListIndex].horaire.debut),
                stop: new Date(epgTagList.donnees[epgTagListIndex].horaire.fin),
                title: epgTagList.donnees[epgTagListIndex].titre,
                description: epgTagList.donnees[epgTagListIndex].resume,
                genre: epgTagList.donnees[epgTagListIndex].genre_specifique,
                icon: Object.prototype.hasOwnProperty.call(epgTagList.donnees[epgTagListIndex], 'vignettes') && Object.prototype.hasOwnProperty.call(epgTagList.donnees[epgTagListIndex].vignettes, 'petite') ? epgTagList.donnees[epgTagListIndex].vignettes.petite : ''
              })
            }
          }
          this.db.EpgTag.bulkCreate(bulkCreate)
        }
      }
    }
    // Clean EPG programmes
    const stopDate = Math.round(new Date().getTime() / 1000) - (maxArchiveDuration * 86400)
    // Delete old entries
    await this.db.sequelize.query('DELETE FROM EpgTag WHERE epgId = :epgId AND stop < :stopDate', {
      type: this.db.sequelize.QueryTypes.SELECT,
      replacements: {
        epgId: this.epgid,
        stopDate: new Date(stopDate * 1000)
      }
    })
    console.log('[EPG grabber Télérama] cleaned')
    // Update last update
    await this.db.Epg.update({
      lastScan: new Date()
    }, {
      where: {
        id: this.epgid
      }
    })
    // Optimize database size
    this.db.sequelize.query('VACUUM')
  }

  requestTeleramaApi (path, parameters) {
    return new Promise(function (resolve, reject) {
      // Parameters to sign
      let toSign = ''
      for (const [key, value] of Object.entries(parameters)) {
        toSign += key + value
      }
      // Add API key and signature
      parameters.api_cle = 'apitel-g4aatlgif6qzf'
      parameters.api_signature = crypto.createHmac('sha1', 'uIF59SZhfrfm5Gb').update(path + toSign).digest('hex')
      // Request API
      fetch('https://api.telerama.fr' + path + '?' + querystring.encode(parameters)).then(function (response) {
        return response.json()
      }).then(function (json) {
        return resolve(json)
      }).catch(function (error) {
        return reject(error)
      })
    })
  }

  async getMaxArchive () {
    // Get max archive duration in provider's streams
    const liveStream = await this.db.LiveStream.findOne({
      order: [
        ['archiveDuration', 'DESC']
      ],
      limit: 1
    })
    let maxArchiveDuration = 0
    if (liveStream !== null) {
      maxArchiveDuration = liveStream.archiveDuration
    }
    return maxArchiveDuration
  }
}
