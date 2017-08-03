import AssetLoader from '../utils/AssetLoader'
import Utils from '../utils/UTILS'
import Emitter from '../utils/DerivEmitter'
import Sound from './Sound'
import _ from 'lodash'
import { PERSONAL_RADIUS } from '../setup/config' //meters
import { CONFIG } from '../setup/config'

const PLAYLIST_PLACES_MAX = 3
const PLAYLIST_LENGTH = 60
const MIN_NEAR_FACTOR = 0.02
const MAX_NEAR_FACTOR = 0.99

const RAMP_DOWN_DUR = 8

export default class Layer {
  constructor(data) {
    this._data = data
    this._id = this._data.id

    this._locationsUrls = this._cacheLocationsUrls()
      //clone
      //this._options = _.clone(this._data.options)
      //delete this._data.options
    this._beat = 0
    this._beatCounter = 0
    this._sound = new Sound(this._data.options.sound, this._id)
    this._sound.endedSignal.add(endObj => {

      let { soundName, soundIndex, hasFinished, progress } = endObj
      switch (this._id) {
        case 'effects':
          Emitter.emit('log:log', `${this._data.id} endedSignal()`, 0, 16);
          Emitter.emit('log:log', `soundName, soundIndex, hasFinished, progress ${soundName} ${soundIndex} ${hasFinished} ${progress}`, 1, 13);
          Emitter.emit(`${this._id}:sound:terminated`, soundName)
          break
        case 'speaking':
          if (hasFinished) {
            Emitter.emit(`${this._id}:sound:ended`, this._id, soundName)
            this._heardSourcesNames.push(soundName)
            delete this._playedSources[soundName]
          } else {
            this._playedSources[soundName] = this._playedSources[soundName] || {}
            this._playedSources[soundName].hasFinished = hasFinished
            this._playedSources[soundName].progress = progress
          }
          this._loadNext()
          break
        case 'music':
          this._loadNext()
          break
      }

      /*if (hasFinished) {
        Emitter.emit(`${this._id}:sound:ended`, this._id, soundName)
        if (this._id === 'speaking') {}
      } else {

        console.log(this._playedSources);
        Emitter.emit('log:log', `---------------`, 0, 13);
      }
      //reset the beats
      this._beatCounter = 0
        //or play

*/
      Emitter.emit(`${this._id}:sound:played`)
    })


    this._sound.loadedSignal.add((soundId) => {
      this.preloadNext()
    })
    console.log(this._data);
    this._playlist = []
    this._playedSources = {}
      //added to when sound ended
    this._heardSourcesNames = []
      //every locations every update
    this._updatedLocations = []
    this._cc = true

    this._addListeners()
  }

