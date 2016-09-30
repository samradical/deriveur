//import Sono from '@stinkdigital/sono'
import Signals from 'signals'
import { CONFIG } from '../setup/config'
import Emitter from '../utils/DerivEmitter'
import EaseNumbers from '../utils/ease-numbers'
import Utils from '../utils/UTILS'
import SoundProxy from './SoundProxy'
import TweenLite from 'gsap';
import _ from 'lodash';
//how little a song should play, seconds
const NEAR_FACTOR_DURATION_MAPPING_MIN = 5
  //play the whole clip if near factor is above this
const NEAR_FACTOR_TOLERANCE_MAX = 0.8
  //play the NEAR_FACTOR_DURATION_MAPPING_MIN if below
const NEAR_FACTOR_TOLERANCE_MIN = 0.1

const MIN_SPEAK_TIME = 10


export default class SonoSound {
  constructor(soundOptions, id) {
    this._id = id
    this.unique = Math.random().toString()
    this._soundOptions = _.clone(soundOptions)
    if (this._soundOptions.autoplay) {
      this._soundOptions.autoPlay = true
        //this._sProxy = new SoundProxy(this._soundOptions, (prop, val) => { this.onPropertyChanged(prop, val) })
    }
    this._volumeTweenObj = {
      volume: soundOptions.volume
    }
    this._soundOptions.src = _.compact(this._soundOptions.src)
    console.log(this._soundOptions);
    this.endedSignal = new Signals()
    this.terminatedSignal = new Signals()
    this.playingSignal = new Signals()
    this.loadedSignal = new Signals()
    this._onLoadedBound = this._onLoaded.bind(this)
    this._onEndedBound = this._onEnded.bind(this)
    this._onFadeBound = this._onFade.bind(this)
    this._onPauseBound = this._onPause.bind(this)
    this._onPlayBound = this._onPlay.bind(this)
    this.sound = window.sono.createSound(this._soundOptions)
    this.sound.on('loaded', this._onLoadedBound)
    this.sound.on('pause', this._onPauseBound)
    this.sound.on('play', this._onPlayBound)
    this.sound.on('ended', this._onEndedBound)
    this._soundName = soundOptions.name
      //we will update this with the metronome
    this.timeCounter = 0
    this._easeVolume = EaseNumbers.addNew(soundOptions.volume, 0.4)

    if (this._soundOptions.autoplay) {
      this.play()
    }
  }

  get playing() {
    if (!this.sound)
      return false
    return this.sound.playing
  }

  get volume() {
    if (!this.sound)
      return 0
    return this.sound.volume
  }

  set volume(v) {
    this._easeVolume.target = v
  }

  duration() {
    if (this.sound) {
      return this.sound.duration || 0
    }
    return 0
  }

  fade(fromVol, toVol, dur) {
    if (this.sound) {
      this.ramp(dur, { volume: toVol })
    }
  }

  play(dur = 500, volume = 1) {
    /*console.log(">>>>>>>>>>>>>>>>>>>>");
    console.log(this.sound);
    console.log(this.sound.playing);
    console.log(this.hasFinished);*/
    if (this.sound) {
      if (!this.sound.playing && !this.hasFinished) {
        this.sound.volume = this._easeVolume.value
        this.sound.play()
      }
    }
  }

  ramp(duration, options, final) {
    //makes sure it is not interfered with
    if (this._rampingVolume && !final) {
      return
    }
    if (this._isPaused && options.volume) {
      this.play()
    }
    //makes sure it is not interfered with
    if (final) {}
    this._rampingVolume = true
      //console.log(`Sound ${this._id} ${this.sound.soundname} ramp: ${JSON.stringify(options)}`);
    this._volumeTweenObj.volume = this._easeVolume.value
    window.TweenLite.to(
      this._volumeTweenObj,
      duration, {
        volume: options.volume,
        overwrite: 1,
        onUpdate: () => {
          if (this._id === 'effects') {}
          this._easeVolume.target = this._volumeTweenObj.volume
            //if(this._id === 'speaking')

        },
        onComplete: () => {
          this._rampingVolume = false
          if (this.sound) {
            //console.log(`Sound ${this._id} ${this.sound.soundname} ramp complete`);
            //console.log(`${this._id}  ${this.sound.soundname}  ramped to ${options.volume}. Paused: ${options.pause} End: ${options.end}`);
            if (options.pause || options.volume === 0) {
              this.pause()
            }
            if (options.end) {
              this._terminate()
            }
          }
        }
      }
    )
  }

  update() {
    if (!this._rampingVolume && this.sound) {
      this.sound.volume = this._easeVolume.value
    }
  }

  get seek() {
    if (this.sound) {
      return this.sound.seek()
    }
    return 0
  }

  set seek(v) {
    if (this.sound) {
      this.sound.seek(v)
    }
  }

  stop() {
    this.sound.stop()
  }

  get soundname() {
    return this._soundName || ""
  }

  get nearFactor() {
    return this.sound.nearFactor
  }

  get loaded() {
    return this._loaded
  }

  get progress() {
    let _s = this.sound.seek()
    let _pos = (_s / this.sound.duration || 0)
    return _pos
  }

  _onLoaded(value) {
    if (this.loadedSignal) {
      this.loadedSignal.dispatch(this)
    }
    this._loaded = true
  }

  _onPlay() {
    if (this.playingSignal && !this._isPlaying) {
      this.playingSignal.dispatch(this)
    }
    this._isPlaying = true
  }

  _onPause() {}

  _onFade(s) {

  }

  _onEnded() {
    //pass this in the terminatedSignal
    if (this.sound) {
      this.hasFinished = true
      if (this.endedSignal) {
        this.endedSignal.dispatch(this)
      }
    }
  }

  pause() {
    this._isPaused = true
    if (this.sound) {
      this.sound.stop()
    }
  }

  _terminate() {
    //kill
    if (this.terminatedSignal) {
      this.terminatedSignal.dispatch(this)
    }
  }

  destroy() {
    EaseNumbers.remove(this._easeVolume)
      //this._sProxy.destroy()
    if (this.endedSignal) {
      this.endedSignal.dispose()
    }
    if (this.terminatedSignal) {
      this.terminatedSignal.dispose()
    }
    if (this.playingSignal) {
      this.playingSignal.dispose()
    }
    if (this.loadedSignal) {
      this.loadedSignal.dispose()
    }
    let _s = this._soundName
    this.sound.off('loaded', this._onLoadedBound)
    this.sound.off('play', this._onPlayBound)
    this.sound.off('pause', this._onPauseBound)
    this.sound.off('fade', this._onFadeBound)
    this.sound.off('ended', this._onEndedBound)
    this.sound.stop()
    this.sound.destroy()
    this.sound = null
    this._onLoadedBound = null
    this._onEndedBound = null
    this._onFadeBound = null
    this._onPauseBound = null
    this._onPlayBound = null
    this.endedSignal = null
    this.terminatedSignal = null
    this.playingSignal = null
    this.loadedSignal = null

    console.log("SonoSoundDestoyed", _s, this.unique);
  }
}
