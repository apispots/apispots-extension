/**
 * Base credentials manager
 * class.
 *
 * @author Chris Spiliotopoulos
 */

export default class CredentialsManager {

  /**
    * Returns the stored credentials for
    * a specific API spec and security entry.
    * @param  {[type]} specUrl      [description]
    * @param  {[type]} securityName [description]
    * @return {[type]}              [description]
    */
  getCredentials() {
    return Promise.reject(new Error('Should be implemented by subclasses'));
  }

}
