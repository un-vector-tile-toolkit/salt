const { spawn } = require('child_process')
const ogr2ogr = '/usr/local/bin/ogr2ogr'
const Parser = require('json-text-sequence').parser
const polylabel = require('@mapbox/polylabel')

if (process.argv.length < 4) {
  console.log(`usage: node bnda.js {yyyy-mm-dd} {shapefiles...}`)
  process.exit()
}

const datsor = (function (s) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
})(process.argv[2])

const modify = (f) => {
  const salb = f.properties.salb || 'UNK'
  let adm1cd = ''
  let adm2cd = ''
  if (salb !== 'UNK') {
    adm1cd = salb.slice(0, 6)
    adm2cd = salb.slice(0, 9)
  }
  f.properties = {
    ISO3CD: f.properties.coc,
    ADM1NM: f.properties.nam,
    ADM1CD: adm1cd,
    ADM2NM: f.properties.laa,
    ADM2CD: adm2cd,
    DATSOR: datsor
  }
  if (f.geometry.type === 'Polygon') {
    const pointCoordinates = polylabel(f.geometry.coordinates)
    f.geometry.type = 'Point'
    f.geometry.coordinates = pointCoordinates
  }
  return f
}

const post = spawn(ogr2ogr, [
  '-f', 'ESRI Shapefile',
  '-overwrite',
  'dst/bndp.shp',
  '/vsistdin/'
], { stdio: ['pipe', 'inherit', 'inherit'] })

let nProcesses = 0
const modifyAndWrite = (f) => {
  f = modify(f)
  if (f) {
    const s = `\x1e${JSON.stringify(f)}\n`
    post.stdin.write(s)
  }
}
for (let i = 3; i < process.argv.length; i++) {
  const shpPath = process.argv[i]
  const pre = spawn(ogr2ogr, [
    '-oo', 'ENCODING=ISO-8859-1',
    '-dim', '2',
    '-f', 'GeoJSONSeq',
    '-lco', 'RS=YES',
    '/vsistdout/',
    shpPath
  ], { stdio: ['inherit', 'pipe', 'inherit'] })
  nProcesses++
  pre.stdout.pipe(new Parser()
    .on('data', f => {
      if (f.geometry.type === 'MultiPolygon') {
        for (let polygonCoordinates of f.geometry.coordinates) {
          let f2 = JSON.parse(JSON.stringify(f))
          f2.geometry.type = 'Polygon'
          f2.geometry.coordinates = polygonCoordinates
          modifyAndWrite(f)
        }
      } else {
        modifyAndWrite(f)
      }
    })
    .on('finish', () => {
      nProcesses--
      if (nProcesses === 0) {
        post.stdin.end()
      }
    })
  )
}
