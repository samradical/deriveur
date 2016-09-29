import AssetLoader from '../utils/AssetLoader'
import Utils from '../utils/UTILS'
import Emitter from '../utils/DerivEmitter'
import State from '../controls/State'
import EffectSound from './EffectSound'
import _ from 'lodash'
import { PERSONAL_RADIUS } from '../setup/config' //meters
import { CONFIG } from '../setup/config'
import BaseLayer from './BaseLayer'

export default class EffectsLayer extends BaseLayer {
  constructor(data) {
    super(data)

    //Emitter.on('layer:speaking:ended', this._onSpeakingEnded.bind(this))
    //Emitter.on('layer:speaking:ending', this._onSpeakingEnding.bind(this))
    Emitter.on('layer:effects:playdominent', this._playDominant.bind(this))
    Emitter.on('layer:effects:playambient', this._playAmbient.bind(this))

    Emitter.on('layer:effects:dominant:ended', () => {
      this._dominantEffectActive = false
      Emitter.emit('volumescheduler:reset')
    })

    this._sound.terminate()
    this._sound = new EffectSound()
  }

  mapEntering(location) {
    this._setSoundSources()
    this._sound.playAmbient()
  }

  mapUpdate(locations, shuffle = true) {
    super.mapUpdate(locations, shuffle)
    this._setSoundSources()
  }

  _setSoundSources() {
    let _srcLocations = this._makeSrcArrayFromLocationUrls()
    Utils.shuffle(_srcLocations)
    let _filteredDominant = this._filterSourcesByTerm(_srcLocations, 'interruptions')
    let _filteredAmbient = this._filterSourcesByTerm(_srcLocations, 'play_along')
    this._sound.dominantSources = _filteredDominant
    this._sound.ambientSources = _filteredAmbient
  }

  onMetronome() {
    if ((this._beatCounter % this._beat) === 0) {
      this._sound.onBeat()
    }
    super.onMetronome()
  }

  _triggerInterlude(roll) {
    if (this._dominantEffectActive) {
      return
    }
    this._dominantEffectActive = true
    if (roll > 0.9) {
      this._playDominant()
    } else {}
  }

  _playAmbient() {
    this._sound.rampUpAmbient()
  }

  _playDominant() {
    this._sound.playDominant()
  }

  get dominantSound() {
    return this._getSoundAt(1)
  }

  get ambientSound() {
    return this._getSoundAt(0)
  }

  get scheduledVolume() {
    return this._scheduledVolume || this._sound.volume
  }

  set scheduledVolume(v) {
    this._scheduledVolume = v
    this._sound.scheduledVolume = v
    this.dominantSound.scheduledVolume = this._scheduledVolume
    this.ambientSound.scheduledVolume = this._scheduledVolume
  }

  get sound() {
    return this._sound
  }

  _getSoundAt(index) {
    return this._sound.sounds[index]
  }

  _filterSourcesByTerm(sources, term) {
    return sources.filter(obj => {
      let _src
      if (obj.src.length) {
        if (obj.src[0]) {
          _src = obj.src[0]
        } else {
          _src = obj.src[1]
        }
        return _src.indexOf(term) >= 0
      }
      return false
    })
  }
}
