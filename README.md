# salt
Utility script to convert Global Map administrative area data to SALB input data

# output data specifications
## bndl.shp
- LineString data that represents the administrative boundaries which divide two administrative units.
- `ISO3CD`: ISO 3166-1 three letter code in String.
- `BDYTYP`: administrative boundary type, distributing administrative boundary line for 1st level or 2nd level boundaries in Number.

## bndp.shp
- Point data that represents pseudo-centroid of the administrative units and related entities in the form of an area.
- `ISO3CD`: ISO 3166-1 three letter code in String.
- `ADM1NM`: Administrative unit level 1 name in String.
- `ADM1CD`: Administrative unit level 1 code in String; something like SEN007.
- `ADM2NM`: Administrative unit level 2 name in String.
- `ADM2CD`: Administrative unit level 2 code in String; something like SEN007003.
- `DATSOR`: Date of source; date of the receipt of the dataset, in the format of DD/MM/YYYY.

# about the input data
## DATSOR issue
https://github.com/globalmaps/metadata/blob/master/metadata.csv has the release date from ISCGM.

## Data mapping from Global Map
This is based on Global Map version 2 specifications, but can possibley applied for Global Map version 1 which is without `salb` property. 

```javascript
f.properties = {
  ISO3CD: f.properties.coc,
  ADM1NM: f.properties.nam,
  ADM1CD: f.properties.salb,
  ADN2NM: f.properties.laa,
  ADM2CD: f.properties.salb,
  DATSOR: datsor
}
```

# how to use
## install
- Install ogr2ogr with GDAL 2.4.0 or later. Such a new version is required because we use RFC 8142 (GeoJSON Text Sequences, as represented as GeoJSONSeq or `.geojsons` in GDAL ecosystem) as the wire format of the geospatial feature sequence. 
- Install this script as below.

```console
git clone git@github.com:un-vector-tile-toolkit/salt
cd salt
npm install
```

## run
```console
node bndl.js 2008-11-20 your/bndl.shp
node bndp.js 2008-11-20 your/bndp.shp your/bnda.shp
```

# implementation strategy
1. make use of ogr2ogr to convert from/to Shapefile.
2. use the `modify.js` pattern.

# TODO
- maybe I should write a Dockerfile so that this script can be run easily.

# See also
- [Second Administrative Level Boundaries Data Product Specification Version 1.1](https://www.unsalb.org/sites/default/files/wysiwyg_uploads/docs_uploads/SALB_DataProductSpecification_v1.1.pdf) especially p. 7
