const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const ogr2ogr = '/usr/local/bin/ogr2ogr'
const tmpPath = 'temporary.geojsons'
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

let nProcesses = 0
const w = fs.createWriteStream(tmpPath)
for (let i = 2; i < process.argv.length; i++) {
  const shpPath = process.argv[i]
  const pre = spawn(ogr2ogr, [
    '-skipfailures',
    '-dim', '2',
    '-oo', 'ENCODING=ISO-8859-1',
    '-f', 'GeoJSONSeq',
    '-lco', 'RS=YES',
    tmpPath,
    shpPath
  ], { stdio: ['inherit', 'pipe', 'inherit'] })
  nProcesses++
  pre.stdout.pipe(new Parser()
    .on('data', f => {
      f = modify(f)
      if (f) {
        let s = `\x1e${JSON.stringify(f)}\n`
        w.write(s)
      }
    })
    .on('finish', () => {
      nProcesses--
      if (nProcesses === 0) {
        w.close()
        spawnSync(ogr2ogr, [
          '-skipfailures',
          '-f', 'ESRI Shaepfile',
          '-overwrite',
          'dst/bndl.shp',
          tmpPath
        ], { stdio: ['inherit', 'inherit', 'inherit'] })
      }
    })
  )
}