  _addListeners() {
    switch (this._id) {
      case 'effects':
        Emitter.on(`speaking:sound:played`, () => {
          let _r = Math.random()
          this._effectInterlude = 3
          let _playTime = Math.random() * CONFIG.maxInterludeTime + CONFIG.minInterludeTime
          let _timeout = Math.random() * 0.7 + 0.3
          let _overlap = _timeout * ( Math.random())
           _overlap = 0
          Emitter.emit(`sound:set:interlude`, this._effectInterlude)
          this._beatCounter = 1
          if (this._sound.activeSound) {
            this._sound.fadeAndDestroy(
              this._sound.activeSound,
              0,
              _timeout)
          }
          _r = 1
          if (_r < 0.7) {
            console.log("++++++++++++++++++++++++++");
            console.log("Playing dominant effect");
            console.log('Sound paying: ', !!this._sound.playing);
            console.log('Sound active: ', this._sound.activeSound);
            console.log("++++++++++++++++++++++++++");

            setTimeout(() => {

              console.log("Effect destroyed?");
              console.log(this._sound.sounds);
              //let _locationId = this._updatedLocations[0]
              let _p = this._locationsUrls[this._closestLocation.id].slice(0)
                .map(srcArray => {
                  return { src: srcArray }
                })
              Utils.shuffle(_p)
              _p = this._filterSourcesByTerm(_p, 'dominant')
              console.log(_p);

              this._loadNext({
                  autoplay: true,
                  dominant: true,
                  volume: 0.8,
                  playtime: _playTime
                }, _p)
                /*clearInterval(this._effectInterval)
                this._effectInterval = setInterval(() => {
                  console.log("7777&&&&&777777", this._sound.loaded);
                  if (this._sound.loaded) {
                    clearInterval(this._effectInterval)
                    setTimeout(() => {
                      this._effectInterlude = 0
                      Emitter.emit(`sound:set:interlude`, this._effectInterlude)
                      Emitter.emit(`volumescheduler:effects:down`)
                      this.ramp(0.5, { volume: 0., end: true }, true)
                    }, Math.random() * 5000 + 4000)
                  }
                }, 200)*/
                //Emitter.emit(`effects:sound:interlude`)
              Emitter.emit(`volumescheduler:effects:up`)

            }, (_timeout-_overlap) * 1000 + 100)
          } else {
            console.log("---------------++++++++++++");
            console.log("ramping up music");
            console.log(`how long ${ (_timeout-_overlap) * 1000 + 100}`);
            console.log("---------------++++++++++++");
            Emitter.emit(`volumescheduler:music:up`)

            setTimeout(() => {
              this._effectInterlude = 0
              Emitter.emit(`volumescheduler:music:down`)
            }, (_timeout-_overlap) * 1000 + 100)
          }
        })
        break;
      case 'speaking':
        /*Emitter.on(`effects:sound:interlude`, () => {
          this._effectInterludeTo = setTimeout(() => {
            Emitter.emit(`volumescheduler:effects:down`)
            this._effectInterlude = 0
          }, 8000)
        })*/
        Emitter.on(`sound:set:interlude`, (interlude) => {
          this._effectInterlude = interlude
          console.log("??????????????????????????>>>");
          console.log(this._effectInterlude);
          console.log("??????????????????????????>>>");
        })
        Emitter.on(`effects:sound:dominant`, (soundName) => {
          console.log("===================================");
          console.log('EFFECT PLAYED ' + soundName);
          console.log("===================================");
          clearInterval(this._effectInterludeTo)
          this._effectInterlude = 0
          Emitter.emit(`volumescheduler:effects:down`)
        })
        break;
      case 'music':
        break;
    }
  }


  //****** DISUSED
  updateLocation(location, shuffle = true) {
    return
    console.log("Layer location updated:");
    console.log('\t', location);
    if (location) {
      let _lRef = this._getLocationSourcesById(location.id)
      console.log(this._locationsUrls);
      console.log(_lRef);
      this._locationUrls = _lRef.slice(0)
      if (shuffle) {
        Utils.shuffle(this._locationUrls)
      }
      this._fileIndex = -1
      this._loadNext()
    }
  }

  /*
  If there is no sound playing and a new beat comes,
  play the next sound
  SAYS WHEN TO PLAY NEXT LOADED AUDIO
  */
  onMetronome() {

    switch (this._id) {
      case 'speaking':
        if (!this._sound.playing && this._playlist.length && !this._isPaused) {
          let _roll = Math.random()
          if (this._closestLocation) {
            let _f = this._closestLocation.nearFactor || 0
              /*console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
              console.log(this._effectInterlude);
              console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");*/
            _f += (this._effectInterlude || 0)
            if (_roll > _f ) {
              Emitter.emit('log:log', `Layer ${this._id} Playing:  Had to get ${_f}, got ${_roll}`, 2);
              this.play()
            } else {
              Emitter.emit('log:log', `${this._id} Failed on roll. Had to get ${_f}, got ${_roll}`, 2);
            }
          }
        } else if (!this._playlist.length) {
          Emitter.emit('log:error', `No playlist on ${this._id}`);
        }
        break
      case 'effects':
      case 'music':
        if (!this._sound.playing &&
          (this._beatCounter % this._beat) === 0) {
          this._buildPlaylist()
          if (this._id === 'effects') {

          }
          if (this._id === 'music') {
            this._loadNext({
              autoplay: true,
            })
          }
        }
        break
    }
    this._sound.onMetronome()
    this._beatCounter++
  }

