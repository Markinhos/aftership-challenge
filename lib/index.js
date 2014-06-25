var countryLookup = require('country-data').lookup;
var fetchData = require('./transport').fetchData;
var parserHKPOST = require('./parsers').parserHKPOST;
var parserDPDUK = require('./parsers').parserDPDUK;

var couriers = require('./couriers');

(function() {
	'use strict';
	function Courier() {
		return {
			usps : function(tracking_number, callback) {
				var courierUsps = new couriers.CourierUSPS(tracking_number);
				courierUsps.track(callback);
			},

			hkpost : function(tracking_number, callback) {

				var data = 'tracknbr=' + tracking_number + '&submit=Enter';

				var options = {
					host: 'app3.hongkongpost.hk',
					port: 80,
					path: '/CGI/mt/mtZresult.jsp',
					method: 'POST',
					headers : {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': data.length
					}
				};

				fetchData(options, data, function(err, res){
					if(err) console.log(err);
					parserHKPOST(res, callback);
				});

			},
			dpduk : function(tracking_number, callback) {

				var data = 'tracknbr=' + tracking_number + '&submit=Enter';

				var reference = encodeURIComponent('=' + tracking_number);
				var options = {
					host: 'www.dpd.co.uk',
					port: 80,
					path: '/esgServer/shipping/shipment/_/parcel/?filter=id&searchCriteria=deliveryReference' + reference,
					method: 'GET'
				};

				var self = this;

				fetchData(options, null, function(err, res){
					if(err) callback(err);

					var result_json = JSON.parse(res);
					var parcelCode = result_json.obj.parcel[0].parcelCode;

					var options2 = {
						host: 'www.dpd.co.uk',
						port: 80,
						path: '/esgServer/shipping/delivery/?parcelCode=' + parcelCode + '&_=1403634885287',
						method: 'GET',
						headers: {
								cookie: 'tracking=' + result_json.obj.searchSession
						}
					};

					fetchData(options2, null, function(err, res2){
						if(err) console.log(err);
						parserDPDUK(res2, callback);
					});
				});

			}
		}
	}

	module.exports = new Courier();
}());
