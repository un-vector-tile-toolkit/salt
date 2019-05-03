const { spawn } = require('child_process')
const ogr2ogr = '/usr/local/bin/ogr2ogr'
const Parser = require('json-text-sequence').parser

if (process.argv.length < 3) {
  console.log(`usage: node bndl.js {shapefiles...}`)
  process.exit()
}

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
  'dst/bndl.shp',
  '/vsistdin/'
], { stdio: ['pipe', 'inherit', 'inherit'] })

let nProcesses = 0
for (let i = 2; i < process.argv.length; i++) {
  const shpPath = process.argv[i]
  const pre = spawn(ogr2ogr, [
    '-f', 'GeoJSONSeq',
    '-lco', 'RS=YES',
    '/vsistdout/',
    shpPath
  ], { stdio: ['inherit', 'pipe', 'inherit'] })
  nProcesses++
  pre.stdout.pipe(new Parser()
    .on('data', f => {
      f = modify(f)
      if (f) {
        s = `\x1e${JSON.stringify(f)}\n`
        post.stdin.write(s)
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