  mapEntering(location) {
    /*//unshuffled
    let _sources = this._getLocationSourcesById(location.id)

    //these are objects
    let _removedHeard =  this._filterHeardSources(_sources)

    this._playlist.unshift(_removedHeard.shift())
    let _name = this._getFileNameFromSource(this._playlist[0])
    Emitter.emit('log:log', `Map Entering ${this._id}: Going to play ${_name} next`, 3, 'lightBlue');
    _removedHeard.length = 0
    _removedHeard = null
    //***** fade out the previous interview
*/
    this._stateOut = false
    if (this._id === 'speaking') {
      Emitter.emit('log:log', `MapEntering: ramping down speaking`, 2, 12);
      this.ramp(RAMP_DOWN_DUR, { volume: 0, end: true }, true)
    }
    //beause lets just make sure there is always stuff playing
    this._loadNext({ autoplay: true })
  }

  mapLeaving(shuffle = true) {
    this._stateOut = true
    let _transitionSources = this._getTransitionSourceUrls()
    if (shuffle) {
      Utils.shuffle(_transitionSources)
    }
    //remove the heard ones
    let _removedHeard = this._filterHeardSources(_transitionSources)
    this._playlist.length = 0
    while (_removedHeard.length) {
      let _obj = {
        src: _removedHeard.shift()
      }
      this._playlist.push(_obj)
    }

    //***** fade out the previous interview
    if (this._id === 'speaking') {
      Emitter.emit('log:log', `MapLeaving: ramping down speaking`, 2, 12);
      this.ramp(RAMP_DOWN_DUR, { volume: 0, end: true }, true)
    }

    this._loadNext()
  }

  mapUpdate(locations, shuffle = true) {
    console.log(`MapUpdate ${this._id}`);
    this._buildPlaylist(locations, shuffle)
  }

  ///***************
  //GUI
  ///***************

  getInfo() {
    let _r = []
    console.log(this._sound.sounds);
    _.each(this._sound.sounds, sound => {
      //howler sound
      if (sound && !sound.markedToDestroy) {
        _r.push('--------------')
        _r.push(`activeIndex: ${this._sound.activeIndex}`)
        _r.push(`nearFactor: ${sound.nearFactor}`)
        _r.push(`soundname: ${sound.soundname}`)
        _r.push(`playing: ${sound.playing}`)
        _r.push(`progress: ${sound.seek}`)
        _r.push(`scheduledVolume: ${this.scheduledVolume}`)
        _r.push(`volume: ${sound.volume}`)
        _r.push('--------------')
      }
    })
    return _r
  }

  terminateCurrentSound() {
    Emitter.emit('log:log', `${this._id} terminateCurrentSound()`, 2, 13);
    this._sound.terminate()
  }

  increaseSeek(v = 1) {
    let _ct = this._sound.seek
    let _t = _ct + v
    console.log(_t, this._sound.duration);
    if (_t < this._sound.duration) {
      this._sound.seek = _t
    }
  }


  _buildPlaylist(locations, shuffle = true) {
    //dupe
    /*
    Duplicate
    Get a copy of the sources
    Shuffle
    */
    locations = locations || this._updatedLocations
    let _locations = locations.slice(0)
    this._updatedLocations = _locations
    let _currentlyPlaying = this._playlist.shift()
    this._closestLocation = locations[0]
      //Emitter.emit('log:log', `${this._id}`);

    let _totalSourcesLength = 0
    if (this._id === 'speaking') {
      //console.log(_locations);
    }
    _.each(_locations, location => {
        location.sourcesLength = 0
          //how close you are to center of the location
        location.nearFactor = this._getNearFactor(
          location.distance,
          location.radius
        )
        if (this._id === 'speaking') {
          //console.log(location.nearFactor, "----------", location.distance);
        }
        location.sources = this._getLocationSourcesById(location.id)
        if (shuffle) {
          Utils.shuffle(location.sources)
        }
        location.sourcesLength = location.sources.length
        _totalSourcesLength += location.sourcesLength
      })
      /*
      Cut the sources into a playlist based on the roll factor
      */
    this._playlist.length = 0
    let _locationIndex = 0
    let _totalLocations = _locations.length
    let _failedTries = 0
    while (this._playlist.length < PLAYLIST_LENGTH &&
      //we need to break out somehow
      _failedTries < _totalLocations) {

      let _l = _locations[_locationIndex]
      let _r = Math.random()
        //roll to see if it should use the item
      if (_r > _l.nearFactor) {
        let _sources = _l.sources.shift()
        if (_sources) {
          //!!!
          let _s = {
            src: _sources,
            nearFactor: _l.nearFactor
          }
          this._playlist.push(_s)
        } else {
          _locationIndex = (_locationIndex + 1) % _totalLocations
          _failedTries++
        }
      } else {
        _locationIndex = (_locationIndex + 1) % _totalLocations
      }
    }

    //remove the heard ones
    this._playlist = this._filterHeardSources(this._playlist)

    if (this._id === 'effects' && !this._stateOut) {
      this._playlist = this._filterSourcesByTerm(this._playlist, 'ambient')
    }

    console.log(this._playlist);
    console.log(`MapUpdate ${this._id}: playlist.length: ${this._playlist.length}`);
    //put the current one on top
    if (_currentlyPlaying) {
      this._playlist.unshift(_currentlyPlaying)
    } else {
      //its the first time on the app
      //this._loadNext()
    }
  }

