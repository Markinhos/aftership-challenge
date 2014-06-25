var parseString = require('xml2js').parseString;

(function(){
  'use strict'
  function CourierUSPS(tracking_number){


    this.user_id = '461APPLE6863';

    this.paramContent = '<TrackFieldRequest USERID="' + this.user_id +'">' +
                        '<TrackID ID="'+ tracking_number + '"></TrackID>' +
                        '</TrackFieldRequest>';

    this.options = {
      host: 'production.shippingapis.com',
      port: 80,
      path: '/ShippingAPITest.dll?API=TrackV2&XML=' + encodeURIComponent(this.paramContent),
      method: 'GET'
    };

    this.parse = function parserUSPS(data, callback){
      parseString(data, function(err, result){
        if(err) callback(err);
        var result_summary = result.TrackResponse.TrackInfo[0].TrackSummary[0];
        var date = dateFormat(new Date(result_summary.EventDate[0] + " " + result_summary.EventTime[0]), "isoDateTime");

        var tracking_result = {};
        tracking_result.checkpoints = [buildCheckpoint(result_summary.EventCountry[0], result_summary.Event[0], date)];
        callback(null,tracking_result);
      });
    };

    var self = this;
    return {
      track : function(callback){
        fetchData(self.options, null, function(err, res){
          if(err) console.log(err);
          parserUSPS(res, callback);
        });
      }
    }
  }

  module.exports.CourierUSPS = CourierUSPS;
}());
