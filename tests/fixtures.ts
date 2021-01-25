import * as chai from 'chai';
import chaiDateTime from 'chai-datetime';
const chaiSorted = require('chai-sorted');

exports.mochaGlobalSetup = function () {
  chai.use(chaiDateTime);
  console.log('setup chai-datetime plugin');

  chai.use(chaiSorted);
  console.log('setup chai-sorted plugin');
};