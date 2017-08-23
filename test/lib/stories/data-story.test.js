/**
 * Data story class.
 *
 * @author Chris Spiliotopoulos
 */


import chai from 'chai';
import sinon from 'sinon';
import SinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';

import DataStory from '../../../src/lib/stories/data-story';


chai.should();
const expect = chai.expect;
chai.use(SinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.sandbox.create();


context('Data story class', () => {

  afterEach(() => {
    sandbox.restore();
  });

  let story;

  beforeEach(() => {
    const definition = fs.readFileSync(`${__dirname}/data/basic-story.yaml`, 'utf-8');

    story = new DataStory({
      definition
    });

  });

  context('constructor()', () => {
    it('should create a new story instance with definition set', () => {
      expect(story).not.to.be.null;
      expect(story.definition).not.to.be.null;
    });
  });

  context('definition()', () => {
    it('should return a story definition document', () => {
      const definition = story.definition;
      expect(definition).not.to.be.null;
    });
  });

  context('spec()', () => {
    it('should return the Open API spec URL', () => {
      const spec = story.definition.spec;
      expect(spec).not.to.be.null;
      expect(spec).to.equal('http://petstore.swagger.io/v2/swagger.json');
    });
  });

  context('parts()', () => {
    it('should return the parts of a story', () => {
      const definition = story.definition;
      expect(definition.parts).not.to.be.null;
      expect(definition.parts).to.be.an('array');
    });
  });


});
