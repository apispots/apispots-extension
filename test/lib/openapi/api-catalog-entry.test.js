/**
 * API catalog entry.
 *
 * @author Chris Spiliotopoulos
 */


import chai from 'chai';
import sinon from 'sinon';
import SinonChai from 'sinon-chai';

import ApiCatalogEntry from '../../../src/lib/openapi/api-catalog-entry';

const should = chai.should();
chai.use(SinonChai);

const sandbox = sinon.sandbox.create();


context('OpenAPI definition', () => {

  afterEach(() => {
    sandbox.restore();
  });

  context('getProperty()', () => {
    it('should return null if property is not found', () => {

      const entry = new ApiCatalogEntry();
      entry.properties =[];

      const prop = entry.getProperty('x-custom');
      should.not.exist(prop);
    });

    it('should return a URL if property exists', () => {

      const entry = new ApiCatalogEntry();
      entry.properties =[{
        type: 'x-property',
        url: 'http://example.com'
      }];

      const prop = entry.getProperty('x-property');
      should.exist(prop);
      prop.should.equal('http://example.com');
    });
  });


});
