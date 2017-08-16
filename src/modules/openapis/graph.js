/**
 * OpenAPI tree.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import * as vis from 'vis';

import GraphUtils from '../../lib/utils/utils-graph';

export default (function() {

  /*
   * Private
   */
  let network;
  let $networkCanvas;
  let api;

  const _render = function(element, openapi) {

    api = openapi;

    const root = api.pathsGraph;

    console.log(root);

    const nodes = [];
    const edges = [];

    // create a network
    const container = document.getElementById('graph');
    const data = {
      nodes,
      edges
    };

    const options = {
      layout: {
        improvedLayout: true,
        hierarchical: false
      },
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          size: 18
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 2,
        shadow: true
      },
      interaction: {
        hover: true,
        selectConnectedEdges: false
      }
    };

    GraphUtils.traverseBF(root, (o) => {

      const node = {
        id: o.path,
        label: o.name,
        group: (o.name === '' ? 0 : o.group)
      };

      nodes.push(node);

      const edge = {
        from: o.parent,
        to: o.path
      };
      edges.push(edge);

    });

    network = new vis.Network(container, data, options);

    $networkCanvas = $('canvas', $(container));

    // event: on hover node
    network.on('hoverNode', () => {
      $networkCanvas.css('cursor', 'pointer');
    });

    network.on('blurNode', () => {
      $networkCanvas.css('cursor', 'default');
    });

    network.on('doubleClick', (ctx) => {

      if (!_.isEmpty(ctx.nodes)) {
        const path = ctx.nodes[0];
        _onPathDoubleClicked(path);
      }

    });

  };


  /**
   * User has double-clicked a
   * path node.
   * @type {[type]}
   */
  const _onPathDoubleClicked = function(path) {
    // dispatch the event to open the operations modal
    postal.publish({
      channel: 'openapis',
      topic: 'openapi.path.operations',
      data: {
        path
      }
    });
  };


  return {

    /*
     * Public
     */
    render: _render

  };

}());
