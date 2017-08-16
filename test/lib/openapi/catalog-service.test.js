/**
 * OpenAPI catalog.
 *
 * @author Chris Spiliotopoulos
 */


import chai from 'chai';
import sinon from 'sinon';
import SinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import axios from 'axios';

import ApiCatalogService from '../../../src/lib/openapi/catalog-service';

chai.should();
chai.use(SinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.sandbox.create();


context('OpenAPI catalog service', () => {

  afterEach(() => {
    sandbox.restore();
  });

  context('loadByProviderId()', () => {

    it('should be rejected if an invalid catalog provider Id is requested', () => {

      try {
        const promise = ApiCatalogService.loadByProviderId('invalid');
        return promise.should.be.rejectedWith('Unsupported catalog provider');
      } catch (e) {
        throw e;
      }
    });

    it('should be able to load the API Stack catalog', () => {
      const stub = sandbox.stub(axios, 'get').resolves({
        data: []
      });

      const promise = ApiCatalogService.loadByProviderId('apistack');
      return Promise.all([
        stub.should.have.been.calledOnce,
        stub.should.have.been.calledWith('http://theapistack.com/apis.json'),
        promise.should.be.fulfilled
      ]);

    });

    it('should be able to load the APIs Guru catalog', () => {

      const stub = sandbox.stub(axios, 'get').resolves({
        data: []
      });

      const promise = ApiCatalogService.loadByProviderId('apis.guru');
      return Promise.all([
        stub.should.have.been.calledOnce,
        stub.should.have.been.calledWith('https://api.apis.guru/v2/list.json'),
        promise.should.be.fulfilled
      ]);

    });

  });


  context('loadByUrl()', () => {

    it('should be able to load a catalog collection from a target URL', () => {

      const stub = sandbox.stub(axios, 'get').resolves({
        data: []
      });

      const url = 'http://theapistack.com/apis/3scale/apis.json';

      const promise = ApiCatalogService.loadByUrl(url);

      return Promise.all([
        stub.should.have.been.calledOnce,
        stub.should.have.been.calledWith('http://theapistack.com/apis/3scale/apis.json'),
        promise.should.be.fulfilled
      ]);

    });

  });


});
