import Utils from '../utils/UTILS'
import Emitter from '../utils/DerivEmitter'
import geolib from 'geolib'
import _ from 'lodash'
import Signals from 'signals'
import { OUTSIDE_BARBI_NEAR } from '../setup/LOCATIONS' //meters
import { CONFIG } from '../setup/config'

const TIMEOUT_TIME = 5000

export default class Map {
  constructor(locations, options = {}) {
    this._locations = locations
    this._options = options
    this._allowLocationChange = true

    this.MapOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    this.mapLoadedSignal = new Signals()

    this._activeLocation = -1
    this._activeLocationIndex = -1

    this._boundUpdatePosition = this.updatePosition.bind(this)

    this._storedLocations = []

    Emitter.on('gui:nextlocation', this._nextLocation.bind(this))
    Emitter.on('gui:map:update', () => {
      this.updatePosition(
        this._storedLocations[this._storedLocations.length - 1]
      )
    })

    Emitter.on('gui:outside:barbi', () => {
      let _pos = Utils.getRandom(OUTSIDE_BARBI_NEAR)
      this.updatePosition(
        _pos
      )
    })
    if (!CONFIG.noVisualMap) {
      this._drawMap({ coords: { latitude: 0, longitude: 0 } })
    } else {
      //navigator.geolocation.getCurrentPosition(this._drawMap.bind(this), this.error, this.MapOptions);
      navigator.geolocation.getCurrentPosition(this.updatePosition.bind(this));
      setTimeout(() => {
        this.mapLoadedSignal.dispatch()
      }, 200)
    }

    //**** interval
    if (!CONFIG.noGeo) {
      this._updateI = setInterval(() => {
        navigator.geolocation.getCurrentPosition(this._boundUpdatePosition, this.error, this.MapOptions);
      }, CONFIG.mapUpdateSpeed)
    }

    Emitter.emit('map:locations', this._locations)
    Emitter.on('controls:pause', () => {
      this._paused = true
    })
    Emitter.on('controls:resume', () => {
      this._paused = false
    })

    Emitter.on('controls:destroy', () => {
      let _el = document.getElementById("mapcontainer")
      google.maps.event.clearInstanceListeners(window);
      google.maps.event.clearInstanceListeners(document);
      google.maps.event.clearInstanceListeners(_el);
      document.body.removeChild(_el);
      this._paused = true
      clearInterval(this._updateI)
    })
  }

  mapError() {
    console.warn('ERROR(' + err.code + '): ' + err.message);
  }

  _latLngObj(pos) {
    return { latitude: pos.latitude, longitude: pos.longitude }
  }

  _latLng(coords) {
    return new google.maps.LatLng(coords.latitude, coords.longitude);
  }

  updatePosition(pos) {
    if (this._paused) {
      return
    }
    if (!pos.coords && !pos.latitude) {
      Emitter.emit('log:error', `Map: No latitude or longitude`);
      return
    } else if (pos.latitude && pos.longitude) {
      pos.coords = { latitude: pos.latitude, longitude: pos.longitude }
    }

    //console.log(`updatePosition: ${JSON.stringify(pos.coords)}`);
    /*if (_.isEmpty(pos.coords)) {
      Emitter.emit('log:error', `Map: No latitude or longitude`);
      return
    }*/
    let _locations = this._getLocationsIn(
      this._locations,
      pos.coords
    )
    let _ordered = this._orderLocationsByDistance(
      pos.coords,
      this._locations)

    let locationsNotIn = _.xor(_ordered, _locations)
      /*let _bearing = geolib.getBearing(
        this._latLngObj(pos.coords),
        this._latLngObj(locationsNotIn[0]),
      )*/

    Emitter.emit('map:update:user', pos.coords)
    Emitter.emit('ext:map:update:user', pos.coords)
      //Emitter.emit('map:bearing', _bearing)
    Emitter.emit('map:update', _locations)
    Emitter.emit('map:locationsnotin', locationsNotIn)
    if (this.map) {
      this.map.setCenter(this._latLng(pos.coords))
      this.me.setPosition(this._latLng(pos.coords))
    }


    /*
    Check to see if the closest location to postion is the same,
    if not dispatch
    */
    if (this._allowLocationChange) {

      if (_locations.length) {
        /*
        Entering a new location
        */
        if (this._activeLocation !== _locations[0]) {
          this._activeLocation = _locations[0]
          this._activeLocationIndex = this._locations.indexOf(this._activeLocation)
          Emitter.emit('map:entering', this._activeLocation)
          Emitter.emit(`ext:map:entering`, this._activeLocation, this._activeLocationIndex)
          this._startTimeout(6000)
        } else {
          /*
          Within the same location
          */
        }
        /*
        Leaving a new location
        */
      } else if (this._activeLocation) {
        this._activeLocation = null
        Emitter.emit('map:leaving')
        let _nearest = locationsNotIn[0]
        let _index = parseInt(_nearest.key, 10)
        _nearest.id = `loc${_index}`
        Emitter.emit(`ext:map:leaving`, _nearest, _index)
        this._startTimeout()
      }
    }

    let _lat = pos.coords.latitude
    let _lng = pos.coords.longitude
    this._storedLocations.push({ latitude: _lat, longitude: _lng })
    if (this._storedLocations.length > this._options.maxStoreLocations) {
      this._storedLocations.shift()
    }
    Emitter.emit('map:movement', this._hasPersonMoved())
  }

