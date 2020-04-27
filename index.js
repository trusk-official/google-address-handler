const axios = require("axios");
const Boom = require("@hapi/boom");

const googleapis = (token, locale = "fr") => {
  const api = axios.create({
    baseURL: "https://maps.googleapis.com"
  });

  return {
    geocode: (query = {}) => {
      return api.get(`/maps/api/geocode/json`, {
        params: Object.assign(
          {
            language: locale,
            key: token
          },
          query
        )
      });
    }
  };
};

module.exports.googleApis = token => locale => queryMaker => (
  query,
  formatter
) =>
  googleapis(token, locale)
    .geocode(queryMaker(query))
    .catch(e => e.response)
    .then(data => {
      if (!data || (data.data && data.data.status !== "OK")) {
        const e = (data && data.data) || { status: "UNKNOWN_ERROR" };
        const boomErrorTmpls = {
          ZERO_RESULTS: {
            message: "google_api_zero_results",
            code: 404
          },
          OVER_QUERY_LIMIT: {
            message: "google_api_over_query_limit",
            code: 429
          },
          REQUEST_DENIED: {
            message: "google_api_request_denied",
            code: 400
          },
          INVALID_REQUEST: {
            message: "google_api_invalid_request",
            code: 422
          },
          UNKNOWN_ERROR: {
            message: "google_api_unknown_error",
            code: 530
          }
        };
        const boomErrorTmpl =
          boomErrorTmpls[e && e.status] || boomErrorTmpls["UNKNOWN_ERROR"];
        throw Boom.boomify(new Error(boomErrorTmpl.message), {
          statusCode: boomErrorTmpl.code
        });
      }
      return data.data;
    })
    .then(formatter || defaultFormatter);

const defaultFormatter = body => {
  const address_array = {
    street_number: null,
    postal_code: null,
    route: null,
    locality: null,
    country: null,
    address_string: "",
    lat: null,
    lon: null,
    place_id: null,
    postal_town: null
  };
  address_array.address_string = body.results[0].formatted_address;
  body.results[0].address_components.forEach(function(address_component) {
    if (
      address_component.types.includes("street_number") &&
      !address_array.street_number
    ) {
      address_array.street_number = address_component.long_name;
    }
    if (address_component.types.includes("route") && !address_array.route) {
      address_array.route = address_component.long_name;
    }
    if (
      address_component.types.includes("locality") &&
      !address_array.locality
    ) {
      address_array.locality = address_component.long_name;
    }
    if (
      address_component.types.includes("postal_town") &&
      !address_array.postal_town
    ) {
      address_array.postal_town = address_component.long_name;
    }
    if (address_component.types.includes("country") && !address_array.country) {
      address_array.country = address_component.long_name;
    }
    if (
      address_component.types.includes("postal_code") &&
      !address_array.postal_code
    ) {
      address_array.postal_code = address_component.long_name;
    }
  });
  if (body.results[0].geometry && body.results[0].geometry.location) {
    address_array.lat = body.results[0].geometry.location.lat;
    address_array.lon = body.results[0].geometry.location.lng;
  }
  address_array.place_id = body.results[0].place_id || null;
  return address_array;
};

module.exports.fromLatlng = m => {
  return { latlng: `${m.lat},${m.lon}` };
};
module.exports.fromAddress = m => {
  return { address: m.address };
};
module.exports.fromPlaceid = m => {
  return { place_id: m.placeid };
};

module.exports.toAddressString = o => o.address_string;
