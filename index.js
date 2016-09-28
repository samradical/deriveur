import Map from './controls/Map'
import State from './controls/State'
import LayerManager from './controls/LayerManager'
import AssetDataParser from './utils/AssetDataParser'
import Emitter from './utils/DerivEmitter'
//import PhaserLoader from './utils/PhaserLoader'
import EaseNumbers from './utils/ease-numbers'
import _ from 'lodash'

import {
  CONFIG,
  SOUND_LAYERS_DATA,
  ASSET_URL,
  MAP_CONFIG,
  LOCATIONS
} from './setup/config'

export { LOCATIONS }

export function parseFileStructure(json) {

}

export default class Deriveur {
  constructor(layerData, locations, config = {}) {
    this.config = config
    this.locations = locations
    _.forIn(config, (val, key) => {
        CONFIG[key] = val
      })
    this._updateBound = this._update.bind(this)
    this.createSoundLayers(layerData)
    this.createMap()
  }

  createSoundLayers(layerData) {
    this.layers = new LayerManager(layerData)
  }

  createMap() {
    this.map = new Map(this.locations, CONFIG.map)
    this.map.mapLoadedSignal.addOnce(() => {
      //start everything
      State.init(this.locations)
      this._updateBound()
      if (this.config.noGeo) {
        this.map.updatePosition({ coords: this.locations[0] })
      }
    })
  }

  _update() {
    this.layers.update()
    EaseNumbers.update()
    window.requestAnimationFrame(this._updateBound);
  }

  //layer:event
  on(eventName, callback){
    Emitter.on(`ext:${eventName}`, callback)
  }

  pause(){
    Emitter.emit(`controls:pause`)
    this.layers.pause()
  }

  resume(){
    Emitter.emit(`controls:resume`)
    this.layers.resume()
  }

  destroy(){
    Emitter.emit(`controls:destroy`)
    this.layers.destroy()
  }

}
