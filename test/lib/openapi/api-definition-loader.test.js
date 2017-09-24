/**
 * OpenAPI loader tests.
 *
 * @author Chris Spiliotopoulos
 */


import chai from 'chai';
import sinon from 'sinon';
import SinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import jsyaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

import Swagger from 'swagger-client';
import ApiDefinitionLoader from '../../../src/lib/openapi/api-definition-loader';
import SwaggerApiDefinition from '../../../src/lib/openapi/api-definition-swagger';
import OpenApiDefinition from '../../../src/lib/openapi/api-definition-openapi';

import spec from './data/petstore.json';

chai.should();
chai.use(SinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.sandbox.create();


context('OpenAPI definition loader', () => {

  afterEach(() => {
    sandbox.restore();
  });


  context('load()', () => {
    it('should be rejected if no URI or valid spec is provided', () => {
      const promise = ApiDefinitionLoader.load();
      return promise.should.be.rejectedWith('Either a URI or a valid Swagger spec should be provided');
    });

    it('should return a valid Swagger API instance if a valid URI is provided', () => {
      const url = 'http://petstore.swagger.io/v2/swagger.json';

      const stub = sandbox.stub(Swagger, 'resolve').resolves({
        url: 'http://petstore.swagger.io/v2/swagger.json',
        errors: [],
        spec: {
          swagger: '2.0'
        },
        apis: {
          pet: {}
        }
      });

      const promise = ApiDefinitionLoader.load({url});
      return Promise.all([
        stub.should.have.been.calledOnce,
        promise.should.be.fulfilled
      ]);
    });


    it('should be able to parse a valid Swagger 2.x definition', (cb) => {

      const promise = ApiDefinitionLoader.load({spec});
      promise.then(api => {
        try {
          api.should.be.instanceof(SwaggerApiDefinition);
          cb();
        } catch (e) {
          cb(e);
        }
      });
    });


    it('should be able to parse a valid OpenAPI 3.x definition', (cb) => {

      const spec = jsyaml.safeLoad(fs.readFileSync(path.resolve(__dirname, 'data/openapi3.yaml')));

      const promise = ApiDefinitionLoader.load({spec});
      promise.then(api => {
        try {
          api.should.be.instanceof(OpenApiDefinition);
          cb();
        } catch (e) {
          cb(e);
        }
      });
    });

    it('should be rejected if an invalid spec URL is provided', function() {
      this.timeout(10000);
      const promise = ApiDefinitionLoader.load({url: 'http://petstore.swagger.io/v2/swagger.jso'});
      return promise.should.be.rejectedWith('Not Found');
    });

  });


});
