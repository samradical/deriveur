import H from 'howler'
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


export default class HowlerSound {
  constructor(soundOptions, id) {
    this._id = id
    this.unique = Math.random().toString()
    this._soundOptions = _.clone(soundOptions)
      //this._sProxy = new SoundProxy(this._soundOptions, (prop, val) => { this.onPropertyChanged(prop, val) })
    this._volumeTweenObj = {
      volume: soundOptions.volume
    }
    this.endedSignal = new Signals()
    this.terminatedSignal = new Signals()
    this.playingSignal = new Signals()
    this.loadedSignal = new Signals()
    this._onLoadedBound = this._onLoaded.bind(this)
    this._onEndedBound = this._onEnded.bind(this)
    this._onFadeBound = this._onFade.bind(this)
    this._onPauseBound = this._onPause.bind(this)
    this._onPlayBound = this._onPlay.bind(this)

    this.sound = new H.Howl(soundOptions)
    this.sound.on('load', this._onLoadedBound)
    this.sound.on('pause', this._onPauseBound)
    this.sound.on('play', this._onPlayBound)
    this.sound.on('end', this._onEndedBound)
    this.sound.soundname = soundOptions.name
      //we will update this with the metronome
    this.timeCounter = 0

    if (!CONFIG.partialPlay || soundOptions.noPartialPlay) {
      soundOptions.nearFactor = null
    } else {
      this.sound.nearFactor = 1 - (soundOptions.nearFactor)
    }
    /*
    we invert because we want this value to be high when close,
    so it plays the entirety of clips when near location center
    */
    this.sound.dominant = soundOptions.dominant
    this.overlapTime = Math.random() * CONFIG.effectSpeakingOverlapMax
    this._easeVolume = EaseNumbers.addNew(soundOptions.volume, 0.4)
  }


  get playing() {
    if (!this.sound)
      return false
    return this.sound.playing()
  }

  get volume() {
    if (!this.sound)
      return 0
    return this.sound.volume()
  }

  set volume(v) {
    this._easeVolume.target = v
  }

  duration() {
    if (this.sound) {
      return this.sound.duration() || 0
    }
    return 0
  }

  fade(fromVol, toVol, dur) {
    if (this.sound) {
      this.sound.fade(fromVol, toVol, dur)
    }
  }

  play(dur = 500, volume = 1) {
    if (this.sound) {
      if (!this.sound.playing()) {
        this.sound.fade(0, this._easeVolume.value, dur)
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
    TweenLite.to(
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
      this.sound.volume(this._easeVolume.value)
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
    if (!this.sound) {
      return ""
    }
    return this.sound.soundname
  }

  get nearFactor() {
    return this.sound.nearFactor
  }

  get loaded() {
    return this.sound.isLoaded
  }

  get progress() {
    let _s = this.sound.seek()
    let _pos = (_s / this.sound.duration()) || 0
    return _pos
  }

  _onLoaded(value) {
    if (this.loadedSignal) {
      this.loadedSignal.dispatch(this)
    }
    if (CONFIG.partialPlayOnBackground) {
      if (this._id === 'speaking') {
        this._setPlaytime()
      }
    } else {
      this._setPlaytime()
    }

    Emitter.emit('log:log:light', `Sound ${this._id} ${this.sound.soundname} Loaded duration: ${this.sound.duration()}`);
    Emitter.emit('log:log:light', `Sound ${this._id} playtime: ${this.playtime} nearFactor: ${this.sound.nearFactor}`, 2);

    this._loaded = true
    this.sound.isLoaded = true

  }

  _setPlaytime() {
    //!!!!

    if (this.sound.nearFactor) {
      this.playtime = this._getPlaytimeFromNearFactor(
        this.sound.duration(),
        this.sound.nearFactor
      )
      if (CONFIG.entropyCut) {

        this.playtime = Utils.clamp(
          Math.random() * CONFIG.maxSpeakingTime,
          CONFIG.minSpeakingTime,
          CONFIG.maxSpeakingTime)
      }
      this.sound.playtime = this.playtime
    } else if (this.sound.playtime) {
      this.sound.playtime = Math.min(this.sound.playtime, this.sound.duration())
    }
  }

  _onPlay() {
    if (this.playingSignal) {
      this.playingSignal.dispatch(this)
    }
  }

  _onPause() {}

  _onFade(s) {

  }

  _onEnded() {
    //pass this in the terminatedSignal
    if (this.sound) {
      this.sound.hasFinished = true
      if (this.endedSignal) {
        this.endedSignal.dispatch(this)
      }
    }
  }

  pause() {
    this._isPaused = true
    if (this.sound) {
      this.sound.pause()
    }
  }

  _getPlaytimeFromNearFactor(duration, nearFactor) {
    if (nearFactor > NEAR_FACTOR_TOLERANCE_MAX) {
      return duration
    } else if (nearFactor < NEAR_FACTOR_TOLERANCE_MIN) {
      return Math.min(duration, NEAR_FACTOR_DURATION_MAPPING_MIN)
    }
    let _d = duration * nearFactor
    _d = Utils.clamp(_d, MIN_SPEAK_TIME, duration)
    return _d
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
    this.sound.off('load', this._onLoadedBound)
    this.sound.off('play', this._onPlayBound)
    this.sound.off('pause', this._onPauseBound)
    this.sound.off('fade', this._onFadeBound)
    this.sound.off('end', this._onEndedBound)
    this.sound.stop()
    this.sound.unload()
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

    console.log("HowlerSoundDestoyed", this.unique);
  }
}
