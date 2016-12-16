
if (typeof process.env.KEYCDN_APIKEY === 'undefined') {
  throw new Error('KEYCDN_APIKEY Environment variable needs to be defined')
}

var KeyCDN = require('keycdn')
var keycdn = new KeyCDN(process.env.KEYCDN_APIKEY)

// zone.json contains the zones and zonealiases that we want to create or update
var zones = require('../zones.json')

function get(type, existingZoneID) {
  return new Promise((resolve, reject) => {
    keycdn.get(`${type}.json`, function(err, result) {
      if (err) {
          reject(err)
      }
      resolve(result)
    })
  })
}

function put(type, existingID, object) {
  return new Promise((resolve, reject) => {
    keycdn.put(`${type}/${existingID}.json`, object, function(err, result) {
      if (err) {
          reject(err)
      }
      console.log(`Updated ${type} Config for name '${object.name}', new config:`)
      console.log(result)
      resolve(result)
    })
  })
}

function push(type, object) {
  return new Promise((resolve, reject) => {
    keycdn.post(`${type}.json`, object, function(err, result) {
      if (err) {
          reject(err)
      }
      console.log(`Created ${type} Config for name '${object.name}', config:`)
      console.log(result)
      resolve(result)
    })
  })
}

zones.forEach((element) => {
  var zone = element.zone
  var zonealias = element.zonealias

  var zoneid = null

  // First load all existing zones from the API
  get('zones').then(result => {
    // Check if one of the existing zones has already the name like the one we want to create/udpate
    var existingZoneIndex = result.data.zones.findIndex(element => {
      return element.name === zone.name
    })
    // Zone already exists, use put to update.
    if (existingZoneIndex >= 0) {
      var existingZoneID = result.data.zones[existingZoneIndex].id
      console.log(`Found requested zone name '${zone.name}' on keycdn with zoneid: '${existingZoneID}', will update config....`)
      return put('zones', existingZoneID, zone)
    // Zone does not exist, use keycdn.push() to create.
    } else {
      console.log(`Did not find requested zone name '${zone.name}' on keycdn, will create new zone...`)
      return push('zones', zone)
    };
  }).then(result => {
    // saving the zoneid so that we can use it during updating of the zonealias
    zoneid = result.data.zone.id
    return get('zonealiases');
  }).then(result => {
    zonealias.zone_id = zoneid
    var existingZoneAliasIndex = result.data.zonealiases.findIndex(element => {
      return element.name === zonealias.name
    })
    // ZoneAlias already exists, use put to update.
    if (existingZoneAliasIndex >= 0) {
      var existingZoneAliasID = result.data.zonealiases[existingZoneAliasIndex].id
      console.log(`Found requested zonealias name '${zonealias.name}' on keycdn with zoneid: '${existingZoneAliasID}', nothing to do here`)
      return
    // Zone does not exist, use keycdn.push() to create.
    } else {
      console.log(`Did not find requested zonealias name '${zonealias.name}' on keycdn, will create new zone...`)
      console.log(zonealias)
      return push('zonealiases', zonealias)
    };
  }).catch(error => {
    console.log(error)
    process.exit(1);
  });

})



