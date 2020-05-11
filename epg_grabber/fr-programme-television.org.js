'use strict'

const fetch = require('node-fetch')
const fs = require('fs')
const lzma = require('lzma-native')
const moment = require('moment')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const channels = {
  2: {
    name: '13E RUE',
    id: '13rue.fr'
  },
  4: {
    name: 'FRANCE 2',
    id: 'france2.fr'
  },
  5: {
    name: 'AB1',
    id: 'ab1.fr'
  },
  6: {
    name: 'MANGAS',
    id: 'mangas.fr'
  },
  7: {
    name: 'TOUTE L\'HISTOIRE',
    id: 'toutelhistoire.fr'
  },
  10: {
    name: 'ACTION',
    id: 'action.fr'
  },
  12: {
    name: 'ANIMAUX',
    id: 'animaux.fr'
  },
  15: {
    name: 'AUTOMOTO',
    id: 'automoto.fr'
  },
  30: {
    name: 'CANAL+ DECALE',
    id: 'canalplusdecale.fr'
  },
  32: {
    name: 'CANAL J',
    id: 'canalj.fr'
  },
  33: {
    name: 'CANAL+ CINEMA',
    id: 'canalpluscinema.fr'
  },
  34: {
    name: 'CANAL+',
    id: 'canalplus.fr'
  },
  35: {
    name: 'CANAL+ SPORT',
    id: 'canalplussport.fr'
  },
  36: {
    name: 'CARTOON NETWORK',
    id: 'cartoonnetwork.fr'
  },
  38: {
    name: 'CHASSE PECHE',
    id: 'chassepeche.fr'
  },
  47: {
    name: 'FRANCE 5',
    id: 'france5.fr'
  },
  49: {
    name: 'SERIE CLUB',
    id: 'serieclub.fr'
  },
  50: {
    name: 'CLUB RTL',
    id: 'clubrtl.be'
  },
  54: {
    name: 'COMEDIE+',
    id: 'comedieplus.fr'
  },
  57: {
    name: 'DEMAIN',
    id: 'demain.fr'
  },
  58: {
    name: 'DISNEY CHANNEL',
    id: 'disneychannel.fr'
  },
  63: {
    name: 'SCIENCE & VIE TV',
    id: 'scienceetvietv.fr'
  },
  64: {
    name: 'EQUIDIA',
    id: 'equidia.fr'
  },
  76: {
    name: 'EUROSPORT',
    id: 'eurosport.fr'
  },
  78: {
    name: 'FRANCE4',
    id: 'france4.fr'
  },
  79: {
    name: 'DISNEY XD',
    id: 'disneyxd.fr'
  },
  80: {
    name: 'FRANCE 3',
    id: 'france3.fr'
  },
  87: {
    name: 'GAME ONE',
    id: 'gameone.fr'
  },
  88: {
    name: 'HISTOIRE TV',
    id: 'histoiretv.fr'
  },
  94: {
    name: 'INFOSPORT+',
    id: 'infosport.fr'
  },
  110: {
    name: 'KTO',
    id: 'kto.fr'
  },
  111: {
    name: 'ARTE',
    id: 'arte.fr'
  },
  112: {
    name: 'LCI',
    id: 'lci.fr'
  },
  115: {
    name: 'RTL9',
    id: 'rtl9.fr'
  },
  118: {
    name: 'M6',
    id: 'm6.fr'
  },
  119: {
    name: 'W9',
    id: 'w9.fr'
  },
  121: {
    name: 'MCM',
    id: 'mcm.fr'
  },
  125: {
    name: 'MEZZO',
    id: 'mezzo.fr'
  },
  128: {
    name: 'MTV',
    id: 'mtv.fr'
  },
  140: {
    name: 'EURONEWS',
    id: 'euronews.fr'
  },
  145: {
    name: 'PARIS PREMIERE',
    id: 'parispremiere.fr'
  },
  147: {
    name: 'PLANETE+',
    id: 'planete.fr'
  },
  160: {
    name: 'FRANCE O',
    id: 'franceo.fr'
  },
  173: {
    name: 'SEASONS',
    id: 'seasons.fr'
  },
  185: {
    name: 'TCM CINEMA',
    id: 'tcmcinema.fr'
  },
  191: {
    name: 'TEVA',
    id: 'teva.fr'
  },
  192: {
    name: 'TF1',
    id: 'tf1.fr'
  },
  195: {
    name: 'TMC',
    id: 'tmc.fr'
  },
  197: {
    name: 'TELETOON+',
    id: 'teletoonplus.fr'
  },
  205: {
    name: 'TV5MONDE',
    id: 'tv5monde.fr'
  },
  212: {
    name: 'VOYAGE',
    id: 'voyage.fr'
  },
  218: {
    name: 'XXL',
    id: 'xxl.fr'
  },
  225: {
    name: 'TV BREIZH',
    id: 'tvbreizh.fr'
  },
  226: {
    name: 'CNEWS',
    id: 'cnews.fr'
  },
  229: {
    name: 'TIJI',
    id: 'tiji.fr'
  },
  234: {
    name: 'LCP/PS',
    id: 'lcp.fr'
  },
  237: {
    name: 'MOTORS TV',
    id: 'motorstv.fr'
  },
  243: {
    name: 'NATIONAL GEOGRAPHIC',
    id: 'nationalgeographic.fr'
  },
  249: {
    name: 'FRANCE 3 ALSACE',
    id: 'france3alsace.fr'
  },
  253: {
    name: 'EXTREME SPORTS CHANNEL',
    id: 'extremesports.fr'
  },
  254: {
    name: 'AB3',
    id: 'ab3.fr'
  },
  264: {
    name: 'MTV ROCKS',
    id: 'mtvrocks.fr'
  },
  265: {
    name: 'MELODY',
    id: 'melody.fr'
  },
  273: {
    name: 'TV7 BORDEAUX',
    id: 'tv7bordeaux.fr'
  },
  282: {
    name: 'CINE+ PREMIER',
    id: 'cinecinemapremier.fr'
  },
  283: {
    name: 'CINE+ EMOTION',
    id: 'cinecinemaemotion.fr'
  },
  284: {
    name: 'CINE+ FRISSON',
    id: 'cinecinemafrisson.fr'
  },
  285: {
    name: 'CINE+ CLUB',
    id: 'cinecinemaclub.fr'
  },
  287: {
    name: '8CINE+ CLASSIC',
    id: 'cinecinemaclassic.fr'
  },
  288: {
    name: 'CINE FX',
    id: 'cinefx.fr'
  },
  289: {
    name: 'CINE POLAR',
    id: 'cinepolar.fr'
  },
  300: {
    name: 'DISNEY JUNIOR',
    id: 'disneyjunior.fr'
  },
  303: {
    name: 'AB4',
    id: 'ab4.fr'
  },
  321: {
    name: 'BOOMERANG',
    id: 'boomerang.fr'
  },
  325: {
    name: 'TRACE URBAN',
    id: 'traceurban.fr'
  },
  334: {
    name: 'OMTV',
    id: 'omtv.fr'
  },
  343: {
    name: 'MCM TOP',
    id: 'mcmtop.fr'
  },
  344: {
    name: 'PIWI+',
    id: 'piwiplus.fr'
  },
  400: {
    name: 'DISCOVERY CHANNEL',
    id: 'discoverychannel.fr'
  },
  401: {
    name: 'CINE+ FAMIZ',
    id: 'cinecinemafamiz.fr'
  },
  402: {
    name: 'PLANETE+ A&E',
    id: 'planetenolimit.fr'
  },
  403: {
    name: 'ELLE GIRL',
    id: 'ellegirl.fr'
  },
  405: {
    name: 'E! ENTERTAINMENT',
    id: 'eentertainment.fr'
  },
  406: {
    name: 'PINK TV',
    id: 'pinktv.fr'
  },
  415: {
    name: 'NAUTICAL CHANNEL',
    id: 'nauticalchannel.fr'
  },
  444: {
    name: 'NRJ12',
    id: 'nrj12.fr'
  },
  445: {
    name: 'C8',
    id: 'c8.fr'
  },
  446: {
    name: 'TFX',
    id: 'tfx.fr'
  },
  451: {
    name: 'USHUAIA TV',
    id: 'ushuaiatv.fr'
  },
  453: {
    name: 'M6 MUSIC',
    id: 'm6music.fr'
  },
  458: {
    name: 'CSTAR',
    id: 'cstar.fr'
  },
  473: {
    name: 'NICKELODEON',
    id: 'nickelodeon.fr'
  },
  481: {
    name: 'BFM TV',
    id: 'bfmtv.fr'
  },
  482: {
    name: 'GULLI',
    id: 'gulli.fr'
  },
  508: {
    name: 'NATIONAL GEOGRAPHIC',
    id: 'nationalgeographic.fr'
  },
  529: {
    name: 'FRANCE 24',
    id: 'france24.fr'
  },
  531: {
    name: 'LUXE TV',
    id: 'luxetv.fr'
  },
  563: {
    name: 'GINX',
    id: 'ginx.fr'
  },
  605: {
    name: 'NRJ HITS',
    id: 'nrjhits.fr'
  },
  634: {
    name: 'FRANCE 3 BRETAGNE',
    id: 'france3bretagne.fr'
  },
  635: {
    name: 'FRANCE 3 PAYS DE LA LOIRE',
    id: 'france3paysdelaloire.fr'
  },
  636: {
    name: 'FRANCE 3 BOURGOGNE',
    id: 'france3bourgogne.fr'
  },
  637: {
    name: 'FRANCE 3 FRANCHE COMTE',
    id: 'france3franchecomte.fr'
  },
  638: {
    name: 'FRANCE 3 LIMOUSIN',
    id: 'france3limousin.fr'
  },
  639: {
    name: 'FRANCE 3 POITOU CHARENTES',
    id: 'france3poitoucharentes.fr'
  },
  640: {
    name: 'FRANCE 3 LORRAINE',
    id: 'france3lorraine.fr'
  },
  641: {
    name: 'FRANCE 3 CHAMPAGNE ARDENNE',
    id: 'france3champagneardenne.fr'
  },
  642: {
    name: 'FRANCE 3 COTE D\'AZUR',
    id: 'france3codedazur.fr'
  },
  643: {
    name: 'FRANCE 3 PROVENCE ALPES',
    id: 'france3provencealpes.fr'
  },
  644: {
    name: 'FRANCE 3 NORD PAS DE CALAIS',
    id: 'france3nordpasdecalais.fr'
  },
  645: {
    name: 'FRANCE 3 PICARDIE',
    id: 'france3picardie.fr'
  },
  646: {
    name: 'FRANCE 3 NORMANDIE ROUEN',
    id: 'france3normandierouen.fr'
  },
  647: {
    name: 'FRANCE 3 NORMANDIE CAEN',
    id: 'france3normandie.fr'
  },
  648: {
    name: 'FRANCE 3 RHONE ALPES',
    id: 'france3rhonealpes.fr'
  },
  649: {
    name: 'FRANCE 3 AUVERGNE',
    id: 'france3auvergne.fr'
  },
  650: {
    name: 'FRANCE 3 LANGUEDOC',
    id: 'france3languedoc.fr'
  },
  651: {
    name: 'FRANCE 3 MIDI-PYRENEES',
    id: 'france3midipyrenees.fr'
  },
  655: {
    name: 'FRANCE 3 ALPES',
    id: 'france3alpes.fr'
  },
  657: {
    name: 'CANAL+ FAMILY',
    id: 'canalplusfamily.fr'
  },
  662: {
    name: 'PLANETE+ CI',
    id: 'planetejustice.fr'
  },
  719: {
    name: 'NATIONAL GEOGRAPHIC WILD',
    id: 'nationalgeographicwild.fr'
  },
  730: {
    name: 'OCS MAX',
    id: 'ocsmax.fr'
  },
  732: {
    name: 'OCS CHOC',
    id: 'ocschoc.fr'
  },
  733: {
    name: 'OCS CITY',
    id: 'ocscity.fr'
  },
  734: {
    name: 'OCS GEANTS',
    id: 'ocsgeants.fr'
  },
  781: {
    name: 'I24NEWS',
    id: 'i24news.fr'
  },
  829: {
    name: 'MY ZEN TV',
    id: 'myzentv.fr'
  },
  888: {
    name: 'NICKELODEON JUNIOR',
    id: 'nickelodeonjunior.fr'
  },
  907: {
    name: 'MEZZO LIVE HD',
    id: 'mozzolive.fr'
  },
  924: {
    name: 'BOING',
    id: 'boing.fr'
  },
  928: {
    name: 'BOOMERANG +1',
    id: 'boomerangplus1.fr'
  },
  992: {
    name: 'LCP 100%',
    id: 'lcp100.fr'
  },
  1061: {
    name: 'A LA MAISON',
    id: 'alamaison.fr'
  },
  1072: {
    name: 'MUSEUM',
    id: 'museum.fr'
  },
  1073: {
    name: 'BFM BUSINESS',
    id: 'bfmbusiness.fr'
  },
  1166: {
    name: 'GOLF CHANNEL',
    id: 'golf.fr'
  },
  1167: {
    name: 'GAME ONE +1',
    id: 'gameoneplus1.fr'
  },
  1190: {
    name: 'EUROCHANNEL',
    id: 'eurochannel.fr'
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
  1353: {
    name: 'STINGRAY CLASSICA',
    id: 'stringrayclassica.fr'
  },
  1382: {
    name: 'RMC Sport 4',
    id: 'rmcsport4.fr'
  },
  1399: {
    name: 'CHERIE 25',
    id: 'cherie25.fr'
  },
  1400: {
    name: 'RMC DECOUVERTE',
    id: 'rmcdecouverte.fr'
  },
  1401: {
    name: 'LA CHAINE L\'EQUIPE',
    id: 'lachainelequipe.fr'
  },
  1402: {
    name: 'RMC STORY',
    id: 'rmcstory.fr'
  },
  1403: {
    name: '6TER',
    id: '6ter.fr'
  },
  1404: {
    name: 'TF1 SERIES FILMS',
    id: 'tf1seriesfilms.fr'
  },
  1408: {
    name: 'NON STOP PEOPLE',
    id: 'nonstoppeople.fr'
  },
  1562: {
    name: 'PARAMOUNT CHANNEL',
    id: 'paramountchannel.fr'
  },
  1563: {
    name: 'CANAL+ SERIES',
    id: 'canalplusseries.fr'
  },
  1585: {
    name: 'J-ONE',
    id: 'jone.fr'
  },
  1746: {
    name: 'NICKELODEON TEEN',
    id: 'nickelodeonteen.fr'
  },
  1776: {
    name: 'TREK',
    id: 'trek.fr'
  },
  1832: {
    name: 'NOVELAS TV',
    id: 'novelastv.fr'
  },
  1960: {
    name: 'BET',
    id: 'bet.fr'
  },
  1989: {
    name: 'CLUBBING TV',
    id: 'clubbingtv.fr'
  },
  1996: {
    name: 'FASHION TV',
    id: 'fashiontv.fr'
  },
  2006: {
    name: 'MTV HITS',
    id: 'mtvhits.fr'
  },
  2029: {
    name: 'RMC Sport 1 UHD',
    id: 'rmcsport1uhd.fr'
  },
  2037: {
    name: 'CRIME DISTRICT',
    id: 'crimedistrict.fr'
  },
  2040: {
    name: 'TOONAMI',
    id: 'toonami.fr'
  },
  2065: {
    name: 'NICKELODEON +1',
    id: 'nickelodeonplus1.fr'
  },
  2094: {
    name: 'ULTRA NATURE',
    id: 'ultranature.fr'
  },
  2096: {
    name: 'RMC Sport News',
    id: 'rmcsportnews.fr'
  },
  2111: {
    name: 'FRANCEINFO:',
    id: 'franceinfo.fr'
  },
  2153: {
    name: 'OKLM TV',
    id: 'oklmtv.fr'
  },
  2171: {
    name: 'VICE TV',
    id: 'vicetv.fr'
  },
  2184: {
    name: 'Discovery Investigation',
    id: 'discoveryinvestigation.fr'
  },
  2326: {
    name: 'POLAR+',
    id: 'polarplus.fr'
  },
  2334: {
    name: 'WARNER TV',
    id: 'warnertv.fr'
  },
  2353: {
    name: 'ES1',
    id: 'es1.fr'
  },
  2441: {
    name: 'TF1+1',
    id: 'tf1plus1.fr'
  },
  2442: {
    name: 'TMC +1',
    id: 'tmcplus1.fr'
  },
  2665: {
    name: 'RMC Sport 1',
    id: 'rmcsport1.fr'
  },
  2666: {
    name: 'RMC Sport 2',
    id: 'rmcsport2.fr'
  },
  2667: {
    name: 'RMC Sport 3',
    id: 'rmcsport3.fr'
  },
  2668: {
    name: 'RMC Sport Live 5',
    id: 'rmcsportlive5.fr'
  },
  2669: {
    name: 'RMC Sport Live 6',
    id: 'rmcsportlive6.fr'
  },
  2670: {
    name: 'RMC Sport Live 7',
    id: 'rmcsportlive7.fr'
  },
  2671: {
    name: 'RMC Sport Live 8',
    id: 'rmcsportlive8.fr'
  },
  2672: {
    name: 'RMC Sport Live 9',
    id: 'rmcsportlive9.fr'
  },
  2673: {
    name: 'RMC Sport Live 10',
    id: 'rmcsportlive10.fr'
  },
  2674: {
    name: 'RMC Sport Live 11',
    id: 'rmcsportlive11.fr'
  },
  2675: {
    name: 'RMC Sport Live 12',
    id: 'rmcsportlive12.fr'
  },
  2676: {
    name: 'RMC Sport Live 13',
    id: 'rmcsportlive13.fr'
  },
  2677: {
    name: 'RMC Sport Live 14',
    id: 'rmcsportlive14.fr'
  },
  2678: {
    name: 'RMC Sport Live 15',
    id: 'rmcsportlive15.fr'
  },
  2679: {
    name: 'RMC Sport Live 16',
    id: 'rmcsportlive16.fr'
  },
  2752: {
    name: 'COMEDY CENTRAL',
    id: 'comedycentral.fr'
  },
  2781: {
    name: 'CLIQUE TV',
    id: 'cliquetv.fr'
  },
  2803: {
    name: 'PITCHOUN',
    id: 'pitchountv.fr'
  },
  2837: {
    name: 'SPORT EN FRANCE',
    id: 'sportenfrance.fr'
  },
  2942: {
    name: '01TV',
    id: '01tv.fr'
  },
  2958: {
    name: 'OLYMPIA TV',
    id: 'olympiatv.fr'
  },
  90112: {
    name: 'AEROSTAR TV',
    id: 'aerostartv.fr'
  },
  90150: {
    name: 'TRACE URBAN',
    id: 'traceurban.fr'
  },
  90159: {
    name: 'RFM TV',
    id: 'rfmtv.fr'
  },
  90161: {
    name: 'TRACE TROPICAL',
    id: 'tracetropical.fr'
  },
  90162: {
    name: 'TRACE LATINA',
    id: 'tracelatina.fr'
  },
  90165: {
    name: 'CSTAR HITS FRANCE',
    id: 'cstarhitsfrance.fr'
  },
  90208: {
    name: 'M6 BOUTIQUE',
    id: 'm6boutique.fr'
  },
  90216: {
    name: 'MEN\'S UP TV',
    id: 'mensuptv.fr'
  },
  90221: {
    name: 'SOUVENIRS FROM EARTH',
    id: 'souvenirsfromearth.fr'
  },
  90226: {
    name: 'PUBLIC SENAT',
    id: 'publicsenat.fr'
  },
  90230: {
    name: 'LA CHAINE METEO',
    id: 'lachainemeteo.fr'
  },
  90233: {
    name: 'SKYNEWS',
    id: 'skynews.fr'
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
    this.channels = channels
    // Add this grabber
    db.Epg.findOne({
      where: {
        name: 'Programme-television.org'
      }
    }).then(function (epg) {
      if (epg === null) {
        db.Epg.create({
          name: 'Programme-television.org',
          grabber: 'programme-television.org',
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
            // const channelsNumber = await that.getNumberOfChannel()
            // if (moment(epgTag.start).startOf('day').diff(moment().add(maxArchiveDuration, 'days').startOf('day'), 'days') > 0 || channelsNumber !== Object.keys(channels).length) {
            if (moment(epgTag.start).startOf('day').diff(moment().add(maxArchiveDuration, 'days').startOf('day'), 'days') > 0) {
              that.updateEpg()
            }
          }
        })
      }
      console.log('[EPG grabber Programme-television.org] initialized')
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
    console.log('[EPG grabber Programme-television.org] updating...')
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
      console.log('[EPG grabber Programme-television.org] is up to date')
      return
    } else {
      startDate = moment(lastEpgTag.max).startOf('hour').unix() * 1000
    }
    // Get program
    // let bulkCreate = []
    console.log('[EPG grabber Programme-television.org] update from ' + moment(startDate).format('YYYY-MM-DD') + ' to ' + moment(endDate).format('YYYY-MM-DD'))
    let epgDay = startDate
    // Create temp directory
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'temp'))
    }
    while (moment(epgDay).diff(endDate) < 0) {
      const decompressor = new lzma.createDecompressor()
      // Download database from CDN
      if (fs.existsSync(path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))) {
        console.log('[EPG grabber Programme-television.org] delete previous database file ' + path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))
        try {
          fs.unlinkSync(path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))
        } catch (error) {
          console.log(error)
        }
      }
      console.log('[EPG grabber Programme-television.org] download ' + moment(epgDay).format('YYYY-MM-DD') + ' database')
      const response = await fetch('https://cdn.programme-television.ladmedia.fr/shared/mobile/bdd/partial/newfull_' + moment(epgDay).format('YYYYMMDD') + '.sqlite.xz')
      const fileStream = fs.createWriteStream(path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))
      await new Promise(function (resolve, reject) {
        response.body.pipe(decompressor).pipe(fileStream)
        response.body.on('error', function (error) {
          console.error(error)
          return reject(error)
        })
        fileStream.on('finish', function () {
          console.log('[EPG grabber Programme-television.org] download complete ' + moment(epgDay).format('YYYY-MM-DD'))
          return resolve()
        })
      })
      // Load database
      if (fs.existsSync(path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))) {
        const database = new sqlite3.Database(path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))
        await new Promise(function (resolve, reject) {
          database.all('SELECT * FROM chaine', function (err, chaines) {
            if (err) {
              console.error('[EPG grabber Programme-television.org] ' + err)
              return reject(err)
            }
            // Get all programs
            database.each('SELECT id_diffusion, id_chaine, date_diffusion, duree_diffusion, titre_diffusion, sous_titre_diffusion, texte FROM speed_diffusion LEFT JOIN texte ON texte.id_texte = speed_diffusion.id_texte', function (err, program) {
              if (err) {
                return false
              }
              if (Object.prototype.hasOwnProperty.call(channels, program.id_chaine)) {
                that.db.EpgTag.findOne({
                  where: {
                    epgId: that.epgid,
                    channel: channels[program.id_chaine].id,
                    programId: program.id_diffusion
                  }
                }).then(function (row) {
                  if (row === null) {
                    that.db.EpgTag.create({
                      epgId: that.epgid,
                      channel: channels[program.id_chaine].id,
                      programId: program.id_diffusion,
                      start: new Date(program.date_diffusion),
                      stop: moment(program.date_diffusion).add(program.duree_diffusion, 'minute').toDate(),
                      title: program.titre_diffusion + (program.sous_titre_diffusion !== '' ? ' | ' + program.sous_titre_diffusion : ''),
                      description: program.texte
                    })
                  }
                })
              }
            }, function () {
              // Close database
              database.close(function (err) {
                if (err) {
                  console.error('[EPG grabber Programme-television.org] cant close database ' + path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))
                  return reject(err)
                }
                try {
                  fs.unlinkSync(path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))
                } catch (err) {
                  console.log('[EPG grabber Programme-television.org] cant delete file ' + path.join(process.cwd(), 'temp/programme-television-org-' + moment(epgDay).format('YYYYMMDD') + '.sqlite'))
                  console.error(err)
                }
                // Next day
                epgDay = moment(epgDay).add(1, 'day').toDate()
                return resolve()
              })
            })
          })
        })
      }
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
    console.log('[EPG grabber Programme-television.org] cleaned')
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
