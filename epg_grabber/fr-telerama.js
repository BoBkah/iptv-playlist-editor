'use strict'

const crypto = require('crypto')
const fetch = require('node-fetch')
const querystring = require('querystring')
const moment = require('moment')

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
  284: {
    name: 'Ciné+ Frisson',
    id: 'cinecinemafrisson.fr'
  },
  282: {
    name: 'Ciné+ Premier',
    id: 'cinecinemapremier.fr'
  },
  226: {
    name: 'CNEWS',
    id: 'cnews.fr'
  },
  53: {
    name: 'CNN',
    id: 'cnn.nws'
  },
  54: {
    name: 'Comédie+',
    id: 'comedie.fr'
  },
  2037: {
    name: 'Crime District',
    id: 'crimedistrict.fr'
  },
  458: {
    name: 'CSTAR',
    id: 'cstar.fr'
  },
  57: {
    name: 'Demain TV',
    id: 'demaintv.fr'
  },
  400: {
    name: 'Discovery Channel',
    id: 'discovery.fr'
  },
  1374: {
    name: 'Discovery Science',
    id: 'discoveryscience.fr'
  },
  58: {
    name: 'Disney Channel',
    id: 'disneychannel.fr'
  },
  299: {
    name: 'Disney Channel +1',
    id: 'disneychannelplus1.fr'
  },
  652: {
    name: 'Disney Cinema',
    id: 'disneycinema.fr'
  },
  300: {
    name: 'Disney Junior',
    id: 'disneyjunior.fr'
  },
  79: {
    name: 'Disney XD',
    id: 'disneyxd.fr'
  },
  560: {
    name: 'Dorcel TV',
    id: 'dorcel.fr'
  },
  405: {
    name: 'E !',
    id: 'eentertainment.fr'
  },
  403: {
    name: 'ElleGirl',
    id: 'ellegirl.fr'
  },
  64: {
    name: 'Equidia',
    id: 'equidia.fr'
  },
  1146: {
    name: 'Equidia Life',
    id: 'equidialife.fr'
  },
  1190: {
    name: 'Eurochannel',
    id: 'eurochannel.fr'
  },
  140: {
    name: 'Euronews',
    id: 'euronews.fr'
  },
  76: {
    name: 'Eurosport 1',
    id: 'eurosport1.fr'
  },
  439: {
    name: 'Eurosport 2',
    id: 'eurosport2.fr'
  },
  253: {
    name: 'Extreme Sports Channel',
    id: 'extremesports.fr'
  },
  1996: {
    name: 'Fashion TV',
    id: 'fashiontv.fr'
  },
  100: {
    name: 'Foot+ 24/24',
    id: 'foot+.fr'
  },
  4: {
    name: 'France 2',
    id: 'france2.fr'
  },
  529: {
    name: 'France 24',
    id: 'france24.fr'
  },
  80: {
    name: 'France 3',
    id: 'france3.fr'
  },
  78: {
    name: 'France 4',
    id: 'france4.fr'
  },
  47: {
    name: 'France 5',
    id: 'france5.fr'
  },
  160: {
    name: 'France Ô',
    id: 'franceo.fr'
  },
  2111: {
    name: 'Franceinfo',
    id: 'franceinfo.fr'
  },
  87: {
    name: 'Game One',
    id: 'gameone.fr'
  },
  563: {
    name: 'Ginx',
    id: 'ginx.fr'
  },
  1295: {
    name: 'Golf+',
    id: 'golfplus.fr'
  },
  1166: {
    name: 'Golf Channel',
    id: 'golfchannel.fr'
  },
  621: {
    name: 'Gong Max',
    id: 'gongmax.fr'
  },
  482: {
    name: 'Gulli',
    id: 'gulli.fr'
  },
  88: {
    name: 'Histoire',
    id: 'histoire.fr'
  },
  416: {
    name: 'Hustler TV',
    id: 'hustlertv.fr'
  },
  781: {
    name: 'I24news',
    id: 'i24news.fr'
  },
  701: {
    name: 'IDF1',
    id: 'idf1.fr'
  },
  94: {
    name: 'Infosport+',
    id: 'infosportplus.fr'
  },
  1585: {
    name: 'J-One',
    id: 'jone.fr'
  },
  110: {
    name: 'KTO',
    id: 'kto.fr'
  },
  929: {
    name: 'KZTV',
    id: 'ktztv.fr'
  },
  1401: {
    name: 'L\'Equipe',
    id: 'lequipe.fr'
  },
  124: {
    name: 'La Chaîne Météo',
    id: 'lachainemeteo.fr'
  },
  234: {
    name: 'La Chaîne parlementaire',
    id: 'lachaineparlementaire.fr'
  },
  187: {
    name: 'La Deux',
    id: 'ladeux.be'
  },
  892: {
    name: 'La Trois',
    id: 'latrois.be'
  },
  164: {
    name: 'La Une',
    id: 'laune.be'
  },
  112: {
    name: 'LCI',
    id: 'lci.fr'
  },
  118: {
    name: 'M6',
    id: 'm6.fr'
  },
  184: {
    name: 'M6 Boutique',
    id: 'm6boutique.fr'
  },
  453: {
    name: 'M6 Music',
    id: 'm6music.fr'
  },
  683: {
    name: 'Man-X',
    id: 'manx.fr'
  },
  6: {
    name: 'Mangas',
    id: 'mangas.fr'
  },
  987: {
    name: 'MCE (Ma Chaîne Etudiante)',
    id: 'mce.fr'
  },
  121: {
    name: 'MCM',
    id: 'mcm.fr'
  },
  343: {
    name: 'MCM Top',
    id: 'mcmtop.fr'
  },
  1136: {
    name: 'MCS Bien-être',
    id: 'mcsbienetre.fr'
  },
  2021: {
    name: 'MCS Maison',
    id: 'mcsmaison.fr'
  },
  265: {
    name: 'Melody',
    id: 'melody.fr'
  },
  125: {
    name: 'Mezzo',
    id: 'mezzo.fr'
  },
  907: {
    name: 'Mezzo Live HD',
    id: 'mezzolive.fr'
  },
  1045: {
    name: 'Mirabelle TV',
    id: 'mirabelle.fr'
  },
  237: {
    name: 'Motorsport TV',
    id: 'motorsport.fr'
  },
  128: {
    name: 'MTV',
    id: 'mtv.fr'
  },
  263: {
    name: 'MTV Base',
    id: 'mtvbase.fr'
  },
  2014: {
    name: 'MTV Dance',
    id: 'mtvdance.fr'
  },
  262: {
    name: 'MTV Hits',
    id: 'mtvhits.fr'
  },
  2006: {
    name: 'MTV Hits (France)',
    id: 'mtvhitsfrance.fr'
  },
  264: {
    name: 'MTV Rocks',
    id: 'mtvrocks.fr'
  },
  98: {
    name: 'Multisports',
    id: 'multisports.fr'
  },
  101: {
    name: 'Multisports 1',
    id: 'multisports1.fr'
  },
  102: {
    name: 'Multisports 2',
    id: 'multisports2.fr'
  },
  103: {
    name: 'Multisports 3',
    id: 'multisports3.fr'
  },
  104: {
    name: 'Multisports 4',
    id: 'multisports4.fr'
  },
  105: {
    name: 'Multisports 5',
    id: 'multisports5.fr'
  },
  106: {
    name: 'Multisports 6',
    id: 'multisports6.fr'
  },
  1072: {
    name: 'Museum',
    id: 'museum.fr'
  },
  243: {
    name: 'National Geographic',
    id: 'nationalgeographic.fr'
  },
  719: {
    name: 'National Geographic Wild',
    id: 'nationalgeographicwild.fr'
  },
  415: {
    name: 'Nautical Channel',
    id: 'nautical.fr'
  },
  473: {
    name: 'Nickelodéon',
    id: 'nickelodeon.fr'
  },
  888: {
    name: 'Nickelodeon Junior',
    id: 'nickelodeonjunior.fr'
  },
  1746: {
    name: 'Nickelodéon Teen',
    id: 'nickelodeonteen.fr'
  },
  787: {
    name: 'Nolife',
    id: 'nolife.fr'
  },
  1461: {
    name: 'Nollywood TV',
    id: 'nollywood.fr'
  },
  444: {
    name: 'NRJ 12',
    id: 'nrj12.fr'
  },
  605: {
    name: 'NRJ Hits',
    id: 'nrjhits.fr'
  },
  732: {
    name: 'OCS Choc',
    id: 'ocschoc.fr'
  },
  733: {
    name: 'OCS City',
    id: 'ocscity.fr'
  },
  734: {
    name: 'OCS Géants',
    id: 'ocsgeants.fr'
  },
  730: {
    name: 'OCS Max',
    id: 'ocsmax.fr'
  },
  463: {
    name: 'OLTV',
    id: 'oltv.fr'
  },
  334: {
    name: 'OMTV',
    id: 'omtv.fr'
  },
  517: {
    name: 'Onzéo',
    id: 'onzeo.fr'
  },
  1562: {
    name: 'Paramount Channel',
    id: 'paramount.fr'
  },
  145: {
    name: 'Paris Première',
    id: 'parispremiere.fr'
  },
  406: {
    name: 'Pink TV',
    id: 'pinktv.fr'
  },
  344: {
    name: 'Piwi+',
    id: 'piwiplus.fr'
  },
  147: {
    name: 'Planète+',
    id: 'planeteplus.fr'
  },
  402: {
    name: 'Planète+ Aventure Expérience',
    id: 'planetenolimit.fr'
  },
  662: {
    name: 'Planète+ Crime Investigation',
    id: 'planetejustice.fr'
  },
  2326: {
    name: 'Polar+',
    id: 'polarplus.fr'
  },
  289: {
    name: 'Polar',
    id: 'polar.fr'
  },
  241: {
    name: 'RFM TV',
    id: 'rfmtv.fr'
  },
  546: {
    name: 'RMC',
    id: 'rmc.fr'
  },
  1400: {
    name: 'RMC Découverte',
    id: 'rmcdecouverte.fr'
  },
  1382: {
    name: 'RMC Sport 4',
    id: 'rmcsport4.fr'
  },
  2095: {
    name: 'RMC Sport Access 1',
    id: 'rmcsportaccess1.fr'
  },
  675: {
    name: 'RMC Sport Access 2',
    id: 'rmcsportaccess2.fr'
  },
  2029: {
    name: 'RMC Sport UHD',
    id: 'rmcsportuhd.fr'
  },
  1402: {
    name: 'RMC Story',
    id: 'rmcstory.fr'
  },
  115: {
    name: 'RTL 9',
    id: 'rtl9.fr'
  },
  183: {
    name: 'RTS Deux',
    id: 'rtsdeux.ch'
  },
  202: {
    name: 'RTS Un',
    id: 'rtsun.ch'
  },
  63: {
    name: 'Science & Vie TV',
    id: 'scienceetvietv.fr'
  },
  173: {
    name: 'Seasons',
    id: 'seasons.fr'
  },
  49: {
    name: 'SERIECLUB',
    id: 'serieclub.fr'
  },
  1153: {
    name: 'SFR Sport 4',
    id: 'rmcsport4.fr'
  },
  833: {
    name: 'Sundance TV',
    id: 'sundance.fr'
  },
  479: {
    name: 'Syfy',
    id: 'syfy.fr'
  },
  185: {
    name: 'TCM Cinéma',
    id: 'tcm.fr'
  },
  197: {
    name: 'TéléToon+',
    id: 'teletoon.fr'
  },
  293: {
    name: 'TéléToon+1',
    id: 'teletoonplusun.fr'
  },
  191: {
    name: 'Téva',
    id: 'teva.fr'
  },
  192: {
    name: 'TF1',
    id: 'tf1.fr'
  },
  1404: {
    name: 'TF1 Séries Films',
    id: 'tf1seriesfilms.fr'
  },
  446: {
    name: 'TFX',
    id: 'tfx.fr'
  },
  229: {
    name: 'TIJI',
    id: 'tiji.fr'
  },
  195: {
    name: 'TMC',
    id: 'tmc.fr'
  },
  2040: {
    name: 'Toonami',
    id: 'toonami.fr'
  },
  7: {
    name: 'Toute l\'histoire',
    id: 'toutelhistoire.fr'
  },
  1179: {
    name: 'Trace Africa',
    id: 'traceafrica.fr'
  },
  1168: {
    name: 'TRACE Sport Stars',
    id: 'tracesport.fr'
  },
  1948: {
    name: 'Trace Toca',
    id: 'tracetoca.fr'
  },
  753: {
    name: 'Trace Tropical',
    id: 'tracetropical.fr'
  },
  325: {
    name: 'Trace Urban',
    id: 'traceurban.fr'
  },
  1776: {
    name: 'Trek',
    id: 'trek.fr'
  },
  205: {
    name: 'TV5MONDE',
    id: 'tv5monde.fr'
  },
  225: {
    name: 'TvBreizh',
    id: 'tvbreizh.fr'
  },
  451: {
    name: 'Ushuaïa TV',
    id: 'ushuaia.fr'
  },
  210: {
    name: 'VH1',
    id: 'vh1.fr'
  },
  690: {
    name: 'VH1 Classic',
    id: 'vh1classic.fr'
  },
  659: {
    name: 'Vivolta',
    id: 'vivolta.fr'
  },
  212: {
    name: 'Voyage',
    id: 'voyage.fr'
  },
  119: {
    name: 'W9',
    id: 'w9.fr'
  },
  2334: {
    name: 'Warner TV',
    id: 'warnertv.fr'
  },
  218: {
    name: 'XXL',
    id: 'xxl.fr'
  }
}

module.exports = class Grabber {
  // Create EPG entry
  constructor (db) {
    this.epgid = null
    this.db = db
    const that = this
    this.channels = channels
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
            /*
            if (epgTag.start.getTime() < new Date().getTime() + ((maxArchiveDuration - 1) * 86400000)) {
              that.updateEpg()
            }
            */
            if (moment(epgTag.start).diff(moment().add(maxArchiveDuration - 1, 'days'), 'days') > 0) {
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
