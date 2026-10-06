/* TAS Group concept site — network data.
   Coordinates are real; transit times, lanes and rates are ILLUSTRATIVE
   and should be replaced with figures supplied by TAS before launch. */

window.TAS = window.TAS || {};

TAS.hub = {
  code: 'MYPEN', iata: 'PEN', name: 'Penang', place: 'Butterworth, Malaysia',
  lat: 5.41, lon: 100.36
};

/* Shared sea-lane waypoints [lat, lon] */
const MALACCA = [[4.3, 100.2], [2.7, 101.1], [1.6, 102.6], [1.15, 103.7]];
const SCS     = [...MALACCA, [1.3, 104.4], [2.5, 105.2]];
const WEST    = [[6.2, 98.5], [6.3, 95.0]];
const SRILANKA = [...WEST, [5.6, 86], [5.6, 80.5], [6.8, 77]];
const SUEZ = [...SRILANKA, [11.8, 52], [12.6, 45], [12.6, 43.4], [15, 41.8], [20, 38.6],
  [25, 35.5], [27.7, 34], [29.9, 32.56], [31.3, 32.3], [33.5, 27], [36.2, 14.8],
  [37.8, 6], [36.0, -2], [35.95, -5.6], [36.5, -9.4], [43.3, -10], [48.3, -5.8],
  [50, -1.5], [51.1, 1.6]];
const LUZON = [...SCS, [8, 109.5], [15, 112], [20.5, 121]];
const ROAD_NORTH = [[6.4, 100.4]];
const ROAD_SOUTH = [[4.6, 101.08], [3.14, 101.69]];

TAS.ports = [
  { code: 'MYPKG', name: 'Port Klang', country: 'Malaysia', region: 'Southeast Asia', lat: 3.00, lon: 101.39,
    ocean: { days: [1, 2], via: [[4.3, 100.2], [3.1, 101.1]], lane: 'Coastal, Strait of Malacca' },
    air:   { days: [1, 1], iata: 'KUL' },
    land:  { days: [1, 1], via: [[4.6, 101.08], [3.6, 101.3]], lane: 'North–South Expressway' } },
  { code: 'SGSIN', name: 'Singapore', country: 'Singapore', region: 'Southeast Asia', lat: 1.26, lon: 103.84,
    ocean: { days: [2, 3], via: MALACCA, lane: 'Strait of Malacca' },
    air:   { days: [1, 1], iata: 'SIN' },
    land:  { days: [1, 2], via: [...ROAD_SOUTH, [2.2, 102.25], [1.48, 103.76]], lane: 'via Johor Causeway' } },
  { code: 'THLCH', name: 'Laem Chabang', country: 'Thailand', region: 'Southeast Asia', lat: 13.08, lon: 100.88,
    ocean: { days: [6, 8], via: [...MALACCA, [1.3, 104.4], [5.5, 104.0], [9.5, 101.6]], lane: 'Gulf of Thailand' },
    air:   { days: [1, 2], iata: 'BKK' },
    land:  { days: [2, 3], via: [...ROAD_NORTH, [7.0, 100.47], [9.1, 99.3], [10.5, 99.2], [12.6, 99.95], [13.6, 100.6]], lane: 'via Bukit Kayu Hitam border' } },
  { code: 'THHDY', name: 'Hat Yai', country: 'Thailand', region: 'Southeast Asia', lat: 7.0, lon: 100.47,
    land:  { days: [1, 1], via: ROAD_NORTH, lane: 'via Bukit Kayu Hitam border' } },
  { code: 'IDTPP', name: 'Jakarta', country: 'Indonesia', region: 'Southeast Asia', lat: -6.10, lon: 106.88,
    ocean: { days: [5, 7], via: [...MALACCA, [0.2, 105.0], [-3.0, 106.9]], lane: 'Java Sea' },
    air:   { days: [1, 2], iata: 'CGK' } },
  { code: 'VNSGN', name: 'Ho Chi Minh City', country: 'Vietnam', region: 'Southeast Asia', lat: 10.77, lon: 106.70,
    ocean: { days: [5, 7], via: [...SCS, [8.5, 106.8], [10.2, 107.0]], lane: 'South China Sea' },
    air:   { days: [1, 2], iata: 'SGN' } },
  { code: 'HKHKG', name: 'Hong Kong', country: 'China SAR', region: 'North Asia', lat: 22.30, lon: 114.17,
    ocean: { days: [7, 9], via: [...SCS, [8, 109.5], [15, 111.8]], lane: 'South China Sea' },
    air:   { days: [1, 2], iata: 'HKG' } },
  { code: 'CNSHA', name: 'Shanghai', country: 'China', region: 'North Asia', lat: 30.63, lon: 122.07,
    ocean: { days: [10, 12], via: [...SCS, [8, 109.5], [15, 112], [21.5, 115.5], [24.5, 119.8], [28, 122]], lane: 'via Taiwan Strait' },
    air:   { days: [1, 2], iata: 'PVG' } },
  { code: 'KRPUS', name: 'Busan', country: 'South Korea', region: 'North Asia', lat: 35.10, lon: 129.04,
    ocean: { days: [12, 14], via: [...LUZON, [25.5, 123.5], [31, 126.5], [34.2, 128.9]], lane: 'via Luzon Strait' },
    air:   { days: [2, 3], iata: 'PUS' } },
  { code: 'JPYOK', name: 'Yokohama', country: 'Japan', region: 'North Asia', lat: 35.44, lon: 139.64,
    ocean: { days: [14, 16], via: [...LUZON, [27, 128], [31.5, 133], [33.8, 138], [35.2, 139.75]], lane: 'via Luzon Strait' },
    air:   { days: [1, 2], iata: 'NRT' } },
  { code: 'INMAA', name: 'Chennai', country: 'India', region: 'South Asia', lat: 13.08, lon: 80.29,
    ocean: { days: [6, 8], via: [...WEST, [9.5, 88]], lane: 'Bay of Bengal' },
    air:   { days: [1, 2], iata: 'MAA' } },
  { code: 'BDCGP', name: 'Chattogram', country: 'Bangladesh', region: 'South Asia', lat: 22.31, lon: 91.80,
    ocean: { days: [9, 12], via: [[6.2, 98.5], [10, 94.8], [16, 92.3], [21, 91.6]], lane: 'Bay of Bengal' },
    air:   { days: [2, 3], iata: 'CGP' } },
  { code: 'LKCMB', name: 'Colombo', country: 'Sri Lanka', region: 'South Asia', lat: 6.94, lon: 79.85,
    ocean: { days: [5, 7], via: [...WEST, [5.6, 86], [5.7, 81]], lane: 'Indian Ocean' },
    air:   { days: [1, 2], iata: 'CMB' } },
  { code: 'AEJEA', name: 'Jebel Ali', country: 'UAE', region: 'Middle East & Africa', lat: 25.01, lon: 55.06,
    ocean: { days: [14, 17], via: [...SRILANKA, [14, 62], [22.6, 61.2], [25.9, 57.2], [26.4, 56.4], [25.4, 55.2]], lane: 'via Strait of Hormuz' },
    air:   { days: [1, 2], iata: 'DXB' } },
  { code: 'ZADUR', name: 'Durban', country: 'South Africa', region: 'Middle East & Africa', lat: -29.87, lon: 31.03,
    ocean: { days: [18, 22], via: [...WEST, [3, 92], [-6, 80], [-20, 58.5], [-27, 46]], lane: 'Indian Ocean' },
    air:   { days: [2, 3], iata: 'DUR' } },
  { code: 'NLRTM', name: 'Rotterdam', country: 'Netherlands', region: 'Europe', lat: 51.95, lon: 4.05,
    ocean: { days: [26, 30], via: SUEZ, lane: 'via Suez Canal' },
    air:   { days: [2, 3], iata: 'AMS' } },
  { code: 'DEHAM', name: 'Hamburg', country: 'Germany', region: 'Europe', lat: 53.55, lon: 9.97,
    ocean: { days: [28, 32], via: [...SUEZ, [52.3, 3.6], [53.9, 6.5], [54.0, 8.3]], lane: 'via Suez Canal' },
    air:   { days: [2, 3], iata: 'HAM' } },
  { code: 'AUFRE', name: 'Fremantle', country: 'Australia', region: 'Oceania', lat: -32.05, lon: 115.75,
    ocean: { days: [12, 15], via: [[6.2, 98.5], [6.2, 95.0], [3.5, 95.2], [-2, 97.6], [-8, 103.5], [-20, 110]], lane: 'Indian Ocean' },
    air:   { days: [1, 2], iata: 'PER' } },
  { code: 'AUSYD', name: 'Sydney', country: 'Australia', region: 'Oceania', lat: -33.86, lon: 151.21,
    ocean: { days: [16, 19], via: [...MALACCA, [-1, 108], [-5, 110.5], [-6.8, 116], [-7.8, 121], [-8.0, 125],
      [-9.5, 131], [-10.5, 138], [-10.6, 141.9], [-11.5, 145], [-16, 150.5], [-25, 155], [-31, 154]], lane: 'via Torres Strait' },
    air:   { days: [1, 2], iata: 'SYD' } }
];

