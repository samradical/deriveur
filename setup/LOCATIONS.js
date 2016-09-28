let BARBI = { id: 'loc0', latitude: 51.520008, longitude: -0.0946432, radius: 300 }
let ANGEL = { id: 'loc1', latitude: 51.533181, longitude: -0.105946, radius: 400 }
let HIGHBURY = { id: 'loc2', latitude: 51.554675, longitude: -0.098315, radius: 400 }
let WHITEMAN = { id: 'loc3', latitude: 51.574383, longitude: -0.103957, radius: 400 }
let HOME = { id: 'loc0', latitude: 51.5840453, longitude: -0.1076437, radius: 300 }

const ALHAMBA = [
  { id: 'loc0', latitude: 37.7987, longitude: -122.42243, radius: 30 },
  { id: 'loc1', latitude: 37.79831, longitude: -122.42219, radius: 10 },
  { id: 'loc2', latitude: 37.79812, longitude: -122.42214, radius: 15 },
  { id: 'loc3', latitude: 37.79785, longitude: -122.42185, radius: 16 },
  /*{ id: 'loc4', latitude: 37.79795, longitude: -122.42186, radius: 300 },
  { id: 'loc5', latitude: 37.79793, longitude: -122.42119, radius: 300 },
  { id: 'loc6', latitude: 37.79802, longitude: -122.42056, radius: 300 },
  { id: 'loc7', latitude: 37.79815, longitude: -122.42043, radius: 300 },*/
]

const BARBI_HOME = [
  BARBI,
  ANGEL,
  HIGHBURY,
  WHITEMAN,
  HOME
]

const HOME_AREA_WEBSTER = [{ id: 'loc0', latitude: 37.827996, longitude: -122.261149, radius: 40 }]
const HOME_AREA = [
  { id: 'loc0', latitude: 51.584240, longitude: -0.106143, radius: 40 },
  //{ id: 'loc1', latitude: 51.584280, longitude: -0.105853, radius: 20 },
  /*{ id: 'loc2', latitude: 51.584180, longitude: -0.106239, radius: 10 },
  { id: 'loc3', latitude: 51.584306, longitude: -0.105563, radius: 25 },*/

]
const OUTSIDE_BARBI = { latitude: 51.533181, longitude: -0.105946 }
const OUTSIDE_BARBI_NEAR = [
  { latitude: 51.518562, longitude: -0.092574 },
  { latitude: 51.520077, longitude: -0.095235 },
  { latitude: 51.519576, longitude: -0.090632 }
]

const BARBI_HOOD = [
  { id: 'loc0', latitude: 51.520164, longitude: -0.093241, radius: 50 },
  { id: 'loc1', latitude: 51.519549, longitude: -0.094025, radius: 80 },
  { id: 'loc2', latitude: 51.520071, longitude: -0.092480, radius: 40 },
  { id: 'loc3', latitude: 51.519214, longitude: -0.093109, radius: 30 },
]

const PLACES = [
  BARBI,
  { latitude: 51.584162, longitude: -0.106495, radius: 100 },
  { latitude: 51.583002, longitude: -0.105948, radius: 70 },
  { latitude: 51.581642, longitude: -0.106194, radius: 40 },
  { latitude: 51.580629, longitude: -0.105561, radius: 80 },
  { latitude: 51.579055, longitude: -0.104628, radius: 90 },
  { latitude: 51.578148, longitude: -0.104263, radius: 100 }
]

const PERCH = [
  { id: 'loc0', latitude: 37.808773, longitude: -122.253125, radius: 40 },
  { id: 'loc1', latitude: 37.809355, longitude: -122.252768, radius: 20 },
  { id: 'loc2', latitude: 37.810011, longitude: -122.252626, radius: 10 },
  { id: 'loc3', latitude: 37.810570, longitude: -122.252579, radius: 20 },
]

const PABLO = [
  { id: 'loc0', latitude: 37.849141, longitude: -122.285545, radius: 40 },
  { id: 'loc1', latitude: 37.848269,  longitude: -122.285248, radius: 40 },
  { id: 'loc2', latitude: 37.847735,  longitude: -122.286633, radius: 60 },
  { id: 'loc3', latitude: 37.847527,  longitude: -122.288117, radius: 40 },
  { id: 'loc4', latitude: 37.847607,  longitude: -122.288485, radius: 40 },
  /*{ id: 'loc5', latitude: 37.848522,  longitude: -122.288517, radius: 40 },
  { id: 'loc6', latitude: 37.848717,  longitude:  -122.287530, radius: 40 },
  { id: 'loc7', latitude: 37.848937,  longitude:  -122.286543, radius: 40 },*/
]

const CARA = [
  { id: 'loc0', latitude: 51.574840, longitude: -0.086101, radius: 10 },
  { id: 'loc1', latitude: 51.574806,  longitude: -0.086753, radius: 10 },
  { id: 'loc2', latitude: 51.574756,  longitude:  -0.087582, radius: 20 },
  { id: 'loc3', latitude: 51.574783,  longitude:  -0.088020, radius: 20 },
  /*{ id: 'loc5', latitude: 37.848522,  longitude: -122.288517, radius: 40 },
  { id: 'loc6', latitude: 37.848717,  longitude:  -122.287530, radius: 40 },
  { id: 'loc7', latitude: 37.848937,  longitude:  -122.286543, radius: 40 },*/
]



let LOCATIONS = [
  //barbi
  { id: 'loc0', latitude: 51.520008, longitude: -0.0946432, radius: 100 },

  { id: 'loc1', latitude: 51.584162, longitude: -0.106495, radius: 100 }
]

//LOCATIONS = HOME_AREA//[ALHAMBA[0]]
LOCATIONS = [ALHAMBA[0]]
LOCATIONS = PABLO

let L = (() => {

  return { locations: LOCATIONS }
})()
export { OUTSIDE_BARBI, OUTSIDE_BARBI_NEAR }
export default L
