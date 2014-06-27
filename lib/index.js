var couriers = require('./couriers');

(function() {
	'use strict';
	function Courier() {
		return {
			usps : function(tracking_number, usps_id, callback) {
				var usps = usps_id || usps_id;
				var courierUsps = new couriers.CourierUSPS(tracking_number, usps);
				courierUsps.track(callback);
			},

			hkpost : function(tracking_number, callback) {
				var courierHKPost = new couriers.CourierHKPOST(tracking_number);
				courierHKPost.track(callback);
			},
			dpduk : function(tracking_number, callback) {
				var courierDPDUK = new couriers.CourierDPDUK(tracking_number);
				courierDPDUK.track(callback);
			}
		}
	}

	module.exports = new Courier();
}());
