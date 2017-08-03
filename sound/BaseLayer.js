import AssetLoader from '../utils/AssetLoader'
import Utils from '../utils/UTILS'
import Emitter from '../utils/DerivEmitter'
import State from '../controls/State'
import BaseSound from './BaseSound'
import _ from 'lodash'
import { PERSONAL_RADIUS } from '../setup/config' //meters
import {
    CONFIG,
    MIN_NEAR_FACTOR,
    MAX_NEAR_FACTOR,
    PLAYLIST_LENGTH,
} from '../setup/config'

export default class BaseLayer {
    constructor(data) {
            this._data = data
            this._id = this._data.id

            this._locationsUrls = this._cacheLocationsUrls()

            this._beat = 0
            this._beatCounter = 0
            this._sound = new BaseSound(this._data.options.sound, this._id)
            this._sound.endingSignal.add(this.onEnding.bind(this))
            this._sound.endedSignal.add(this.onEnded.bind(this))

            this._sound.loadedSignal.add((soundId) => {
                //this.preloadNext()
                Emitter.emit(`${this._id}:soundloaded`)
            })
            this._sound.playingSignal.add(this.onPlaying.bind(this))

            this._playlist = []
            this._playedSources = []
                //every locations every update
            this._updatedLocations = []
        }
        /*
        If there is no sound playing and a new beat comes,
        play the next sound
        SAYS WHEN TO PLAY NEXT LOADED AUDIO
        */
    onMetronome() {
        this._sound.onMetronome()
        this._beatCounter++
    }

    mapEntering(location) {}

    mapLeaving(shuffle = true) {}

    mapUpdate(locations, shuffle = true) {
        if (!locations[0]) {
            this._buildOutPlaylist()
        } else {
            this._buildPlaylist(locations, shuffle)
        }
        /*if (State.state === 'in') {
          if(this._id === 'speaking'){
            //console.log(this._playlist);
          }
        } else {
          this._buildOutPlaylist()
        }*/
    }

    ///***************
    //EVENTS
    ///***************
    onEnding() {}

    onEnded(endObj) {
        let { soundName, soundIndex, hasFinished, progress } = endObj
        console.log("%%%%%%%%%%%%%%%%%%%%%%");
        console.log(endObj);
        console.log("%%%%%%%%%%%%%%%%%%%%%%");
        this._playedSources.push(soundName)
    }

    onPlaying() {

    }

    ///***************
    //GUI
    ///***************

    getInfo() {
        let _r = []
        if (this._sound.sounds) {
            _.each(this._sound.sounds, sound => {
                //console.log(sound);
                //howler sound
                if (sound.sound && !sound.sound.markedToDestroy) {
                    _r.push('--------------')
                    _r.push(`nearFactor: ${sound.sound.nearFactor}`)
                    _r.push(`soundname: ${sound.sound.soundname}`)
                    _r.push(`playing: ${sound.sound.playing}`)
                    _r.push(`progress: ${sound.sound.seek}`)
                    _r.push(`scheduledVolume: ${this.scheduledVolume}`)
                    _r.push(`volume: ${sound.sound.volume}`)
                    _r.push('--------------')
                }
            })
        } else {
            _r = [...this._extractInfoFromSound(this._sound)]
        }
        return _r
    }

    _extractInfoFromSound(sound) {
        let _r = []
        _r.push('--------------')
        _r.push(`activeIndex: ${this._sound.activeIndex}`)
        _r.push(`nearFactor: ${sound.nearFactor}`)
        _r.push(`soundname: ${sound.soundname}`)
        _r.push(`playtime: ${sound.playtime}`)
        _r.push(`playing: ${sound.playing}`)
        _r.push(`progress: ${sound.seek}`)
        _r.push(`scheduledVolume: ${this.scheduledVolume}`)
        _r.push(`volume: ${sound.volume}`)
        _r.push('--------------')
        return _r
    }

    terminateCurrentSound() {}

    increaseSeek(v = 1) {
        let _ct = this._sound.seek
        let _t = _ct + v
        if (_t < this._sound.duration) {
            this._sound.seek = _t
        }
    }

