# KeyCDN Updater

This is a small Docker based node script that updates or creates KeyCDN Zones and Zonealiases based on a given zones.json file

## Usage

1. Check the zones.json file and create your copy of it somewhere on your machine
2. Get the API Key from KeyCDN
3. Run:

		docker run --rm -v $PWD/zones.json:/app/zones.json -e KEYCDN_APIKEY=YOURAPIKEY amazeeio/keycdn-updater
