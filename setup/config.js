let MAP_CONFIG = {
  verbose: true,
  maxStoreLocations: 10,
  personalRadius: PERSONAL_RADIUS,
  //allowed to move this before considered has moved
  personalMovement: 20,
}

let CONFIG = {
  assetUrl:'',
  //combined with phaser to texture the audio levels
  useVolumeControl: true,
  filterOnlyAudioFormats: 'mp3',
  /*
  only play parts of the audio before skipping to the next,
  */
  partialPlay: false,
  noVisualMap: true,
  noGeo: true,

  entropyCut: true,
  maxSpeakingTime: 18,
  minSpeakingTime: 5,
  minInterludeTime: 3,
  maxInterludeTime: 8,

  maxSoundFadeInTime: 1000,

  baseSoundFadeOut: 1,
  effectSpeakingOverlapMax: 3,
  maxAmbientTime: 8,
  minAmbientTime: 2,

  maxMusicTime: 6,
  minMusicTime: 2,
  partialPlayOnBackground: false,
  chanceToPlayDominant: 0.75,
  chanceToRampAmbient: 0.25,
  chanceForSoloSpeaking:0.75,

  transitionRampDur: 8,

  map: MAP_CONFIG,
  mapUpdateSpeed:2000

}

let PERSONAL_RADIUS = 10
let SOUND_LIMIT_UPDATE = 30




let SOUND_LAYERS_DATA = {
  speaking: {
    id: 'speaking',
    options: {
      sound: {
        fadeDownBeforeEnding: 0.4,
        howler: {
          volume: 1
        }
      }
    }
  },
  effects: {
    id: 'effects',
    options: {
      sound: {
        fadeDownBeforeEnding: 0.4,
        howler: {
          volume: 0.1
        }
      }
    }
  },
  music: {
    id: 'music',
    options: {
      sound: {
        fadeDownBeforeEnding: 0.4,
        howler: {
          volume: 0.07
        }
      }
    }
  }
}


let PLAYLIST_PLACES_MAX = 3
let PLAYLIST_LENGTH = 60
let MIN_NEAR_FACTOR = 0.02
let MAX_NEAR_FACTOR = 0.99
let RAMP_DOWN_DUR = 8

//let ASSET_URL = 'https://storage.googleapis.com/samrad-deriveur/assets/'
let ASSET_URL = 'https://storage.googleapis.com/samrad-alhambra/assets/'

export {
  CONFIG,
  SOUND_LAYERS_DATA,
  ASSET_URL,
  MAP_CONFIG,
  PERSONAL_RADIUS,
  SOUND_LIMIT_UPDATE,

  RAMP_DOWN_DUR,
  MIN_NEAR_FACTOR,
  MAX_NEAR_FACTOR,
  PLAYLIST_LENGTH,
  PLAYLIST_PLACES_MAX
}
