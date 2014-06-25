var cheerio = require('cheerio');
var _ = require('lodash');
var dateFormat = require('dateformat');
var parseString = require('xml2js').parseString;

'use strict';
function buildCheckpoint(country, message, checkpoint_time){
  return {
    country_name : country,
    message : message,
    checkpoint_time : checkpoint_time
  }
};

function parserUSPS(data, callback){
  parseString(data, function(err, result){
    if(err) callback(err);
    var result_summary = result.TrackResponse.TrackInfo[0].TrackSummary[0];
    var date = dateFormat(new Date(result_summary.EventDate[0] + " " + result_summary.EventTime[0]), "isoDateTime");

    var tracking_result = {};
    tracking_result.checkpoints = [buildCheckpoint(result_summary.EventCountry[0], result_summary.Event[0], date)];
    callback(null,tracking_result);
  });
};

function parserHKPOST(data, callback){
  var tracking_result = {};
  $ = cheerio.load(data);
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
    var event = "Delivered.";
  }
  var indexOfFirstAppearenceDate = content[1].search(/on.*\.$/i) + 2;
  var date = dateFormat(new Date(content[1].substring(indexOfFirstAppearenceDate, content[1].length - 1)), "isoDateTime");

  var checkpoint = buildCheckpoint(destination, event, date);
  tracking_result.checkpoints = [checkpoint];
  callback(null,tracking_result);
};

function parserDPDUK(data, callback){
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


exports.parserUSPS = parserUSPS;
exports.parserHKPOST = parserHKPOST;
exports.parserDPDUK = parserDPDUK;
