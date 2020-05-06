'use strict'

const fetch = require('node-fetch')
const moment = require('moment')

const channels = {
  192: {
    name: 'TF1',
    id: 'tf1.fr'
  },
  4: {
    name: 'FRANCE 2',
    id: 'france2.fr'
  },
  80: {
    name: 'FRANCE 3',
    id: 'france3.fr'
  },
  34: {
    name: 'CANAL+',
    id: 'canalplus.fr'
  },
  47: {
    name: 'FRANCE 5',
    id: 'france5.fr'
  },
  118: {
    name: 'M6',
    id: 'm6.fr'
  },
  111: {
    name: 'ARTE',
    id: 'arte.fr'
  },
  445: {
    name: 'C8',
    id: 'c8.fr'
  },
  119: {
    name: 'W9',
    id: 'w9.fr'
  },
  195: {
    name: 'TMC',
    id: 'tmc.fr'
  },
  446: {
    name: 'TFX',
    id: 'tfx.fr'
  },
  444: {
    name: 'NRJ12',
    id: 'nrj12.fr'
  },
  234: {
    name: 'LCP/PS',
    id: 'lcp.fr'
  },
  78: {
    name: 'FRANCE4',
    id: 'france4.fr'
  },
  481: {
    name: 'BFM TV',
    id: 'bfmtv.fr'
  },
  226: {
    name: 'CNEWS',
    id: 'cnews.fr'
  },
  458: {
    name: 'CSTAR',
    id: 'cstar.fr'
  },
  482: {
    name: 'GULLI',
    id: 'gulli.fr'
  },
  160: {
    name: 'FRANCE O',
    id: 'franceo.fr'
  },
  1404: {
    name: 'TF1 SERIES FILMS',
    id: 'tf1seriesfilms.fr'
  },
  1401: {
    name: 'LA CHAINE L\'EQUIPE',
    id: 'lachainelequipe.fr'
  },
  1403: {
    name: '6TER',
    id: '6ter.fr'
  },
  1402: {
    name: 'RMC STORY',
    id: 'rmcstory.fr'
  },
  1400: {
    name: 'RMC DECOUVERTE',
    id: 'rmcdecouverte.fr'
  },
  1399: {
    name: 'CHERIE 25',
    id: 'cherie25.fr'
  },
  112: {
    name: 'LCI',
    id: 'lci.fr'
  },
  2111: {
    name: 'FRANCEINFO:',
    id: 'franceinfo.fr'
  },
  1061: {
    name: 'A LA MAISON',
    id: 'alamaison.fr'
  },
  205: {
    name: 'TV5MONDE',
    id: 'tv5monde.fr'
  },
  191: {
    name: 'TEVA',
    id: 'teva.fr'
  },
  145: {
    name: 'PARIS PREMIERE',
    id: 'parispremiere.fr'
  },
  115: {
    name: 'RTL9',
    id: 'rtl9.fr'
  },
  225: {
    name: 'TV BREIZH',
    id: 'tvbreizh.fr'
  },
  33: {
    name: 'CANAL+ CINEMA',
    id: 'canalpluscinema.fr'
  },
  35: {
    name: 'CANAL+ SPORT',
    id: 'canalplussport.fr'
  },
  1563: {
    name: 'CANAL+ SERIES',
    id: 'canalplusseries.fr'
  },
  657: {
    name: 'CANAL+ FAMILY',
    id: 'canalplusfamily.fr'
  },
  30: {
    name: 'CANAL+ DECALE',
    id: 'canalplusdecale.fr'
  },
  1290: {
    name: 'BEIN SPORTS 1',
    id: 'beinsports1.fr'
  },
  1304: {
    name: 'BEIN SPORTS 2',
    id: 'beinsports2.fr'
  },
  1335: {
    name: 'BEIN SPORTS 3',
    id: 'beinsports3.fr'
  },
  730: {
    name: 'OCS MAX',
    id: 'ocsmax.fr'
  },
  733: {
    name: 'OCS CITY',
    id: 'ocscity.fr'
  },
  732: {
    name: 'OCS CHOC',
    id: 'ocschoc.fr'
  },
  734: {
    name: 'OCS GEANTS',
    id: 'ocsgeants.fr'
  },
  185: {
    name: 'TCM CINEMA',
    id: 'tcmcinema.fr'
  },
  1562: {
    name: 'PARAMOUNT CHANNEL',
    id: 'paramountchannel.fr'
  },
  10: {
    name: 'ACTION',
    id: 'action.fr'
  },
  282: {
    name: 'CINE+ PREMIER',
    id: 'cinecinemapremier.fr'
  },
  284: {
    name: 'CINE+ FRISSON',
    id: 'cinecinemafrisson.fr'
  },
  283: {
    name: 'CINE+ EMOTION',
    id: 'cinecinemaemotion.fr'
  },
  401: {
    name: 'CINE+ FAMIZ',
    id: 'cinecinemafamiz.fr'
  },
  285: {
    name: 'CINE+ CLUB',
    id: 'cinecinemaclub.fr'
  },
  287: {
    name: '8CINE+ CLASSIC',
    id: 'cinecinemaclassic.fr'
  },
  1190: {
    name: 'EUROCHANNEL',
    id: 'eurochannel.fr'
  },
  1960: {
    name: 'BET',
    id: 'bet.fr'
  },
  5: {
    name: 'AB1',
    id: 'ab1.fr'
  },
  121: {
    name: 'MCM',
    id: 'mcm.fr'
  },
  2441: {
    name: 'TF1+1',
    id: 'tf1plus1.fr'
  },
  2752: {
    name: 'COMEDY CENTRAL',
    id: 'comedycentral.fr'
  },
  87: {
    name: 'GAME ONE',
    id: 'gameone.fr'
  },
  1167: {
    name: 'GAME ONE +1',
    id: 'gameoneplus1.fr'
  },
  54: {
    name: 'COMEDIE+',
    id: 'comedieplus.fr'
  },
  2326: {
    name: 'POLAR+',
    id: 'polarplus.fr'
  },
  2334: {
    name: 'WARNER TV',
    id: 'warnertv.fr'
  },
  49: {
    name: 'SERIE CLUB',
    id: 'serieclub.fr'
  },
  128: {
    name: 'MTV',
    id: 'mtv.fr'
  },
  1408: {
    name: 'NON STOP PEOPLE',
    id: 'nonstoppeople.fr'
  },
  1832: {
    name: 'NOVELAS TV',
    id: 'novelastv.fr'
  },
  2803: {
    name: 'PITCHOUN',
    id: 'pitchountv.fr'
  },
  321: {
    name: 'BOOMERANG',
    id: 'boomerang.fr'
  },
  928: {
    name: 'BOOMERANG +1',
    id: 'boomerangplus1.fr'
  },
  924: {
    name: 'BOING',
    id: 'boing.fr'
  },
  229: {
    name: 'TIJI',
    id: 'tiji.fr'
  },
  32: {
    name: 'CANAL J',
    id: 'canalj.fr'
  },
  344: {
    name: 'PIWI+',
    id: 'piwiplus.fr'
  },
  197: {
    name: 'TELETOON+',
    id: 'teletoonplus.fr'
  },
  293: {
    name: 'TELETOON +1',
    id: 'teletoonplus1.fr'
  },
  58: {
    name: 'DISNEY CHANNEL',
    id: 'disneychannel.fr'
  },
  299: {
    name: 'DISNEY CHANNEL +1',
    id: 'disneychannelplus1.fr'
  },
  300: {
    name: 'DISNEY JUNIOR',
    id: 'disneyjunior.fr'
  },
  36: {
    name: 'CARTOON NETWORK',
    id: 'cartoonnetwork.fr'
  },
  888: {
    name: 'NICKELODEON JUNIOR',
    id: 'nickelodeonjunior.fr'
  },
  473: {
    name: 'NICKELODEON',
    id: 'nickelodeon.fr'
  },
  2065: {
    name: 'NICKELODEON +1',
    id: 'nickelodeonplus1.fr'
  },
  1746: {
    name: 'NICKELODEON TEEN',
    id: 'nickelodeonteen.fr'
  },
  90112: {
    name: 'AEROSTAR TV',
    id: 'aerostartv.fr'
  },
  2094: {
    name: 'ULTRA NATURE',
    id: 'ultranature.fr'
  },
  12: {
    name: 'ANIMAUX',
    id: 'animaux.fr'
  },
  2037: {
    name: 'CRIME DISTRICT',
    id: 'crimedistrict.fr'
  },
  38: {
    name: 'CHASSE PECHE',
    id: 'chassepeche.fr'
  },
  1776: {
    name: 'TREK',
    id: 'trek.fr'
  },
  7: {
    name: 'TOUTE L\'HISTOIRE',
    id: 'toutelhistoire.fr'
  },
  88: {
    name: 'HISTOIRE TV',
    id: 'histoiretv.fr'
  },
  451: {
    name: 'USHUAIA TV',
    id: 'ushuaiatv.fr'
  },
  829: {
    name: 'MY ZEN TV',
    id: 'myzentv.fr'
  },
  63: {
    name: 'SCIENCE & VIE TV',
    id: 'scienceetvietv.fr'
  },
  508: {
    name: 'NATIONAL GEOGRAPHIC',
    id: 'nationalgeographic.fr'
  },
  719: {
    name: 'NATIONAL GEOGRAPHIC WILD',
    id: 'nationalgeographicwild.fr'
  },
  212: {
    name: 'VOYAGE',
    id: 'voyage.fr'
  },
  147: {
    name: 'PLANETE+',
    id: 'planete.fr'
  },
  662: {
    name: 'PLANETE+ CI',
    id: 'planetejustice.fr'
  },
  402: {
    name: 'PLANETE+ A&E',
    id: 'planetenolimit.fr'
  },
  1072: {
    name: 'MUSEUM',
    id: 'museum.fr'
  },
  563: {
    name: 'GINX',
    id: 'ginx.fr'
  },
  2942: {
    name: '01TV',
    id: '01tv.fr'
  },
  2353: {
    name: 'ES1',
    id: 'es1.fr'
  },
  2442: {
    name: 'TMC +1',
    id: 'tmcplus1.fr'
  },
  6: {
    name: 'MANGAS',
    id: 'mangas.fr'
  },
  2040: {
    name: 'TOONAMI',
    id: 'toonami.fr'
  },
  1585: {
    name: 'J-ONE',
    id: 'jone.fr'
  },
  2171: {
    name: 'VICE TV',
    id: 'vicetv.fr'
  },
  2781: {
    name: 'CLIQUE TV',
    id: 'cliquetv.fr'
  },
  90150: {
    name: 'TRACE URBAN',
    id: 'traceurban.fr'
  },
  605: {
    name: 'NRJ HITS',
    id: 'nrjhits.fr'
  },
  1989: {
    name: 'CLUBBING TV',
    id: 'clubbingtv.fr'
  },
  2153: {
    name: 'OKLM TV',
    id: 'oklmtv.fr'
  },
  453: {
    name: 'M6 MUSIC',
    id: 'm6music.fr'
  },
  90159: {
    name: 'RFM TV',
    id: 'rfmtv.fr'
  },
  265: {
    name: 'MELODY',
    id: 'melody.fr'
  },
  90161: {
    name: 'TRACE TROPICAL',
    id: 'tracetropical.fr'
  },
  90162: {
    name: 'TRACE LATINA',
    id: 'tracelatina.fr'
  },
  2006: {
    name: 'MTV HITS',
    id: 'mtvhits.fr'
  },
  90165: {
    name: 'CSTAR HITS FRANCE',
    id: 'cstarhitsfrance.fr'
  },
  2958: {
    name: 'OLYMPIA TV',
    id: 'olympiatv.fr'
  },
  125: {
    name: 'MEZZO',
    id: 'mezzo.fr'
  },
  907: {
    name: 'MEZZO LIVE HD',
    id: 'mozzolive.fr'
  },
  1353: {
    name: 'STINGRAY CLASSICA',
    id: 'stringrayclassica.fr'
  },
  64: {
    name: 'EQUIDIA',
    id: 'equidia.fr'
  },
  2837: {
    name: 'SPORT EN FRANCE',
    id: 'sportenfrance.fr'
  },
  1336: {
    name: 'BEIN SPORTS MAX 4',
    id: 'beinsportsmax4.fr'
  },
  1337: {
    name: 'BEIN SPORTS MAX 5',
    id: 'beinsportsmax5.fr'
  },
  1338: {
    name: 'BEIN SPORTS MAX 6',
    id: 'beinsportsmax6.fr'
  },
  1339: {
    name: 'BEIN SPORTS MAX 7',
    id: 'beinsportsmax7.fr'
  },
  1340: {
    name: 'BEIN SPORTS MAX 8',
    id: 'beinsportsmax8.fr'
  },
  1341: {
    name: 'BEIN SPORTS MAX 9',
    id: 'beinsportsmax9.fr'
  },
  1342: {
    name: 'BEIN SPORTS MAX 10',
    id: 'beinsportsmax10.fr'
  },
  15: {
    name: 'AUTOMOTO',
    id: 'automoto.fr'
  },
  1166: {
    name: 'GOLF CHANNEL',
    id: 'golf.fr'
  },
  90208: {
    name: 'M6 BOUTIQUE',
    id: 'm6boutique.fr'
  },
  1996: {
    name: 'FASHION TV',
    id: 'fashiontv.fr'
  },
  531: {
    name: 'LUXE TV',
    id: 'luxetv.fr'
  },
  90216: {
    name: 'MEN\'S UP TV',
    id: 'mensuptv.fr'
  },
  57: {
    name: 'DEMAIN',
    id: 'demain.fr'
  },
  110: {
    name: 'KTO',
    id: 'kto.fr'
  },
  90221: {
    name: 'SOUVENIRS FROM EARTH',
    id: 'souvenirsfromearth.fr'
  },
  992: {
    name: 'LCP 100%',
    id: 'lcp100.fr'
  },
  90226: {
    name: 'PUBLIC SENAT',
    id: 'publicsenat.fr'
  },
  529: {
    name: 'FRANCE 24',
    id: 'france24.fr'
  },
  1073: {
    name: 'BFM BUSINESS',
    id: 'bfmbusiness.fr'
  },
  140: {
    name: 'EURONEWS',
    id: 'euronews.fr'
  },
  90230: {
    name: 'LA CHAINE METEO',
    id: 'lachainemeteo.fr'
  },
  90233: {
    name: 'SKYNEWS',
    id: 'skynews.fr'
  },
  53: {
    name: 'CNN INTERNATIONAL',
    id: 'cnninternational.fr'
  },
  51: {
    name: 'CNBC',
    id: 'cnbc.fr'
  },
  410: {
    name: 'BLOOMBERG EUROPE',
    id: 'bloomberg.fr'
  },
  19: {
    name: 'BBC WORLD NEWS',
    id: 'bbcworldnews.fr'
  },
  781: {
    name: 'I24NEWS',
    id: 'i24news.fr'
  },
  655: {
    name: 'FRANCE 3 ALPES',
    id: 'france3alpes.fr'
  },
  249: {
    name: 'FRANCE 3 ALSACE',
    id: 'france3alsace.fr'
  },
  304: {
    name: 'FRANCE 3 AQUITAINE',
    id: 'france3aquitaine.fr'
  },
  649: {
    name: 'FRANCE 3 AUVERGNE',
    id: 'france3auvergne.fr'
  },
  647: {
    name: 'FRANCE 3 NORMANDIE CAEN',
    id: 'france3normandie.fr'
  },
  636: {
    name: 'FRANCE 3 BOURGOGNE',
    id: 'france3bourgogne.fr'
  },
  634: {
    name: 'FRANCE 3 BRETAGNE',
    id: 'france3bretagne.fr'
  },
  306: {
    name: 'FRANCE 3 CENTRE',
    id: 'france3centre.fr'
  },
  641: {
    name: 'FRANCE 3 CHAMPAGNE ARDENNE',
    id: 'france3champagneardenne.fr'
  },
  308: {
    name: 'FRANCE 3 CORSE',
    id: 'france3corse.fr'
  },
  642: {
    name: 'FRANCE 3 COTE D\'AZUR',
    id: 'france3codedazur.fr'
  },
  637: {
    name: 'FRANCE 3 FRANCHE COMTE',
    id: 'france3franchecomte.fr'
  },
  646: {
    name: 'FRANCE 3 NORMANDIE ROUEN',
    id: 'france3normandierouen.fr'
  },
  650: {
    name: 'FRANCE 3 LANGUEDOC',
    id: 'france3languedoc.fr'
  },
  638: {
    name: 'FRANCE 3 LIMOUSIN',
    id: 'france3limousin.fr'
  },
  640: {
    name: 'FRANCE 3 LORRAINE',
    id: 'france3lorraine.fr'
  },
  651: {
    name: 'FRANCE 3 MIDI-PYRENEES',
    id: 'france3midipyrenees.fr'
  },
  644: {
    name: 'FRANCE 3 NORD PAS DE CALAIS',
    id: 'france3nordpasdecalais.fr'
  },
  313: {
    name: 'FRANCE 3 PARIS IDF',
    id: 'france3parisidf.fr'
  },
  635: {
    name: 'FRANCE 3 PAYS DE LA LOIRE',
    id: 'france3paysdelaloire.fr'
  },
  645: {
    name: 'FRANCE 3 PICARDIE',
    id: 'france3picardie.fr'
  },
  639: {
    name: 'FRANCE 3 POITOU CHARENTES',
    id: 'france3poitoucharentes.fr'
  },
  643: {
    name: 'FRANCE 3 PROVENCE ALPES',
    id: 'france3provencealpes.fr'
  },
  648: {
    name: 'FRANCE 3 RHONE ALPES',
    id: 'france3rhoneaples.fr'
  },
  90348: {
    name: 'IDF1',
    id: 'idf1.fr'
  },
  90350: {
    name: 'VIA VOSGES',
    id: 'viavosges.fr'
  }
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
        name: 'Orange'
      }
    }).then(function (epg) {
      if (epg === null) {
        db.Epg.create({
          name: 'Orange',
          grabber: 'orange',
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
            if (maxArchiveDuration > 7) {
              maxArchiveDuration = 7
            }
            // Get number of channel
            const channelsNumber = await that.getNumberOfChannel()
            // if (moment(epgTag.start).startOf('day').diff(moment().add(maxArchiveDuration, 'days').startOf('day'), 'days') > 0 || channelsNumber !== Object.keys(channels).length) {
            if (moment(epgTag.start).startOf('day').diff(moment().add(maxArchiveDuration, 'days').startOf('day'), 'days') > 0) {
              that.updateEpg()
            }
          }
        })
      }
      console.log('[EPG grabber Orange] initialized')
      // Set periodic update (every day)
      setInterval(function () {
        that.updateEpg()
      }, 86400000)
    })
  }

  async updateEpg () {
    const that = this
    // Verify EPG status
    const epg = await this.db.Epg.findByPk(this.epgid)
    if (epg === null || epg.status === false) {
      return false
    }
    console.log('[EPG grabber Orange] updating...')
    // Get max archive
    const maxArchiveDuration = await this.getMaxArchive()
    // Define start,end date
    const lastEpgTag = await this.db.EpgTag.findOne({
      where: {
        epgId: this.epgid
      },
      raw: true,
      attributes: [
        [this.db.Sequelize.fn('max', this.db.Sequelize.col('EpgTag.start')), 'max']
      ]
    })
    let startDate = 0
    const endDate = moment().add(7, 'days').startOf('hour').unix() * 1000
    if (lastEpgTag.max === null) {
      // Today minus 7 days
      startDate = moment().subtract(7, 'days').startOf('hour').unix() * 1000
    } else if (moment().add(7, 'days').diff(moment(lastEpgTag.max), 'days') === 0) {
      console.log('[EPG grabber Orange] is up to date')
      return
    } else {
      startDate = moment(lastEpgTag.max).startOf('hour').unix() * 1000
    }
    // Get program
    let bulkCreate = []
    console.log('[EPG grabber Orange] update from ' + moment(startDate).format('YYYY-MM-DD') + ' to ' + moment(endDate).format('YYYY-MM-DD'))
    fetch('https://rp-live-pc.woopic.com/live-webapp/v3/applications/STB4PC/programs?groupBy=channel&includeEmptyChannels=false&period=' + startDate + ',' + endDate).then(function (response) {
      return response.json()
    }).then(async function (json) {
      for (const [channelId, programs] of Object.entries(json)) {
        if (Object.prototype.hasOwnProperty.call(channels, parseInt(channelId))) {
          for (const programIndex in programs) {
            // Check if programId not exists
            const epgTag = await that.db.sequelize.query('SELECT id FROM epgTag WHERE epgId = ' + that.epgid + ' AND programId = ' + programs[programIndex].id, {
              type: that.db.sequelize.QueryTypes.SELECT
            })
            if (epgTag.length === 0) {
              bulkCreate.push({
                epgId: that.epgid,
                programId: programs[programIndex].id,
                channel: channels[channelId].id,
                start: new Date(programs[programIndex].diffusionDate * 1000),
                stop: moment(programs[programIndex].diffusionDate * 1000).add(programs[programIndex].duration, 'seconds').toDate(),
                title: programs[programIndex].title,
                description: programs[programIndex].synopsis
              })
            }
          }
          if (bulkCreate.length > 10000) {
            await that.db.EpgTag.bulkCreate(bulkCreate)
            bulkCreate = []
          }
        }
      }
      if (bulkCreate.length > 0) {
        await that.db.EpgTag.bulkCreate(bulkCreate)
        bulkCreate = []
      }
      // Clean EPG programmes
      const stopDate = Math.round(new Date().getTime() / 1000) - (maxArchiveDuration * 86400)
      // Delete old entries
      await that.db.sequelize.query('DELETE FROM EpgTag WHERE epgId = :epgId AND stop < :stopDate', {
        type: that.db.sequelize.QueryTypes.SELECT,
        replacements: {
          epgId: that.epgid,
          stopDate: new Date(stopDate * 1000)
        }
      })
      // Delete channel not in array
      const channelId = []
      for (const channelIndex in channels) {
        channelId.push(channels[channelIndex].id)
      }
      await that.db.EpgTag.destroy({
        where: {
          channel: {
            [that.db.Sequelize.Op.notIn]: channelId
          },
          epgId: that.epgid
        }
      })
      console.log('[EPG grabber Orange] cleaned')
      // Update last update
      await that.db.Epg.update({
        lastScan: new Date()
      }, {
        where: {
          id: that.epgid
        }
      })
      // Optimize database size
      that.db.sequelize.query('VACUUM')
    }).catch(function (error) {
      console.log('[EPG grabber Orange] cant get program list')
      console.log(error)
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

  async getNumberOfChannel () {
    const channels = await this.db.EpgTag.findAll({
      where: {
        epgId: this.epgid
      },
      attributes: [
        'channel'
      ],
      group: [
        'channel'
      ]
    })
    return channels.length
  }
}
