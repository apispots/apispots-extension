/**
 * Swagger API definition tests.
 *
 * @author Chris Spiliotopoulos
 */


import chai from 'chai';
import sinon from 'sinon';
import SinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import _ from 'lodash';

import ApiDefinitionLoader from '../../../src/lib/openapi/api-definition-loader';

import spec from './data/petstore.json';

const expect = chai.expect;
chai.should();
chai.use(SinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.sandbox.create();


context('Swagger API definition', () => {

  let _api = null;

  afterEach(() => {
    sandbox.restore();
  });

  before(() => {

    const promise = ApiDefinitionLoader.load({spec});
    promise.then(api => {
      _api = api;

      return Promise.resolve();
    });
  });


  context('title()', () => {
    it('should return the API title', () => {
      const title = _api.title;
      expect(title).to.not.be.null;
      expect(title).to.equal('Swagger Petstore');
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
      const api = _.cloneDeep(_api);
      api.spec.paths = [];

      const fn = function() {
        return api.path();
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

  context('operations()', () => {
    it('should return a collection of all API operations', () => {
      const operations =_api.operations;
      expect(operations).not.to.be.empty;
      expect(operations).to.be.an('array');
      expect(operations).to.have.length(20);
      expect(operations[0]).to.have.property('path');
      expect(operations[0]).to.have.property('verb');
    });
  });

  context('operationsBySummary()', () => {

    it('should return a compact list of operations by summary', () => {
      const operations =_api.operationsBySummary;
      expect(operations).not.to.be.empty;
    });
  });


  context('getOperationResponseDescription()', () => {

    it('should return the description for a response code', () => {
      const description =_api.getOperationResponseDescription('findPetsByStatus', '200');
      expect(description).to.equal('successful operation');
    });
  });

  context('getResponseSchemaDefinition()', () => {

    it('should return the schema definition of a specific respone code', () => {
      const schema =_api.getResponseSchemaDefinition('findPetsByStatus', '200');
      expect(schema).to.have.property('type', 'array');
      expect(schema).to.have.property('schema', 'Pet');
    });

    it('should return an empty schema if no response definition is mapped to status code', () => {
      const schema =_api.getResponseSchemaDefinition('findPetsByStatus', '300');
      expect(schema).to.be.empty;
    });
  });

});
