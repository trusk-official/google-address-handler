const Api = require('politiks');
const Promise = require('bluebird');

module.exports.googleApis = token => locale => queryMaker => (query, formatter) =>
  Promise.resolve()
  .then(() => {
    return (new Api({
      protocol: 'https',
      domain_name: 'maps.googleapis.com',
    })).route({
      path: '/maps/api/geocode/json',
      query: Object.assign({
        language: locale,
        key: token,
      }, queryMaker(query))
    });
  })
  .then(formatter || defaultFormatter);

const defaultFormatter = (body) => {
  const address_array = {
    street_number: null,
    postal_code: null,
    route :null,
    locality: null,
    country: null,
    address_string: '',
    lat: null,
    lon: null,
    place_id: null,
    postal_town: null
  };
  if (Object.keys(body).length !== 0 && body.status === 'OK') {
    address_array.address_string = body.results[0].formatted_address;
    body.results[0].address_components.forEach(function(address_component) {
      if(address_component.types.includes('street_number') && !address_array.street_number) {
        address_array.street_number = address_component.long_name;
      }
      if(address_component.types.includes('route') && !address_array.route) {
        address_array.route = address_component.long_name;
      }
      if(address_component.types.includes('locality') && !address_array.locality) {
        address_array.locality = address_component.long_name;
      }
      if(address_component.types.includes('postal_town') && !address_array.postal_town) {
        address_array.postal_town = address_component.long_name;
      }
      if(address_component.types.includes('country') && !address_array.country) {
        address_array.country = address_component.long_name;
      }
      if(address_component.types.includes('postal_code') && !address_array.postal_code) {
        address_array.postal_code = address_component.long_name;
      }
    });
    if(body.results[0].geometry && body.results[0].geometry.location) {
      address_array.lat = body.results[0].geometry.location.lat;
      address_array.lon = body.results[0].geometry.location.lng;
    }
    address_array.place_id = body.results[0].place_id || null;
    return address_array;
  }
  if (body.status === 'ZERO_RESULTS') {
    throw new Error('no_results');
  }
  throw new Error(body.error_message);
};

module.exports.fromLatlng = m => { return { latlng: `${m.lat},${m.lon}` } };
module.exports.fromAddress = m => { return { address: m.address } };
module.exports.fromPlaceid = m => { return { place_id: m.placeid } };

module.exports.toAddressString = o => o.address_string;
