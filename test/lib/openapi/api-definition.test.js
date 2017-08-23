/**
 * OpenAPI loader.
 *
 * @author Chris Spiliotopoulos
 */


import chai from 'chai';
import sinon from 'sinon';
import SinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import Swagger from 'swagger-client';
import ApiDefinition from '../../../src/lib/openapi/api-definition';
import spec from './data/petstore.json';

chai.should();
const expect = chai.expect;
chai.use(SinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.sandbox.create();


context('OpenAPI definition', () => {

  afterEach(() => {
    sandbox.restore();
  });

  let _api;

  beforeEach(() => {
    ApiDefinition.load({spec})
      .then((api) => {
        _api = api;
      })
      .catch((e) => { throw e; });
  });


  context('load()', () => {
    it('should be rejected if no URI or valid spec is provided', () => {
      const promise = ApiDefinition.load();
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

      const promise = ApiDefinition.load({url});
      return Promise.all([
        stub.should.have.been.calledOnce,
        promise.should.be.fulfilled
      ]);
    });


    it('should return a valid Swagger API instance if a valid spec is provided', () => {

      const promise = ApiDefinition.load({spec});
      return Promise.all([
        promise.should.be.fulfilled
      ]);
    });

    it('should be rejected if an invalid spec URL is provided', function() {
      this.timeout(5000);
      const promise = ApiDefinition.load({url: 'http://petstore.swagger.io/v2/swagger.jso'});
      return promise.should.be.rejectedWith('Not Found');
    });

  });

  context('paths()', () => {
    it('should return a sorted list of paths with a list of verbs for each path', () => {
      const paths = _api.paths;
      paths.should.be.an('array');
      paths.length.should.equal(14);
      paths[0].should.have.property('verbs');
      paths[0].path.should.equal('/pet');
    });
  });

  context('path()', () => {

    it('should throw an error if no paths have been defined', () => {
      _api.spec.paths = [];

      const fn = function() {
        return _api.path();
      };

      expect(fn).to.throw('No paths have been defined in spec');
    });

    it('should throw an error if the requested path is defined', () => {
      const fn = function() {
        return _api.path('/bad');
      };

      expect(fn).to.throw('Undefined path');
    });

    it('should return the path item definition of Id is valid', () => {
      const path = _api.path('/pet');
      path.should.be.an('object');
      path.should.have.keys(['post', 'put']);
    });
  });


  context('pathsGraph()', () => {
    it('should return a tree of paths grouped at resource level', () => {
      const tree = _api.pathsGraph;
      tree.path.should.equal('/');
      tree.children.length.should.equal(3);
      tree.children[0].path.should.equal('/pet');
      tree.children[0].children[0].path.should.equal('/pet/findByStatus');
    });

  });


  context('getOperation()', () => {
    it('should return an operation definition by Id', () => {
      const op =_api.getOperation('findPetsByStatus');
      expect(op).not.to.be.empty;
      expect(op.path).to.equal('/pet/findByStatus');
      expect(op.verb).to.equal('get');
    });
  });

});
