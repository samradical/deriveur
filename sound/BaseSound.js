import HowlerSound from './HowlerSound'
import SonoSound from './SonoSound'
import Signals from 'signals'
import _ from 'lodash'
import { CONFIG } from '../setup/config'
import Emitter from '../utils/DerivEmitter'
import TweenLite from 'gsap';

export default class BaseSound {
  constructor(options = {}, id = '') {
    this._options = options
    this._id = id
    this.endingSignal = new Signals()
    this.endedSignal = new Signals()
    this.terminatedSignal = new Signals()
    this.playingSignal = new Signals()
    this.loadedSignal = new Signals()
    this._onTerminatedBound = this._onTerminated.bind(this)
    this._onLoadedBound = this._onLoaded.bind(this)
    this._onEndedBound = this._onEnded.bind(this)
    this._onPauseBound = this._onPause.bind(this)
    this._onPlayBound = this._onPlay.bind(this)

    Emitter.on('volume:change', volumes => {
      if (this._id) {
        this.scheduledVolume = volumes[this._id]
        if (this._id === 'music') {
          /*//console.log("+++++++++++++++++++++++++++++++++");
          //console.log(this.scheduledVolume);
          //console.log("+++++++++++++++++++++++++++++++++");*/
        }
        if (this.sound) {
          /*//console.log(1,"::::::::::::::::::::::::");
          //console.log(volumes);
          //console.log(this._id);
          //console.log(this.sound.volume);
          //console.log(this.scheduledVolume);*/
          this.sound.volume = this.scheduledVolume
        }
        ////console.log(this._id, this.scheduledVolume);
      }
    })

    this.sound = null
  }

  newSound(playlistObject, name = '', soundOptions = {}, force = false) {
    if (force) {
      if (this.sound) {

        this._fadeAndDestroy(this.sound, 0, CONFIG.baseSoundFadeOut - 0.2)

        clearTimeout(this._newSoundTO)
        this._newSoundTO = setTimeout(() => {

          this._createNewSound(playlistObject, name, soundOptions)

        }, (CONFIG.baseSoundFadeOut + Math.random() * 5) * 1000)

      } else {
        this._createNewSound(playlistObject, name, soundOptions)
      }
    } else {
      this._createNewSound(playlistObject, name, soundOptions)
    }
  }

  _createNewSound(playlistObject, name, soundOptions) {
    if(this._loadingSound){
      return
    }
    let _o = _.merge({
        name: name,
        volume: this.scheduledVolume,
        loop: false
      },
      playlistObject,
      this._options.howler,
      soundOptions
    )
    this.terminate()
    setTimeout(()=>{
      this.sound = new SonoSound(_o, this._id)
      //this.sound = new HowlerSound(_o, this._id)
      this.sound.terminatedSignal.addOnce(this._onTerminatedBound)
      this.sound.endedSignal.addOnce(this._onEndedBound)
      this.sound.playingSignal.addOnce(this._onPlayBound)
      this.sound.loadedSignal.addOnce(this._onLoadedBound)
      console.log("Loading new Sound:");
    }, 50)
    this._loadingSound = true
  }

  onMetronome() {
    if (!this.sound) {
      return
    }

    if (this.sound.markedToDestroy) {
      return
    }

    if (CONFIG.partialPlay) {
      let _previousSeekTime = this.sound.previousTimeCounter || 0
      let _s = this.sound.seek
      this.sound.timeCounter += (_s - _previousSeekTime)
      this.sound.timeCounter = isNaN(this.sound) ? _s : this.sound.timeCounter
        /*
        we will update it like this because if this sound starts again,
        we cant rely on seek() alone
        */
        //destroy if

      if (this.sound.playtime) {
        this._checkIsEnding(this.sound.playtime)
        if (this.sound.timeCounter > this.sound.playtime) {
          Emitter.emit('log:log', `Sound ${this._id} ${this.sound.soundname} past playtime, destroy!`, 3, 20);
          this._fadeAndDestroy(this.sound,
            0,
            this._options.fadeDownBeforeEnding)
          return
        }
      } else {}
      //this._checkIsEnding()
      this.sound.previousTimeCounter = _s
    }
  }

  /*
  Using the config overlap
  */
  _checkIsEnding(soundEndTime) {
    soundEndTime = soundEndTime || this.sound.duration()
    if (!this.sound.isEnding) {
      if (this._id === 'speaking') {
        ////console.log(this.sound.timeCounter, (soundEndTime - this.sound.overlapTime));
      }
      if (this.sound.timeCounter > (soundEndTime - this.sound.overlapTime)) {
        this.sound.isEnding = true
        this.endingSignal.dispatch(this)
      }
    }
  }

  //**************
  //GET SET
  //**************

  get playing() {
    if (this.sound) {
      return this.sound.playing
    }
    return false
  }

  set volume(vol) {
    if (this.sound) {
      this.sound.volume = vol
    }
  }

  get volume() {
    if (this.sound) {
      return this.sound.volume || 0
    }
    return 0
  }

  get progress() {
    if (!this.sound) {
      return 0
    }
    let _s = this.sound.seek
    let _pos = (_s / this.sound.duration()) || 0
    return _pos
  }