    ///***************
    //PRIVATE
    ///***************

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
            //console.log(this._id);
            //console.log(_locations);
        let _totalSourcesLength = 0
        _.each(_locations, location => {
                location.sourcesLength = 0
                    //how close you are to center of the location
                location.nearFactor = this._getNearFactor(
                    location.distance,
                    location.radius
                )
                location.sources = this._getLocationSourcesById(location.id)
                if (shuffle) {
                    Utils.shuffle(location.sources)
                }
                location.sourcesLength = location.sources.length
                _totalSourcesLength += location.sourcesLength
            })
            /*Update state*/
            //State.nearFactor = this._closestLocation.nearFactor

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
                let _sources = _.compact(_l.sources.shift())
                if (_sources && _sources.length) {
                    //!!!
                    let _s = {
                        src: _sources,
                        nearFactor: _l.nearFactor
                    }
                    let _name = this._getFileNameFromSource(_sources)
                    this._playlist.push(_s)
                    if(this._playedSources.indexOf(_name) < 0){
                    }
                } else {
                    _locationIndex = (_locationIndex + 1) % _totalLocations
                    _failedTries++
                }
            } else {
                _locationIndex = (_locationIndex + 1) % _totalLocations
            }
        }

        //put the current one on top
        if (_currentlyPlaying) {
            //this._playlist.unshift(_currentlyPlaying)
        }
    }

    _buildOutPlaylist() {
        let transitionSources = this._createPlaylistObjectsFromSourceUrls(
            this._getTransitionSourceUrls()
        )
        Utils.shuffle(transitionSources)
        this._playlist.length = 0
        this._playlist = transitionSources
    }

    get sound() {
        return this._sound
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

    get closestLocationUrls() {
        if (!this._closestLocation) {
            return this._locationsUrls.transitions || []
        }
        return this._locationsUrls[this._closestLocation.id] || []
    }

    /*
    We get the obj that will have the progress saved
    */
    play(fadeDur = 500) {
        if(this._isPaused)  return
        this._sound.play(null, fadeDur)
    }

    pause() {
        this._savedVolume = this.volume
        this.volume = 0
        this._isPaused = true
        this._sound.pause()
    }

    resume() {
        this._isPaused = false
        this.volume = this._savedVolume
        this._sound.resume()
    }

    destroy() {
        this._sound.destroy()
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
    _loadNext(soundOptions, sources, force = false) {
        //increase file index
        //this._changeFileIndex(1)
        //new sound at new index, remove from playlist
        let _source
            //console.log(this._playlist);
            //console.log(sources);
        if (sources) {
            _source = sources.shift()
        } else {
            _source = this._playlist.shift()
        }
        //console.log(_source);
        if (_source) {
            let _name = this._getFileNameFromSource(_source)
            soundOptions = soundOptions || _source.soundOptions

            if(this._id === 'music'){
                console.log("------------------");
                console.log(_source);
                console.log(soundOptions);
                console.log(this.scheduledVolume);
                console.log("------------------");
            }
            //console.log("BaseLayer, _loadNext() ----------");
            //console.log(_source);
            //console.log(_source.soundOptions);
            //console.log("----------");
            //get the near factor
            this._sound.newSound(_source, _name, soundOptions, force)
                //allow the manager to preload the next
            this._preloading = false
                //destroy current the preloader
            /*if (this._preloader) {
                this._preloader.destroy()
                this._preloader = null
            }*/
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


    _makeSrcArrayFromLocationUrls(locationUrls) {
        locationUrls = locationUrls || this.closestLocationUrls
        return locationUrls.slice(0)
            .map(srcArray => {
                return { src: srcArray }
            })
    }

    /*
    Gets the already parsed location urls by location id
    */
    _getLocationSourcesById(locationId) {
        //console.log(this._locationsUrls);
        //console.log(locationId);
        return this._locationsUrls[locationId].slice(0)
    }

    /*
    Get location by id
    */

    _getLocationById(locationId) {
        return this._data.locations.filter(location => {
            //console.log(locationId, location.id);
            return location.id === locationId
        })[0]
    }

    /*
    All the formated urls of transitions
    */
    /*_getTransitionSourceUrls() {
      return this._extractUrls(this._data.locations.filter(location => {
          return location.id === 'transitions'
        })
        .map(sources => {
          return sources.files
        })[0])
    }*/

    _getTransitionSourceUrls() {
        let _c = [...this._locationsUrls.transitions || []]
        return _c
    }

    _filterSourcesByTerm(sources, term) {
        return sources.filter(obj => {
            return obj.src[0].indexOf(term) >= 0
        })
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
        let _i = sourcePair[0] ? 0 : 1
        let _name = sourcePair[_i].split('/')
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
            //console.log(`Failed _getDistanceFromUpdatedLocationsById ${locationId}`);
            return 0
        }
        return _l[0].distance
    }

    _getDistanceFromUpdatedLocationsById(locationId) {
        let _l = this._updatedLocations.filter(location => {
            return location.id === locationId
        })
        if (!_l.length) {
            //console.log(`Failed _getDistanceFromUpdatedLocationsById ${locationId}`);
            return 0
        }
        return _l[0].distance
    }

    /*
    If the factor is small, the closer you are
    */
    _getNearFactor(distance, radius = PERSONAL_RADIUS) {
        return State.nearFactor
            ////console.log(`_getNearFactor:distance, ${distance} radius: ${radius}`);
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
        if(this._isPaused) return
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
                if (CONFIG.filterOnlyAudioFormats) {
                    if (file.url.includes(`.${CONFIG.filterOnlyAudioFormats}`)) {
                        return file.url + `?z=${Math.random()}`
                    } else {
                        return null
                    }
                    return file.url + `?z=${Math.random()}`
                } else {
                    return file.url + `?z=${Math.random()}`
                }
            })
        }))
    }
}
