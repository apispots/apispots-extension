import _ from 'lodash';

function tableify(obj, columns, parents) {
  const buf = [];
  const type = typeof obj;
  let cols;

  parents = parents || [];

  if (type !== 'object' || obj == null || obj === undefined) {
    // nothing
  } else if (~parents.indexOf(obj)) {
    return '[Circular]';
  } else {
    parents.push(obj);
  }

  if (Array.isArray(obj)) {
    if (Array.isArray(obj[0]) && obj.every(Array.isArray)) {
      buf.push('<table>', '<tbody>');
      cols = [];

      if (!_.isEmpty(obj)) {
        // 2D array is an array of rows
        obj.forEach((row, ix) => {
          cols.push(ix);

          buf.push('<tr>');

          row.forEach((val) => {
            buf.push(`<td${getClass(val)}>`, tableify(val, cols, parents), '</td>');
          });

          buf.push('</tr>');
        });
      }

      buf.push('</tbody>', '</table>');
    } else if (typeof obj[0] === 'object') {
      buf.push('<table>', '<thead>', '<tr>');

      // loop through every object and get unique keys
      const keys = {};

      if (!_.isEmpty(obj)) {
        obj.forEach((o) => {
          if (typeof o === 'object' && !Array.isArray(o)) {
            Object.keys(o).forEach((k) => {
              keys[k] = true;
            });
          }
        });
      }

      cols = Object.keys(keys);

      if (!_.isEmpty(cols)) {
        cols.forEach((key) => {
          buf.push(`<th${getClass(obj[0][key])}>`, key, '</th>');
        });
      }

      buf.push('</tr>', '</thead>', '<tbody>');

      if (!_.isEmpty(obj)) {
        obj.forEach((record) => {
          buf.push('<tr>');
          buf.push(tableify(record, cols, parents));
          buf.push('</tr>');
        });
      }

      buf.push('</tbody></table>');
    } else {
      buf.push('<table>', '<tbody>');
      cols = [];

      if (!_.isEmpty(obj)) {
        obj.forEach((val, ix) => {
          cols.push(ix);
          buf.push('<tr>', `<td${getClass(val)}>`, tableify(val, cols, parents), '</td>', '</tr>');
        });
      }

      buf.push('</tbody>', '</table>');
    }

  } else if (obj && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date)) {
    if (!columns) {
      buf.push('<table>');

      Object.keys(obj).forEach((key) => {
        buf.push('<tr>', `<th${getClass(obj[key])}>`, key, '</th>', `<td${getClass(obj[key])}>`, tableify(obj[key], false, parents), '</td>', '</tr>');
      });

      buf.push('</table>');
    } else if (!_.isEmpty(columns)) {
      columns.forEach((key) => {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          buf.push(`<td${getClass(obj[key])}>`, tableify(obj[key], false, parents), '</td>');
        } else {
          buf.push(`<td${getClass(obj[key])}>`, tableify(obj[key], columns, parents), '</td>');
        }
      });

    }
  } else {
    buf.push(obj);
  }

  if (type !== 'object' || obj == null || obj === undefined) {
    // nothing
  } else {
    parents.pop(obj);
  }

  return buf.join('');
}

function getClass(obj) {
  return ` class="${
    ((obj && obj.constructor && obj.constructor.name)
      ? obj.constructor.name
      : typeof obj || ''
    ).toLowerCase()
  }${(obj === null)
    ? ' null'
    : ''
  }"`;
}


export default tableify;
