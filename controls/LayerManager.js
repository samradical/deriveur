import _ from 'lodash'
import State from './State'
import Layer from '../sound/Layer'
import SpeakingLayer from '../sound/SpeakingLayer'
import MusicLayer from '../sound/MusicLayer'
import EffectsLayer from '../sound/EffectsLayer'
import Emitter from '../utils/DerivEmitter'
import Utils from '../utils/UTILS'

const LIMIT_UPDATE = 30
const VOLUME_MOD_INTENSITY = .25

export default class LayerManager {
  constructor(config = {}) {
    this.SOUND_LAYERS = {}
    this.IDS = []
    this._soundLayers = []
    let _soundEndedBound = this._onSoundEnded.bind(this)
    _.forIn(config, (layer) => {
      switch (layer.id) {
        case 'speaking':
          this.SOUND_LAYERS[layer.id] = new SpeakingLayer(layer)
          break;
        case 'music':
          this.SOUND_LAYERS[layer.id] = new MusicLayer(layer)
          break;
        case 'effects':
          this.SOUND_LAYERS[layer.id] = new EffectsLayer(layer)
          break;
      }
      //speaking, effects, music
      this.IDS.push(layer.id)
      if(this.SOUND_LAYERS[layer.id]){
        this._soundLayers.push(this.SOUND_LAYERS[layer.id])
      }
        //Emitter.on(`${layer.id}:sound:ended`, _soundEndedBound)
      Emitter.on(`gui:volume:${layer.id}`, (id, volume) => {
        this.layers[id].volume = volume
      })

      Emitter.on(`gui:info:${layer.id}`, (id) => {
        Emitter.emit(`gui:info:${layer.id}:result`, this.layers[id].getInfo())
      })

      Emitter.on(`gui:terminate:${layer.id}`, (id) => {
        this.layers[id].terminateCurrentSound()
      })

      Emitter.on(`gui:seek:${layer.id}`, (id) => {
        this.layers[id].increaseSeek()
      })
    })

    Emitter.on('state:init', this._onStateInit.bind(this))
    Emitter.on('state:changed', this._onStateChanged.bind(this))
    Emitter.on('metronome:quarter', this._onMetronome.bind(this))
    Emitter.on('beat:changed', this._onBeatChanged.bind(this))
    Emitter.on('map:update', this._onMapUpdate.bind(this))
    Emitter.on('map:entering', this._onMapEntering.bind(this))
    Emitter.on('map:leaving', this._onMapLeaving.bind(this))
    Emitter.on('phaser:update', this._onPhaserUpdate.bind(this))
    Emitter.on('volume:change', this._onVolumeChange.bind(this))

    this._c = 0
  }

  _onStateInit() {
    Emitter.emit('log:log', `State init ${State.state}`);
    switch (State.state) {
      case 'in':
        //this._onMapEntering()
        break;
      case 'out':
        //this._onMapLeaving()
        break;
    }
  }

  _onStateChanged(state) {
    this._state = state
  }

  _onMetronome(val, total) {
    //general updates
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.onMetronome()
    })
  }

  _onBeatChanged(beat) {
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.beat = beat[key]
    })
  }

  _onPhaserUpdate(val) {
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      //do nothing if at 0
      if (layer.scheduledVolume) {
        if (key === 'music' || key === 'effects') {
          let _v = Math.min(layer.scheduledVolume + (1. * val * VOLUME_MOD_INTENSITY), 1)
          layer.volume = _v
        }
        /*IMPORTANT
        ERROR ON IOS BECAUSE ITS PROBABLY A CONST
        */
        if (key === 'music' && State.state === 'in') {
          //_v = Math.min(_v, layer.scheduledVolume)
          /*//console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&");
          //console.log(key, (1. * val * VOLUME_MOD_INTENSITY), _v, layer.scheduledVolume);
          //console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&");*/
        }
      }
    })
  }

  /*
  Need to make sure if one sound stops there is one to play
  */
  _onSoundEnded(layerId) {
    return
    let _playings = []
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      _playings.push(layer.playing)
    })
    let _allNotPlaying = _playings.every((el) => {
      return !el
    });
    if (_allNotPlaying) {
      //not effects
      let _chosenId = this.IDS[Math.floor(Math.random() * this.IDS.length)]
      this.SOUND_LAYERS[_chosenId].play()
    }
  }

  _onMapEntering(activeLocation) {
    Emitter.emit('log:log', `${activeLocation.id} Map entering: `);
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.mapEntering(activeLocation)
    })
  }


  /*
  Transitional states in Leaving
  */
  _onMapLeaving() {
    Emitter.emit('log:log', ` Map leaving: `);
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.mapLeaving()
    })
  }

  /*
  this will reshuffle the playlist as the person moves around
  */
  _onMapUpdate(locations) {

    //** WAIT UNTIL LOCATION ENTERING
    Emitter.emit('log:log', `LayerManager mapUpdate. State: ${State.state}`);
    if (State.state !== 'in') {
      //return
    }
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.mapUpdate(locations)
    })

    /*
    Make volume louder when near
    */
    return
    let _closestLocation = this.SOUND_LAYERS['speaking'].closestLocation
    if (_closestLocation) {
      let _closestLocationNearFactor = _closestLocation.nearFactor || 0
      let _currentVolume = this.SOUND_LAYERS['speaking'].volume
      let _targetVolume = 0.2 * _closestLocationNearFactor + _currentVolume
      _targetVolume = Utils.clamp(_targetVolume, 0, 1)
      this.SOUND_LAYERS['speaking'].volume = _targetVolume
    }
    /*IMPORTANT
          ERROR ON IOS BECAUSE ITS PROBABLY A CONST
          */

  }

  _updateLocations(place) {
    //this.SOUND_LAYERS['music'].startLocation(places[0])
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.updateLocation(place)
    })
  }

  _onVolumeChange(volumes) {
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.scheduledVolume = volumes[key]
      layer.volume = volumes[key]
    })
  }

  update() {
    _.each(this._soundLayers, layer => {
      layer.update()
    })
  }

  //***DEAD
  _getProgress() {
      _.forIn(this.SOUND_LAYERS, (layer, key) => {
        let _p = layer.progress

        if (_p > 0.5 && !layer.preloading) {
          //layer.preloadNext()
        }
      })
    }
    //***DEAD

  get layers() {
    return this.SOUND_LAYERS
  }

  get layerSounds(){
    console.log(this.SOUND_LAYERS);
    console.log(this._soundLayers);
    return this._soundLayers.map(layer=>{
      console.log(layer);
      return layer.sound
    })
  }


  pause(){
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.pause()
    })
  }

  resume(){
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.resume()
    })
  }

  destroy(){
    _.forIn(this.SOUND_LAYERS, (layer, key) => {
      layer.destroy()
    })
  }

}
