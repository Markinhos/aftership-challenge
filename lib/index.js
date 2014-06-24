var parseString = require('xml2js').parseString;
var dateFormat = require('dateformat');
var cheerio = require('cheerio');
var _ = require('lodash');
var countryLookup = require('country-data').lookup;
var downloadPage = require('./core_request').downloadPage;

(function() {
	function Courier() {

		this.buildCheckpoint = function(country_code, message, checkpoint_time){
			return {
				country_name : country_code,
				"message" : message,
				checkpoint_time : checkpoint_time
			}
		}

		this.usps = function(tracking_number, callback) {
			var tracking_result = {};
			var user_id = '461APPLE6863';
			var paramContent = '<TrackFieldRequest USERID="' + user_id +'">' +
    											'<TrackID ID="'+ tracking_number + '"></TrackID>' +
													'</TrackFieldRequest>';

			var options = {
			  host: 'production.shippingapis.com',
			  port: 80,
			  path: '/ShippingAPITest.dll?API=TrackV2&XML=' + encodeURIComponent(paramContent),
			  method: 'GET'
			};

			downloadPage(options, null, function(err, data){
				if(err) callback(err);
				parseString(data, function(err, result){
					var result_summary = result.TrackResponse.TrackInfo[0].TrackSummary[0];
					var date = dateFormat(new Date(result_summary.EventDate[0] + " " + result_summary.EventTime[0]), "isoDateTime");

					console.log('countries ' + JSON.stringify(require('country-data').countries.US));
					var tracking_summary = {
						country_name : countryLookup.countries({ name :result_summary.EventCountry[0]})[0],
						message : result_summary.Event[0],
						checkpoint_time : date
					};
					tracking_result.checkpoints = [tracking_summary];
					callback(null,tracking_result);
				});
			});

		};

		this.hkpost = function(tracking_number, callback) {
			var tracking_result = {}; // save your result to this object

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
			var self = this;
			downloadPage(options, data, function(err, res){
				if(err) callback(err);
				$ = cheerio.load(res);
				var content = $('#clfContent').text();
				var match = content.match(/Destination.*\r\n.*\./);
				if(match === null){
					console.log("ERROR cannot find match " + content);
					throw "Not found";
				}
				else{
					content = match[0].split('\r\n')
				}
				var destination = content[0].split('-')[1].trim();


				if (content[1].indexOf('delivered') > -1){
					var event = "Delivered";
				}
				var indexOfFirstAppearenceDate = content[1].search(/on.*\.$/i) + 2;
				var date = dateFormat(new Date(content[1].substring(indexOfFirstAppearenceDate, content[1].length - 1)), "isoDateTime");

				var checkpoint = self.buildCheckpoint(destination, event, date);
				tracking_result.checkpoints = [checkpoint];
				callback(null,tracking_result);
			});

		};

		this.dpduk = function(tracking_number, callback) {
			var tracking_result = {}; // save your result to this object
			tracking_result.checkpoints = []

			var data = 'tracknbr=' + tracking_number + '&submit=Enter';

			//$.get('http://www.dpd.co.uk/esgServer/shipping/delivery/?parcelCode=15502370264989*16810&_=1403634885287', function(data) { console.log(data)})
			var reference = encodeURIComponent('=' + tracking_number);
			var options = {
				host: 'www.dpd.co.uk',
				port: 80,
				path: '/esgServer/shipping/shipment/_/parcel/?filter=id&searchCriteria=deliveryReference' + reference,
				method: 'GET'
			};

			var self = this;

			downloadPage(options, null, function(err, res){
				if(err) callback(err);

				var result_json = JSON.parse(res);
				var parcelCode = result_json.obj.parcel[0].parcelCode;

				var options2 = {
					host: 'www.dpd.co.uk',
					port: 80,
					path: '/esgServer/shipping/delivery/?parcelCode='+parcelCode+'&_=1403634885287',
					method: 'GET',
					headers: {
							cookie: 'tracking=' + result_json.obj.searchSession
					}
				};

				downloadPage(options2, null, function(err, res){
					if(err) callback(err);
					var result2_json = JSON.parse(res);
					var checkpoints = []
					_(result2_json.obj.trackingEvent).each(function(tracking_event){
						checkpoints.push(self.buildCheckpoint(tracking_event.trackingEventLocation, tracking_event.trackingEventStatus,
							dateFormat(new Date(tracking_event.trackingEventDate), "isoUtcDateTime").slice(0,-1)
						));
					});
					tracking_result.checkpoints = _.sortBy(checkpoints, function(checkpoint){
						return checkpoint.checkpoint_time;
					});
					callback(null, tracking_result);
				});
			});

		};
	}

	module.exports = new Courier();
}());
