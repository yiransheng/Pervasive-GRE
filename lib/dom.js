
var ignoreTags = /^(script|img|style|pgre|textarea)$/;
var ignoreClasses = /^(pgre)$/;
   

var grabText = function(elem, parent) {
    // preserve context  
    return (function(elem, parent){  
        elem = elem || document.body;

        if (elem.nodeType == 1 && 
            !ignoreTags.test(elem.tagName.toLowerCase()) && 
            !ignoreClasses.test(elem.className.toLowerCase())) {
            for (var i=0, children=elem.childNodes;i<children.length;i++) {
                grabText(children[i], elem)    
            }
        } else if (elem.nodeType == 3) {
            this.data.push({node:elem, parent:parent});
        }
        return this.data;
    }).apply(grabText, [elem, parent]);
};

grabText.data = [];

exports.grabText = grabText;

