tests = [
  {
    tracking_num : 'LK059460815HK',
    tracking_result : {
      checkpoints: [
        {
          country_name: 'US',
          message: 'Delivered.',
          checkpoint_time: '2014-05-27T00:00:00'
        }
      ]
    }
  },
  {
    tracking_num : 'RC933607107HK',
    tracking_result : {
      checkpoints: [
        {
          country_name: 'IT',
          message: 'In Transit.',
          checkpoint_time: '2014-05-27T00:00:00'
        }
      ]
    }
  },

  {
    tracking_num : 'RT224265042HK',
    tracking_result : {
      checkpoints: [
        {
          country_name: 'TH',
          message: 'Delivered.',
          checkpoint_time: '2014-05-28T00:00:00'
        }
      ]
    }
  }
];

exports.tests = tests;
