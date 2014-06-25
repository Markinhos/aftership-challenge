var cheerio = require('cheerio');
var _ = require('lodash');
var dateFormat = require('dateformat');
var parseString = require('xml2js').parseString;
var fetchData = require('./transport').fetchData;
var getData = require('./transport').getData;

(function(){
  'use strict'
  function buildCheckpoint(country, message, checkpoint_time){
    return {
      country_name : country,
      message : message,
      checkpoint_time : checkpoint_time
    }
  };

  function toISODateTime(date){
    return dateFormat(new Date(date), "isoDateTime")
  }

  function CourierUSPS(tracking_number, usps_id){


    this.user_id = (typeof usps_id === "undefined") ? process.env.USPS_ID : usps_id;

    this.param_content = '<TrackFieldRequest USERID="' + this.user_id +'">' +
                        '<TrackID ID="'+ tracking_number + '"></TrackID>' +
                        '</TrackFieldRequest>';

    var USPS_HOST = 'http://production.shippingapis.com';
    var USPS_PATH = '/ShippingAPITest.dll?API=TrackV2&XML=';


    this.endpoint = USPS_HOST + USPS_PATH + encodeURIComponent(this.param_content);

    this.getCheckpointFieldsFromResult = function(track_response){
      var result_summary = track_response.TrackResponse.TrackInfo[0].TrackSummary[0];
      var country = result_summary.EventCountry[0];
      var message = result_summary.Event[0];
      var date = toISODateTime(result_summary.EventDate[0] + " " + result_summary.EventTime[0]);

      return buildCheckpoint(country, message, date);
    };

    var self = this;
    this.parse = function(data, callback){
      parseString(data, function(err, result){
        if(err) callback(err);

        var tracking_result = {};

        try{
          var checkpoint = self.getCheckpointFieldsFromResult(result);
        }
        catch(err){
          callback("Error parsing " + err);
        }

        tracking_result.checkpoints = [checkpoint];
        callback(null,tracking_result);
      });
    };

    return {
      track : function(callback){
        getData(self.endpoint, function(err, res){
          if(err) console.log(err);
          self.parse(res, callback);
        });
      }
    }
  };

  function CourierHKPOST(tracking_number){

    var data = 'tracknbr=' + tracking_number + '&submit=Enter';

    this.options = {
      host: 'app3.hongkongpost.hk',
      port: 80,
      path: '/CGI/mt/mtZresult.jsp',
      method: 'POST',
      headers : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    };

    this.parse = function (data, callback){
      var tracking_result = {};
      var $ = cheerio.load(data);
      var content = $('#clfContent').text();
      var match = content.match(/Destination.*\r\n.*\./);
      if(match === null){
        console.log("ERROR cannot find match " + content);
        callback("Cannot be parsed");
      }
      else{
        content = match[0].split('\r\n')
      }
      var destination = content[0].split('-')[1].trim();


      if (content[1].indexOf('delivered') > -1){
        var event = "Delivered.";
      }
      var indexOfFirstAppearenceDate = content[1].search(/on.*\.$/i) + 2;
      var date = toISODateTime(content[1].substring(indexOfFirstAppearenceDate, content[1].length - 1));

      var checkpoint = buildCheckpoint(destination, event, date);
      tracking_result.checkpoints = [checkpoint];
      callback(null,tracking_result);
    };

    var self = this;
    return {
      track : function(callback){
        fetchData(self.options, self.data, function(err, res){
          if(err) console.log(err);
          self.parse(res, callback);
        });
      }
    }
  };

  function CourierDPDUK(tracking_number){

    this.reference = encodeURIComponent('=' + tracking_number);
    this.options = {
      host: 'www.dpd.co.uk',
      port: 80,
      path: '/esgServer/shipping/shipment/_/parcel/?filter=id&searchCriteria=deliveryReference' + this.reference,
      method: 'GET'
    };

    this.parse = function(data, callback){
      var tracking_result = {};
      var result2_json = JSON.parse(data);
      var checkpoints = [];
      _(result2_json.obj.trackingEvent).each(function(tracking_event){
        checkpoints.push(buildCheckpoint(tracking_event.trackingEventLocation, tracking_event.trackingEventStatus,
          dateFormat(new Date(tracking_event.trackingEventDate), "isoUtcDateTime").slice(0,-1)
        ));
      });
      tracking_result.checkpoints = _.sortBy(checkpoints, function(checkpoint){
        return checkpoint.checkpoint_time;
      });
      callback(null, tracking_result);
    };

    var self = this;
    return {
      track: function(callback){
        fetchData(self.options, null, function(err, res){
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
            self.parse(res2, callback);
          });
        });
      }
    }
  };

  module.exports.CourierUSPS = CourierUSPS;
  module.exports.CourierHKPOST = CourierHKPOST;
  module.exports.CourierDPDUK = CourierDPDUK;
}());