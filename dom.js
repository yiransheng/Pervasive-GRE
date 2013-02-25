
var config = {
   
    ignoreTags : ["script", "img", "style"]
   
};

var parseDom = function(elem, parent, handleTextNode) {
    // preserve context  
    return (function(elem, parent, handleTextNode){  
        handleTextNode = elem instanceof Function ? elem : (parent instanceof Function ? parent : handleTextNode);
        elem = elem || document.body;

        if (elem.nodeType == 1 && 
            config.ignoreTags.indexOf(elem.tagName) != -1) {
            for (var i=0, children=elem.childNodes;i<children.length;i++) {
                parseDom(children[i], elem, handleTextNode)    
            }
            
        } else if (elem.nodeType == 3) {
            handleTextNode(elem.data, parent);
        }
        return this
    }).apply(parseDom, [elem, parent, handleTextNode]);
};

exports.parse_dom = function(handleTextNode, opts) {
    if (opts) {
        for (var k in opts) {
            config[k] = opts[k];     
        }    
    }

    return parseDom(handleTextNode)
};



