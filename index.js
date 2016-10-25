const Api = require('politiks');
const Promise = require('bluebird');

class AddressHandler {
  constructor(o) {
    Object.assign(this, o);
    if (!this.token) {
      throw new Error('missing_token');
    }
    this.googleapis = new Api({
      protocol: 'https',
      domain_name: 'maps.googleapis.com',
    });
  }
  fromAddress(address) {
    this.query = { address: address };
    return this;
  }
  fromPlaceId(placeid) {
    this.query = { place_id: placeid };
    return this;
  }
  fromLatLon(lat, lon) {
    this.query = { latlng: `${lat},${lon}` };
    return this;
  }
  toAddressObject() {
    return new Promise((resolve, reject) => {
      this.googleapis.route({
        path: '/maps/api/geocode/json',
        query: Object.assign({
          key: this.token,
        }, this.query)
      })
      .then((body) => {
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
        };
        if (Object.keys(body).length !== 0) {
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
        }
        resolve(address_array);
      })
      .catch((error) => {
        reject(error);
      })
    });
  }
  toAddressString(o) {
    return ((o.street_number ? (o.street_number + ', ') : '')
    + (o.route ? (o.route + ' ') : '')
    + (o.postal_code ? (o.postal_code + ' ') : '')
    + (o.locality ? (o.locality + ' ') : '')
    + (o.country ? (o.country) : '')) || null;
  }
}

module.exports = AddressHandler;
