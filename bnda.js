const { spawn } = require('child_process')
const ogr2ogr = '/usr/local/bin/ogr2ogr'
const Parser = require('json-text-sequence').parser

if (process.argv.length < 4) {
  console.log(`usage: node bndl.js {yyyy-mm-dd} {shapefiles...}`)
  process.exit()
}

const datsor = function (s) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}(process.argv[2])

const modify = (f) => {
  if ([26, 30].includes(f.properties.use)) {
    f.properties = {
      ISO3CD: f.properties.soc,
      BDYTYP: {26: 1, 30: 2}[f.properties.use]
    }
    return f
  } else {
    return null
  }
}

const post = spawn(ogr2ogr, [
  '-f', 'ESRI Shapefile',
  '-overwrite',
  'bndl.shp',
  '/vsistdin/'
], { stdio: ['pipe', 'inherit', 'inherit'] })

var p = new Parser()
  .on('data', f => {
    f = modify(f)
    if (f) {
      s = `\x1e${JSON.stringify(f)}\n`
      post.stdin.write(s)
    }
  })
  .on('finish', () => {
    post.stdin.end()
  })

for (let i = 3; i < process.argv.length; i++) {
  const shpPath = process.argv[i]
  const pre = spawn(ogr2ogr, [
    '-f', 'GeoJSONSeq',
    '-lco', 'RS=YES',
    '/vsistdout/',
    shpPath
  ], { stdio: ['inherit', 'pipe', 'pipe'] })
  pre.stdout.pipe(p)
}
