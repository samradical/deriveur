#Geolocalised audio mixing

`npm i`

Depends on [sono](https://github.com/Stinkdigital/sono) audio library. Have sono loaded on the window

`let _deriveur = new Dervieur(layerData, locationData, controlOptions`

<hr>


###layerData


[like this](example/layerData.js)

Reads assets from this:

`"path": "../www-assets/tour/loc0/speaking/Cecile01_sleep_water_air.mp3",`

Basically buckets of sound broken into layers:

`speaking`,`music`,`effects`

Folder structure

![](https://66.media.tumblr.com/eaf3405a5b3497bed1230d183da824b5/tumblr_og1lcqUOQ11vjlpqwo1_1280.png)



###locationData


Lat/Lng coordinates for the geolocation to read from.


[like this](example/locationData.js)


###controlOptions

`{
        noVisualMap: true,
        noGeo: false,
        mapUpdateSpeed: 3500,
        filterOnlyAudioFormats: 'mp3', //Detector.IS_IOS ? 'mp3' : 'ogg',
        assetsUrl: REMOTE_ASSETS_DIR
      }

`REMOTE_ASSETS_DIR` is expecting `https://storage.googleapis.com/samrad-alhambra/www-assets/`