/* Border crossings drawn on the land view */
TAS.waypoints = [
  { name: 'Bukit Kayu Hitam', lat: 6.5, lon: 100.42 },
  { name: 'Johor Causeway', lat: 1.46, lon: 103.77 }
];

TAS.modes = {
  ocean: { label: 'Ocean', gateway: 'Penang Port · MYPEN', unit: 'days' },
  air:   { label: 'Air',   gateway: 'Penang Intl · PEN',   unit: 'days' },
  land:  { label: 'Land',  gateway: 'Butterworth depot',   unit: 'days' }
};

/* Indicative tariff model (USD) used by the quote calculator */
TAS.rates = {
  fcl: {
    '20GP': { base: 180, perNm: 0.11, thc: 120, cbm: 33.2, maxT: 28 },
    '40GP': { base: 260, perNm: 0.17, thc: 180, cbm: 67.7, maxT: 26.7 },
    '40HC': { base: 280, perNm: 0.18, thc: 190, cbm: 76.3, maxT: 26.5 }
  },
  lcl:  { base: 25, perNmPerWM: 0.009, cfsPerWM: 18, minWM: 1 },
  air:  { base: 0.9, perKmPerKg: 0.00028, handlingPerKg: 0.15, screeningPerKg: 0.08, min: 75 },
  land: { ftlBase: 180, ftlPerKm: 1.35, palletBase: 25, palletPerKm: 0.09, ftlPallets: 18, border: 120 },
  docs: 60, customs: 85,
  cargo: { general: 1, reefer: 1.25, dg: 1.35 },
  co2: { ocean: 0.015, air: 0.56, land: 0.075 } // kg CO2 per tonne-km
};
