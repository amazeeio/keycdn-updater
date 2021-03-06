
if (typeof process.env.KEYCDN_APIKEY === 'undefined') {
  throw new Error('KEYCDN_APIKEY Environment variable needs to be defined')
}

var KeyCDN = require('keycdn')
var locks = require('locks');

var keycdn = new KeyCDN(process.env.KEYCDN_APIKEY)
var mutex = locks.createMutex();

// zone.json contains the zones and zonealiases that we want to create or update
var zones = require('../zones.json')

function get(type) {
  return new Promise((resolve, reject) => {
    keycdn.get(`${type}.json`, function(err, result) {
      if (err) {
          reject(err)
      }
      setTimeout(() => {
        resolve(result)
      }, 500); // the KeyCDN API can handle max 2 requests per sec, so we delay the resolving by 500ms
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
      setTimeout(() => {
        resolve(result)
      }, 500);
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
      setTimeout(() => {
        resolve(result)
      }, 500);
    })
  })
}

function updateZone(zone, zonealias) {
  var zoneid = null
  return get('zones').then(result => {
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
  }).then(()=> {
    mutex.unlock()
  })
  .catch(error => {
    console.log(error)
    mutex.unlock()
    process.exit(1)
  });
}

zones.forEach((element) => {
  var zone = element.zone
  var zonealias = element.zonealias

  mutex.lock(function () {
    updateZone(zone, zonealias)
  });
})



