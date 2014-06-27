var should = require('should'),
	_ = require('underscore'),
	Courier = require('../lib/index');

describe('Test: .is', function() {

	// Courier: http://www.usps.com
	// Hints: You can apply the API from their web site
	// Time need: less than an hour if you have the api key

	describe('Track @ usps', function() {

		var tests = require('./test_data/usps').tests;

		for(var x in tests){
			it('Expect ' + tests[x].tracking_num + ' return true', function(done) {
				var result = Courier.usps(tests[x].tracking_num, '461APPLE6863', function(err, result){
					if(err) done(err);

					result.should.eql(tests[x].tracking_result);
					done();
				});
			});
		}
	});

	// Courier: http://www.hongkongpost.com/
	// Hints: There is no official API from hongkongpost, but you may use web or other method to get the result easily.
	// Time need: less than an hour if you find the correct way

	describe('Track @ hkpost', function() {

		var tests = require('./test_data/hkpost').tests;


		for(var x in tests){
			it('Expect ' + tests[x].tracking_num + ' return true', function(done) {
				this.timeout(10000);
				var result = Courier.hkpost(tests[x].tracking_num, function(err, result){
					if(err) done(err);

					result.should.eql(tests[x].tracking_result);
					done();
				});
			});
		}
	});

	describe('Track @ dpduk(\'15502370264989N\')', function() {
		// Courier: http://www.dpd.co.uk
		// Hints: Not that easy, if you can't find the magic in the cookies
		// Time need: We spent two days to dig out the magic. Once you know it, can be done within 2 hours.

		var tests = require('./test_data/dpduk').tests;

		for(var x in tests){
			it('Expect ' + tests[x].tracking_num + ' return true', function(done) {
				this.timeout(10000);
				var result = Courier.dpduk(tests[x].tracking_num, function(err, result){
					if(err) done(err);

					result.should.eql(tests[x].tracking_result);
					done();
				});
			});
		}

	});
});