  _orderLocationsByDistance(currentPos, locations) {
    return geolib.orderByDistance(
      this._latLngObj(currentPos),
      locations.map(location => {
        return _.assign({}, this._latLngObj(location), { id: location.id })
      })
    )
  }

  _startTimeout(dur) {
    this._allowLocationChange = false
    clearTimeout(this._coolTo)
    this._coolTo = setTimeout(() => {
      this._allowLocationChange = true
    }, dur || TIMEOUT_TIME)
  }



  _getLocationsIn(locations, pos, radius) {
    let _currentPos = this._latLngObj(pos)
    let _actives = locations.filter(location => {
      return geolib.isPointInCircle(_currentPos,
        this._latLngObj(location),
        radius || location.radius
      );
    })

    geolib.orderByDistance(_currentPos, _actives);
    return _actives
  }

  _hasPersonMoved() {
    let _t = 0
    let _c = 0
    for (var i = 0; i < this._storedLocations.length; i += 2) {
      let _f = this._storedLocations.slice(i, 1)[0]
      let _l = this._storedLocations.slice(i + 1, 1)[0]
      if (_f && _l) {
        _t += geolib.getDistance(
          this._latLngObj(_f),
          this._latLngObj(_l))
        _c++
      }
    }
    let _average = _t / _c
    if (isNaN(_average)) {
      return false
    }
    return _average > this._options.personalMovement
  }

  //************
  //SETUP
  //************

  _addLocationToMap(map, location) {
    // Add the circle for this city to the map.
    var cityCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: false,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: map,
      center: { lat: location.latitude, lng: location.longitude },
      radius: location.radius
    });
  }

  _drawMap(pos) {

    var mapcanvas = document.createElement('div');
    mapcanvas.id = 'mapcontainer';
    mapcanvas.style.height = '400px';
    mapcanvas.style.width = '320px';

    document.body.appendChild(mapcanvas);

    var options = {
      zoom: 17,
      center: this._latLng(pos.coords),
      mapTypeControl: false,
      navigationControlOptions: {
        style: google.maps.NavigationControlStyle.SMALL
      },
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] }, {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        }, {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        }, {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }]
        }, {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }]
        }, {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }]
        }, {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }]
        }, {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }]
        }, {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }]
        }, {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }]
        }, {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }]
        }, {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }]
        }, {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        }, {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }]
        }, {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }]
        }, {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }]
        }, {
          featureType: "poi",
          stylers: [
            { visibility: "off" }
          ]
        }
      ],
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.map = new google.maps.Map(document.getElementById("mapcontainer"), options);
    google.maps.event.addListener(this.map, 'tilesloaded', () => {
      //console.log("Tiled Loaded");
      this.mapLoadedSignal.dispatch()
    });
    this._locations.forEach(location => {
      this._addLocationToMap(this.map, location)
    })

    this.me = new google.maps.Marker({
      position: this._latLng(pos.coords),
      map: this.map,
      title: 'Me'
    });

    google.maps.event.addListener(this.map, 'click', (event) => {
      this.updatePosition({ coords: { latitude: event.latLng.lat(), longitude: event.latLng.lng() } })
    });
    //console.log("Draw map");
  }

  _nextLocation() {
    let _i = this._activeLocationIndex + 1
    if (_i >= this._locations.length) {
      _i = 0
    }
    this._activeLocationIndex = _i
      //console.log(this._activeLocationIndex, this._locations.length);
    this.updatePosition({
      coords: this._locations[this._activeLocationIndex]
    })
  }
}
