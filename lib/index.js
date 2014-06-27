var couriers = require('./couriers');

(function() {
	'use strict';
	function Courier() {
		return {
			usps : function(tracking_number, usps_id, callback) {
				if (typeof usps_id === "string"){
					var courierUsps = new couriers.CourierUSPS(tracking_number, usps_id);
					courierUsps.track(callback);
				}
				else{
					//If usps_id not provided use the second param as callback
					var _callback = usps_id;
					var courierUsps = new couriers.CourierUSPS(tracking_number);
					courierUsps.track(_callback);
				}
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