  get id() {
    return this._id
  }

  get playing() {
    return this._sound.playing
  }

  get volume() {
    return this._sound.volume
  }

  get scheduledVolume() {
    return this._scheduledVolume || this._sound.volume
  }

  set scheduledVolume(v) {
    this._scheduledVolume = v
    this._sound.scheduledVolume = this._scheduledVolume
  }

  set beat(val) {
    this._beat = val
  }

  get closestLocation() {
    return this._closestLocation
  }

  /*
  We get the obj that will have the progress saved
  */
  play() {
    let _name = this._sound.soundname
    let _savedData = this._playedSources[_name]
    console.log(`Layer: play() ${this._id}`);
    console.log(_savedData);
    if(this._isPaused)  return
    this._sound.play(_savedData)
  }

  pause() {
    this._isPaused = true
    this._sound.pause()
  }

  resume(){
    this._isPaused = false
    this._sound.play()
  }

  /*rampDown(duration = 1, options = { volume: 0, pause: true }) {
    this._sound.rampDown(duration, options)
  }

  rampUp(duration = 1, options = { volume: 1 }) {
    this._sound.rampUp(duration, options)
  }*/

  ramp(duration = 1, options = {}, final = false) {
    this._sound.ramp(duration, options, final)
  }

  /*
  TAKE THE IT OFF THE PLAYLIST
  QUEUE IT UP FOR NEXT SOUND WHEN METRO CALLS PLAY
  */
  _loadNext(soundOptions, sources) {
    //increase file index
    //this._changeFileIndex(1)
    //new sound at new index, remove from playlist
    let _source
    if (sources) {
      _source = sources.shift()
    } else {
      _source = this._playlist.shift()
    }
    if (_source) {
      let _name = this._getFileNameFromSource(_source)
      soundOptions = soundOptions || _source.soundOptions
      console.log("----------");
      console.log(_source);
      console.log(_source.soundOptions);
      console.log("----------");
      //get the near factor
      this._sound.loadSound(_source, _name, soundOptions)
        //allow the manager to preload the next
      this._preloading = false
        //destroy current the preloader
      if (this._preloader) {
        this._preloader.destroy()
        this._preloader = null
      }
    } else {
      Emitter.emit('log:error', `_loadNext fail ${this._id} no source`)
    }
  }

  get progress() {
    return this._sound.progress
  }

  /*
  Preload the next urls in the list
  */
  preloadNext() {
    if (!this._preloading) {
      this._preloading = true
        //do not shift it out
      let _nextSource = this._playlist[0]
      AssetLoader.load(_nextSource)
        .then(loader => {
          this._preloader = loader
        }).finally()
    }
  }

  update() {
    this._sound.update()
  }

  getRandomDataKey() {
    let _r = Math.floor(Math.random() * this._dataKeys.length)
    return this._dataKeys[_r]
  }

  /*
  We will put thing in the OBJ
  */
  _createPlaylistObjectsFromSourceUrls(sources = []) {
    return sources.map(pair => {
      if (_.isArray(pair)) {
        return { src: pair }
      }
      return pair
    })
  }

  /*
  Gets the already parsed location urls by location id
  */
  _getLocationSourcesById(locationId) {
    let _urls = undefined
    let _urlRef = this._locationsUrls[locationId] || this._locationsUrls['misc']
    _urlRef = _urlRef || []
    while (!_urlRef.length) {
      let _i = Math.floor(Math.random() * this._data.locations.length)
      let _id = this._data.locations[_i].id
      _urlRef = this._locationsUrls[_id]
    }
    _urls = _urlRef.slice(0)
    return _urls
  }

