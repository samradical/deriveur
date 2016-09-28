import H from 'howler'
import Signals from 'signals'
import _ from 'lodash'
import SoundProxy from './SoundProxy'
import TweenLite from 'gsap';

export default class Sound {
  constructor(options = {}) {
    this._options = options
    this._sProxy = new SoundProxy(this._options, (prop, val) => { this.onPropertyChanged(prop, val) })
    this.endedSignal = new Signals()
    this.playingSignal = new Signals()
    this.loadedSignal = new Signals()
  }

  onPropertyChanged(prop, val) {
    if (this._s[prop]) {
      this._s[prop](val)
    }
  }

  newSound(paths) {
    this._s = new H.Howl(_.merge({
      urls: paths,
      autoplay: true,
      loop: false
    }, this._options));

    this._s.on('load', this._onLoaded)
    this._pBOund = this._onPlay.bind(this)
    this._s.on('play', this._pBOund)
    this._s.on('end', this._onEnded)

    this._isPaused = false
  }

  rampUp(duration, options) {
    this.play()
    TweenLite.to(this._sProxy.p, duration,
      _.merge(options, {
        overwrite: 1,
        onComplete: () => {

        }
      })
    )
  }

  play() {
    if (this._isPaused) {
      this._isPaused = false
      this._s.play()
    }
  }

  _onLoaded() {
    this.loadedSignal.dispatch()
  }

  _onPlay() {
    if (!this.isPlaying) {
      this.playingSignal.dispatch()
      this.isPlaying = true
    }
  }

  _onEnded() {
    this.endedSignal.dispatch()
  }

  pause() {
    this._isPaused = true
    this._s.pause()
  }

  rampDown(duration, options) {
    TweenLite.to(this._sProxy.p, duration,
      _.merge(options, {
        overwrite: 1,
        onComplete: () => {
          if (options.pause || this._options === 0) {
            this.pause()
          }
        }
      })
    )
  }

  destroy() {
    console.log('`', 'Sound destroyed');
    this._s.stop()
    this._s.unload()
    this._s.off('load', this._onLoaded)
    this._s.off('play', this._pBOund)
    this._s.off('end', this._onEnded)
    this._s = null
  }
}
