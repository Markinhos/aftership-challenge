var http = require('http');
var parseString = require('xml2js').parseString;
var dateFormat = require('dateformat');
var cheerio = require('cheerio');

(function() {
	function Courier() {

		this.download = function(options, data, callback){
			var req = http.request(options, function(res){
				//console.log('STATUS: ' + res.statusCode);
				//console.log('HEADERS: ' + JSON.stringify(res.headers));
				res.setEncoding('utf8');

				var body = '';
				res.on('data', function (chunk) {
					body += chunk;
				});

				res.on('end', function() {
					callback(null, body);
				});

			});

			req.on('error', function(error){
				console.log('Got error ' +  error.message);
				callback(error.message);
			});

			if(options.method === 'POST'){
				req.write(data);
			}

			req.end();
		}

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

			this.download(options, null, function(err, data){
				if(err) callback(err);
				parseString(data, function(err, result){
					var result_summary = result.TrackResponse.TrackInfo[0].TrackSummary[0];
					var date = dateFormat(new Date(result_summary.EventDate[0] + " " + result_summary.EventTime[0]), "isoDateTime");
					var tracking_summary = {
						country_name : result_summary.EventCountry[0],
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
			this.download(options, data, function(err, res){
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

		this.dpduk = function(tracking_number) {
			var tracking_result = {}; // save your result to this object

			// do your job here
			return tracking_result;

		};
	}

	module.exports = new Courier();
}());
