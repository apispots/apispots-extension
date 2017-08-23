/**
 * Story player service.
 *
 * @author Chris Spiliotopoulos
 */


import chai from 'chai';
import sinon from 'sinon';
import SinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import Swagger from 'swagger-client';

import ApiDefinition from '../../../src/lib/openapi/api-definition';
import DataStory from '../../../src/lib/stories/data-story';
import StoryPlayer from '../../../src/lib/stories/story-player';

chai.should();
chai.use(SinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.sandbox.create();


context('Story player', () => {

  afterEach(() => {
    sandbox.restore();
  });

  let story;
  let _api;

  beforeEach((done) => {
    const definition = fs.readFileSync(`${__dirname}/data/basic-story.yaml`, 'utf-8');

    story = new DataStory({
      definition
    });

    const spec = fs.readFileSync(`${__dirname}/../openapi/data/petstore.json`, 'utf-8');
    ApiDefinition.load({spec})
      .then(api => {
        _api = api;
        done();
      });
  });

  context('play()', () => {
    it('should be rejected if story is undefined', () => {
      const promise = StoryPlayer.play();
      return promise.should.be.rejectedWith('Invalid story instance');
    });

    it('should be rejected if Open API spec is invalid', () => {
      story.definition.spec = undefined;
      const promise = StoryPlayer.play(story);
      return promise.should.be.rejectedWith('Invalid Open API spec');
    });

    it.only('should be rejected if Open API spec is invalid', function() {

      this.timeout(60000);

      // return the already load API definition
      sandbox.stub(ApiDefinition, 'load').resolves(_api);

      const promise = StoryPlayer.play(story);
      return promise.should.be.fulfilled;
    });
  });


});
