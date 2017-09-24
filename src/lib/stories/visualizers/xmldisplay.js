// public

function LoadXMLUrl(ParentElementID, url) {
  $.get(url, (xmlString) => {
    LoadXMLString(ParentElementID, xmlString);
  }, 'xml');

  return true;
}

function LoadXMLString(ParentElementID, xmlString) {
  const xmlDoc = CreateXMLDOM(xmlString);
  return LoadXMLDom(ParentElementID, xmlDoc);
}

function LoadXMLDom(ParentElementID, xmlDoc) {
  const xmlHolderElement = document.getElementById(ParentElementID);
  if (!xmlHolderElement || !xmlDoc) {
    return false;
  }

  xmlHolderElement.innerHTML = '';

  return ShowXML(xmlHolderElement, xmlDoc.documentElement, 0);
}

if ($) {
  $.fn.xmlDisplay = function(xmlString) {
    this.each((_i, element) => {
      const $e = $(element);
      let id = $e.attr('id');

      if (!id) {
        // ensure the element has an ID
        id = `xmlDisplay-${Math.random()}`;
        $e.attr('id', id);
      }

      LoadXMLString(id, xmlString);
    });
  };
}

// private

function CreateXMLDOM(xmlString) {
  if (window.ActiveXObject) {
    // IE9 has DOMParser but not .parseFromString
    const xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.loadXML(xmlString);
    return xmlDoc;
  } else if (document.implementation && document.implementation.createDocument) {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, 'text/xml');
  }
  return null;

}

let IDCounter = 1;
const NestingIndent = 15;
function ShowXML(xmlHolderElement, rootNode, indent) {
  if (rootNode == null || xmlHolderElement == null) {
    return false;
  }

  let Result = true;
  const TagEmptyElement = document.createElement('div');
  TagEmptyElement.className = 'Element';
  TagEmptyElement.style.position = 'relative';
  TagEmptyElement.style.left = `${NestingIndent}px`;

  let ClickableElement = AddTextNode(TagEmptyElement, '+', 'Clickable');
  ClickableElement.onclick = function() {
    ToggleElementVisibility(this);
  };
  ClickableElement.id = `div_empty_${IDCounter}`;

  AddTextNode(TagEmptyElement, '<', 'Utility');
  AddTextNode(TagEmptyElement, rootNode.nodeName, 'NodeName');
  for (var i = 0; rootNode.attributes && i < rootNode.attributes.length; ++i) {
    var CurrentAttribute = rootNode.attributes.item(i);
    AddTextNode(TagEmptyElement, ` ${CurrentAttribute.nodeName}`, 'AttributeName');
    AddTextNode(TagEmptyElement, '=', 'Utility');
    AddTextNode(TagEmptyElement, `"${CurrentAttribute.nodeValue}"`, 'AttributeValue');
  }

  AddTextNode(TagEmptyElement, '> </', 'Utility');
  AddTextNode(TagEmptyElement, rootNode.nodeName, 'NodeName');
  AddTextNode(TagEmptyElement, '>', 'Utility');
  xmlHolderElement.appendChild(TagEmptyElement);
  $(TagEmptyElement).hide();

  const TagElement = document.createElement('div');
  TagElement.className = 'Element';
  TagElement.style.position = 'relative';
  TagElement.style.left = `${NestingIndent}px`;
  ClickableElement = AddTextNode(TagElement, '-', 'Clickable');
  ClickableElement.onclick = function() {
    ToggleElementVisibility(this);
  };
  ClickableElement.id = `div_content_${IDCounter}`;
  ++IDCounter;
  AddTextNode(TagElement, '<', 'Utility');
  AddTextNode(TagElement, rootNode.nodeName, 'NodeName');

  for (var i = 0; rootNode.attributes && i < rootNode.attributes.length; ++i) {
    var CurrentAttribute = rootNode.attributes.item(i);
    AddTextNode(TagElement, ` ${CurrentAttribute.nodeName}`, 'AttributeName');
    AddTextNode(TagElement, '=', 'Utility');
    AddTextNode(TagElement, `"${CurrentAttribute.nodeValue}"`, 'AttributeValue');
  }
  AddTextNode(TagElement, '>', 'Utility');
  TagElement.appendChild(document.createElement('br'));
  let NodeContent = null;
  for (var i = 0; rootNode.childNodes && i < rootNode.childNodes.length; ++i) {
    if (rootNode.childNodes.item(i).nodeName != '#text') {
      Result &= ShowXML(TagElement, rootNode.childNodes.item(i), indent + 1);
    } else {
      NodeContent = rootNode.childNodes.item(i).nodeValue;
    }
  }
  if (rootNode.nodeValue) {
    NodeContent = rootNode.nodeValue;
  }
  if (NodeContent) {
    const ContentElement = document.createElement('div');
    ContentElement.style.position = 'relative';
    ContentElement.style.left = `${NestingIndent}px`;
    AddTextNode(ContentElement, NodeContent, 'NodeValue');
    TagElement.appendChild(ContentElement);
  }
  AddTextNode(TagElement, ' </', 'Utility');
  AddTextNode(TagElement, rootNode.nodeName, 'NodeName');
  AddTextNode(TagElement, '>', 'Utility');
  xmlHolderElement.appendChild(TagElement);

  return Result;
}

function AddTextNode(ParentNode, Text, Class) {
  const NewNode = document.createElement('span');

  if (Class) {
    NewNode.className = Class;
  }
  if (Text) {
    NewNode.appendChild(document.createTextNode(Text));
  }
  if (ParentNode) {
    ParentNode.appendChild(NewNode);
  }

  return NewNode;
}

function ToggleElementVisibility(Element) {
  if (!Element|| !Element.id) {
    return;
  }

  try {
    var ElementType = Element.id.slice(0, Element.id.lastIndexOf('_') + 1);
    var ElementID = parseInt(Element.id.slice(Element.id.lastIndexOf('_') + 1));
  } catch (e) {
    return;
  }

  let ElementToHide = null;
  let ElementToShow = null;
  if (ElementType == 'div_content_') {
    ElementToHide = `div_content_${ElementID}`;
    ElementToShow = `div_empty_${ElementID}`;
  } else if (ElementType == 'div_empty_') {
    ElementToShow = `div_content_${ElementID}`;
    ElementToHide = `div_empty_${ElementID}`;
  }

  ElementToHide = document.getElementById(ElementToHide);
  ElementToShow = document.getElementById(ElementToShow);

  if (ElementToHide) {
    ElementToHide = ElementToHide.parentNode;
  }
  if (ElementToShow) {
    ElementToShow = ElementToShow.parentNode;
  }

  $(ElementToHide).hide();
  $(ElementToShow).show();
}


export default LoadXMLString;
