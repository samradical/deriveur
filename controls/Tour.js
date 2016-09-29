import _ from 'lodash'
import geolib from 'geolib'
import Emitter from '../utils/DerivEmitter'
export default class Tour {
  constructor(locations) {
    this._tour = locations.map(location => {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        id: location.id,
        distance: 0,
        visited: false,
        active: false
      }
    })
    localStorage.removeItem('locations')
    this._seenLocations = this._seenLocations || ''
    this._seenLocations = this._seenLocations.split(',')
    if (this._seenLocations[0] === "") {
      this._seenLocations = []
    }
    _.forEach(this._seenLocations, (id) => {
      let _f = _.find(this._tour, { id: id })
      _f.visited = true
    })

    Emitter.on('map:update:user', (coords) => {
      this._userCoords = coords
      this._getDistance(this.nextLocation)
    })

    setInterval(() => {
      let _n = this.nextLocation
      let _bearing = geolib.getBearing(
        this._latLngObj(this._userCoords), {
          latitude: _n.latitude,
          longitude: _n.longitude
        }
      )
      Emitter.emit('ext:map:bearing', _bearing)
      Emitter.emit('ext:tour:nextlocation', _n)
    }, 4000)

    Emitter.emit('ext:tour:nextlocation', this.nextlocation)
  }

  _latLngObj(pos) {
    return { latitude: pos.latitude, longitude: pos.longitude }
  }

  in (locationId) {
    let _f = _.find(this._tour, { id: locationId })
    this._activeLocation = _f
    this._activeLocation.active = true
  }

  addLocationToStorage(locationId) {
    this._seenLocations.push(locationId)
      //this._seenLocations[`${locationId}`] = { visited: true }
    localStorage.setItem('locations', this._seenLocations.toString())
  }

  out() {
    if (this._activeLocation) {
      this._activeLocation.visited = true
      this._activeLocation.active = false
      this.addLocationToStorage(this._activeLocation.id)
    }
    //Emitter.emit('ext:tour:nextlocation', this.nextLocation)
  }

  _latLngObj(pos) {
    return { latitude: pos.latitude, longitude: pos.longitude }
  }

  _getDistance(location) {
    let _d = geolib.getDistance(
      this._latLngObj({ latitude: location.latitude, longitude: location.longitude }),
      this._latLngObj(this._userCoords))
    location.distance = _d
  }

  set locationsNear(locations) {
    this._locationsNear = locations
  }

  get locationsNear() {
    return this._locationsNear || this._tour
  }

  get nextLocation() {
    let _next = this.locationsNear.filter(l => {
      let _f = _.find(this._tour, { id: l.id })
      if (!_f) {
        return this._tour[0]
      }
      return _f.visited === false
    })[0] || this._tour[0]
    return _next
  }
}