  /*
  Get location by id
  */

  _getLocationById(locationId) {
    return this._data.locations.filter(location => {
      console.log(locationId, location.id);
      return location.id === locationId
    })[0]
  }

  /*
  All the formated urls of transitions
  */
  _getTransitionSourceUrls() {
    return this._extractUrls(this._data.locations.filter(location => {
        return location.id === 'transitions'
      })
      .map(sources => {
        return sources.files
      })[0])
  }

  _filterSourcesByTerm(sources, term) {
    return sources.filter(obj => {
      return obj.src[0].indexOf(term) >= 0
    })
  }

  /*
  remove the ones in the _heardSourcesNames
  will reset _heardSourcesNames if full
  */
  _filterHeardSources(sources = []) {
    let _filtered = sources.filter(source => {
        //obj or array
        let _src = source.src || source
        let _name = this._getFileNameFromSource(_src)
        let _val = !(this._heardSourcesNames.indexOf(_name) > -1)
        if (!_val) {
          //console.log(`${_name} has been listened to: remove`);
        }
        return _val
      })
      //reset
    if (!_filtered.length) {
      console.log(`Heard all the playlist for ${this._id}. Reseting.`);
      this._heardSourcesNames.length = 0
      return sources
    }
    return _filtered
  }

  _getNextFileIndex(val = 1) {
    let _v = this._fileIndex
    _v += val
    if (_v > this._locationsUrls.length - 1) {
      // console.error(`Out of audio on ${this._data.id}, restarting`);
      _v = 0
    }
    return _v
  }

  /*
  make an id from the source url pair
  */
  _getFileNameFromSource(sourcePair) {
    if (!sourcePair) {
      return ''
    }
    //account for obj and arrays
    sourcePair = sourcePair.src || sourcePair
    let _name = sourcePair[0].split('/')
    _name = _name[_name.length - 2] + _name[_name.length - 1]
    return _name
  }

  /*
  ************
  Distance related
  ************
  */

  _getNearFactorFromLocation(locationId, radius) {
    return this._getNearFactor(
      this._getDistanceFromUpdatedLocationsById(locationId),
      radius
    )
  }

  _getDistanceFromUpdatedLocationsById(locationId) {
    let _l = this._updatedLocations.filter(location => {
      return location.id === locationId
    })
    if (!_l.length) {
      console.log(`Failed _getDistanceFromUpdatedLocationsById ${locationId}`);
      return 0
    }
    return _l[0].distance
  }

  _getDistanceFromUpdatedLocationsById(locationId) {
    let _l = this._updatedLocations.filter(location => {
      return location.id === locationId
    })
    if (!_l.length) {
      console.log(`Failed _getDistanceFromUpdatedLocationsById ${locationId}`);
      return 0
    }
    return _l[0].distance
  }

  /*
  If the factor is small, the closer you are
  */
  _getNearFactor(distance, radius = PERSONAL_RADIUS) {
    console.log(`_getNearFactor:distance, ${distance} radius: ${radius}`);
    return Utils.clamp(
      distance / radius,
      MIN_NEAR_FACTOR,
      MAX_NEAR_FACTOR)
  }

  _changeFileIndex(val = 1) {
    this._fileIndex = this._getNextFileIndex(val)
  }

  get preloading() {
    return this._preloading
  }

  set volume(vol) {
    this._sound.volume = vol
  }

  //*************
  // PRELOAD
  //*************

  _cacheLocationsUrls() {
    let _l = {}
    this._data.locations.map(location => {
      let _files = this._getLocationFiles(location.id)
      _l[location.id] = this._extractUrls(_files)
    })
    return _l
  }

  _getLocationFiles(locationId) {
    let _d = this._data.locations.filter(location => {
      return location.id === locationId
    })
    if (_d.length) {
      return _d[0].files
    } else {
      return this._getMisc()
    }
  }

  _getMisc() {
    let _m = this._data.locations.filter(location => {
      return location.id === 'misc'
    })
    return _m[0].files
  }


  _filterSourcesByString(sources, string) {
    return sources.filter(obj => {
      return obj.src[0].indexOf(string) > -1
    })
  }

  _extractUrls(sourceData = []) {
    return _.uniq(sourceData.map(group => {
      return group.map(file => {
        if (!file) {
          return null
        }
        return file.url
      })
    }))
  }
}
