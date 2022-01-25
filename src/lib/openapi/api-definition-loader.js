/**
 * OpenAPI definition
 *
 * @author Chris Spiliotopoulos
 */
import Swagger from 'swagger-client';
import _ from 'lodash';
import jsyaml from 'js-yaml';

import SwaggerApiDefinition from './api-definition-swagger';
import OpenApiDefinition from './api-definition-openapi';

export default class ApiDefinitionLoader {

  /**
   * Loads a valid OpenAPI definition
   * from the provided URI and returns
   * the Swagger API instance.
   * @param  {[type]} url  [description]
   * @param  {[type]} spec [description]
   * @return {[type]}      [description]
   */
  static load({
    url,
    spec
  } = {}) {
    return new Promise((resolve, reject) => {

      try {

        // URI cannot be empty
        if (_.isEmpty(url) && _.isEmpty(spec)) {
          throw new Error('Either a URI or a valid Swagger spec should be provided');
        }

        // if spec is provided as a string,
        // convert it to an object
        if (typeof spec === 'string') {
          spec = jsyaml.load(spec);
        }

        // try to resolve the API definition
        // using either a URI or a spec
        new Swagger({
          url,
          spec
        })
          .then((swagger) => {

            // get the parsed spec instance
            const spec = swagger.spec;

            if (_.isEmpty(spec)) {
              reject(new Error('Invalid Open API specification'));
            } else {

              let api = null;

              // check the spec type
              if (_.has(spec, 'swagger')) {

                // this is the legacy Swagger 2 spec
                api = new SwaggerApiDefinition({
                  specUrl: url,
                  spec
                });

              } else if (_.has(spec, 'openapi')) {
                // this is the new OpenAPI 3 spec
                api = new OpenApiDefinition({
                  specUrl: url,
                  spec
                });

              }

              // return the API instance
              resolve(api);
            }
          }, (err) => {
            reject(new Error(err.message));
          });


      } catch (e) {
        reject(e);
      }
    });

  }


}
