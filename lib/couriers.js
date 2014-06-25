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
          if(err) callback(err);
          self.parse(res, callback);
        });
      }
    }
  };

  function CourierHKPOST(tracking_number){

    this.data = 'tracknbr=' + tracking_number + '&submit=Enter';

    this.options = {
      host: 'app3.hongkongpost.hk',
      port: 80,
      path: '/CGI/mt/mtZresult.jsp',
      method: 'POST',
      headers : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': this.data.length
      }
    };

    this.getFieldsFromHTMLText= function(html_text){
      var match = html_text.match(/Destination.*\r\n.*\./);

      if(match === null){
        console.log("ERROR cannot find match " + match);
        throw("Cannot be parsed");
      }

      var content = match[0].split('\r\n');

      //Get fields from html text
      var destination = this.getDestinationFromContent(content[0]);
      var event = this.getEventFromContent(content[1]);
      var date = this.getDateFromContent(content[1]);

      return buildCheckpoint(destination, event, date);
    };

    this.getEventFromContent = function(text){
      if (text.indexOf('delivered') > -1){
        return "Delivered.";
      }
    };

    this.getDateFromContent = function(text){
      var indexOfFirstAppearenceDate = text.search(/on.*\.$/i) + 2;
      var date = toISODateTime(text.substring(indexOfFirstAppearenceDate, text.length - 1));
      return date;
    };

    this.getDestinationFromContent = function(text){
      return text.split('-')[1].trim();
    }

    this.parse = function (data, callback){
      var tracking_result = {};

      var $ = cheerio.load(data);

      var content = $('#clfContent').text();

      try{
        var checkpoint = this.getFieldsFromHTMLText(content);
      }
      catch(err){
        callback("Error parsing " + err);
      }

      tracking_result.checkpoints = [checkpoint];
      callback(null,tracking_result);
    };

    var self = this;
    return {
      track : function(callback){
        fetchData(self.options, self.data, function(err, res){
          if(err) callback(err);
          self.parse(res, callback);
        });
      }
    }
  };

  function CourierDPDUK(tracking_number){

    var reference = encodeURIComponent('=' + tracking_number);
    var DPDUK_HOST = 'http://www.dpd.co.uk';
    var DPDUK_PATH_GET_SESSION = '/esgServer/shipping/shipment/_/parcel/?filter=id&searchCriteria=deliveryReference';

    this.endpoint_session = DPDUK_HOST + DPDUK_PATH_GET_SESSION + reference;

    this.parse = function(data, callback){
      var tracking_result = {};
      var checkpoints = this.parseCheckpoint(JSON.parse(data).obj.trackingEvent);
      tracking_result.checkpoints = this.sortTrackingResults(checkpoints);
      callback(null, tracking_result);
    };

    this.parseCheckpoint = function(tracking_events){
      var checkpoints = [];
      _(tracking_events).each(function(tracking_event){
        checkpoints.push(
          buildCheckpoint(
            tracking_event.trackingEventLocation,
            tracking_event.trackingEventStatus,
            dateFormat(new Date(tracking_event.trackingEventDate), "isoUtcDateTime").slice(0,-1)
        ));
      });
      return checkpoints;
    };

    this.sortTrackingResults = function(tracking_checkpoints){
      return _.sortBy(tracking_checkpoints, function(checkpoint){
        return checkpoint.checkpoint_time;
      });
    };

    var self = this;
    return {
      track: function(callback){
        getData(self.endpoint_session, function(err, res){
          if(err) callback(err);

          var result_json = JSON.parse(res);
          var parcelCode = result_json.obj.parcel[0].parcelCode;

          var options = {
            host: 'www.dpd.co.uk',
            port: 80,
            path: '/esgServer/shipping/delivery/?parcelCode=' + parcelCode + '&_=1403634885287',
            method: 'GET',
            headers: {
                cookie: 'tracking=' + result_json.obj.searchSession
            }
          };

          fetchData(options, null, function(err, res_tracking){
            if(err) callback(err);
            self.parse(res_tracking, callback);
          });
        });
      }
    }
  };


  module.exports.CourierUSPS = CourierUSPS;
  module.exports.CourierHKPOST = CourierHKPOST;
  module.exports.CourierDPDUK = CourierDPDUK;
}());
