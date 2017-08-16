
/**
 * Graph utilities
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';

export default class GraphUtils {

  /**
   * Finds a node in a tree
   * @param  {[type]} node [description]
   * @param  {[type]} path [description]
   * @return {[type]}      [description]
   */
  static findNode(node, path) {

    if (node.path === path) {
      return node;
    } else if (node.children != null) {

      let result = null;
      for (let i = 0; result == null && i < node.children.length; i += 1) {
        result = GraphUtils.findNode(node.children[i], path);
      }
      return result;
    }
    return null;
  }

  /**
   * Traverses a tree depth-first.
   * @param  {[type]} node [description]
   * @param  {[type]} func [description]
   * @return {[type]}      [description]
   */
  static traverseDF(node, func) {
    if (func) {
      func(node);
    }

    _.each(node.children, (child) => {
      GraphUtils.traverseDF(child, func);
    });
  }

  /**
   * Traverses a tree breadth-first.
   * @param  {[type]} node [description]
   * @param  {[type]} func [description]
   * @return {[type]}      [description]
   */
  static traverseBF(node, func) {
    const q = [node];
    while (q.length > 0) {
      node = q.shift();
      if (func) {
        func(node);
      }

      _.each(node.children, (child) => {
        q.push(child);
      });
    }
  }


}