  get duration() {
    if (this.sound) {
      return this.sound.duration() || 0
    }
    return 0
  }

  get seek() {
    return this.sound.seek
  }

  get playtime() {
    return this.sound.playtime
  }

  set seek(s) {
    this.sound.seek = s
  }

  get soundname() {
    if (this.sound) {
      return this.sound.soundname
    }
    return ''
  }

  get nearFactor() {
    return this.sound.nearFactor
  }

  get loaded() {
    return this.sound.loaded
  }

  get sound() {
    return this._sound
  }

  set sound(s) {
    this._sound = s
  }

  set scheduledVolume(v) {
    this._scheduledVolume = v
  }

  get scheduledVolume() {
    return this._scheduledVolume || 0
  }

  get activeIndex() {
    return this.soundIndex
  }

  _getNextSoundIndex() {
    return (this.soundIndex + 1) % NUM_SOUNDS
  }


  //************
  //SOUND CONTROL
  //************

  fadeAndDestroy(sound, vol = 0, dur = 2) {
    sound = sound || this.sound
    this._fadeAndDestroy(sound, vol, dur)
  }


  play(savedData, dur = 500) {
    if (this.sound) {
      let _vol = this._scheduledVolume
        //console.log(">>>>>>>>>>>>>>>>>>>>>>");
        //console.log("play()", this._id, 'at ', _vol);
        //console.log(">>>>>>>>>>>>>>>>>>>>>>");
      this.sound.play()
      this.sound.fade(0, _vol, dur)

      this.sound.savedData = savedData
      if (savedData) {
        this.sound.seek = savedData.progress
        if (CONFIG.partialPlay) {
          this.sound.playtime += savedData.progress
        }
        Emitter.emit('log:log:light', `seeking to ${savedData.progress}`, 2, 12);
      }
    } else {
      Emitter.emit('log:error', `No sound on play ${this._id}`);
    }
  }

  stop() {
    this.sound.stop()
  }

  update() {
    if (this.sound) {
      this.sound.update()
    }
  }

  pause() {
    this._isPaused = true
    if (this.sound) {
      this.sound.pause()
      this._saveTime = this.sound.seek
    }
  }

  resume() {
    if (this.sound) {
      this._saveTime = this._saveTime || 0
      this.sound.play(this._saveTime)
    }
  }

  ramp(duration, options, final) {
    if (this.sound) {
      this.sound.ramp(duration, options, final)
    }
  }

  ///********************
  //HANDLERS
  ///********************

  get soundLoading(){
    return this._loadingSound
  }

  _onLoaded(index) {
    this._loadingSound = false
    this.loadedSignal.dispatch()
  }

  _onPlay(index) {
    Emitter.emit('log:log', `Sound ${this._id} at ${index} ${this.sound.soundname} Playing`);
    Emitter.emit(`ext:${this._id}:playing`)
    this.playingSignal.dispatch()
  }

  _onPause(index) {}

  _onEnded(index, soundName) {
    //pass this in the terminatedSignal
    this.sound.hasFinished = true
    this.terminate()
  }

  _onTerminated(index, soundName) {
    this.terminate()
  }

  //*************************
  // PRIVATE
  //*************************

  /*
  !!!!!!!!!!!!
  cut speed?
  */
  _fadeAndDestroy(sound, toVolume = 0, dur = 2) {
    if (sound.markedToDestroy) {
      return
    }
    sound.markedToDestroy = true
      //make sure it ramps
    sound.ramp(dur, { volume: 0, end: true }, true)
  }

  destroy() {
    this.terminate()
  }

  terminate() {
    //kill
    /*
    No active sound?
    this.sound
    */
    if (!this.sound) {
      Emitter.emit('log:error', `terminate() no active Sound`);
      return
    }
    let _endObj = {
      soundName: this.sound.soundname,
      soundIndex: this.sound.soundIndex,
      hasFinished: !!this.sound.hasFinished,
      progress: (typeof this.seek === 'Howl') ? 0 : this.seek,
      duration: (typeof this.duration === 'Howl') ? 0 : this.duration
    }

    Emitter.emit('log:log', `Sound ${this._id} ${this.sound.soundname} at ${this.soundIndex} terminate()`);
    console.log(this.sound.unique);
    this.sound['markedToDestroy'] = true
    if (this.sound.terminatedSignal) {
      this.sound.terminatedSignal.remove(this._onTerminatedBound)
    }
    if (this.sound.endedSignal) {
      this.sound.endedSignal.remove(this._onEndedBound)
    }
    if (this.sound.playingSignal) {
      this.sound.playingSignal.remove(this._onPlayBound)
    }
    if (this.sound.loadedSignal) {
      this.sound.loadedSignal.remove(this._onLoadedBound)
    }
    this._loadingSound = false
    console.log(this._sound.unique);
    this._sound.destroy()
    this._sound = null
      //alert
    if (this.endedSignal) {
      try {
        this.endedSignal.dispatch(_endObj)
      } catch (err) {
        //console.log(err);
      }
    }
  }
}
