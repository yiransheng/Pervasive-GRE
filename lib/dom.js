// requires
var $ = require("jquery-browserify");
var Handlebars = require("handlebars");


// regExps
var ignoreTags = /^(script|img|style|pgre|textarea|input)$/i;
var ignoreClasses = /^(pgre)$/i;
   
// functions
var grabText = function(elem, parent) {
    // preserve context  
    return (function(elem, parent){  
        elem = elem || document.body;

        if (elem.nodeType == 1 && 
            !ignoreTags.test(elem.tagName) && 
            !ignoreClasses.test(elem.className)) {
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

var highlightWords = function(gre_words, pgre) {
    var node,
        parent,
        newNode,
        word,
        nWord,
        matches,
        span,
        n = 0;
    for (var j=0, jlen=gre_words.length;j<jlen;j++) {
        matches = gre_words[j].matches, 
        i = gre_words[j].index;
        for (word in matches) {
            node = pgre.texts[i].node;
            parent = pgre.texts[i].parent;
            nWord = matches[word];
            newNode = document.createElement("pgre");
            span = 
                '<a name="#pgre'+n+'"></a><span class="pgre-highlight hint hint--top" data-hint="' 
                + pgre.wordDef(word, nWord)
                +'">'+word+'</span>';
            newNode.innerHTML = node.data.replace(word,span); 
            try {
                parent.replaceChild(newNode, node);
                pgre.words[word] = nWord;
                n++;
            } catch (e) {
                // console.log(parent);
                // console.log(node);
            }
        }
    }
};

var _bindMethods = function(obj, methods) {
    var prop, fn;
    methods = methods ? methods.split(/\s+/) : Object.keys(obj);
    for (var i=0; i<methods.length; i++) {
        prop = methods[i];
        fn = obj[prop];
        if (fn instanceof Function) {
            obj[prop] = function() {
                return fn.apply(obj, arguments);    
            }
        }
    }
    return obj
};

// Objects
var wordModelView = {

    word : null,

    def : null,

    original : null,
    
    urls : {
        google : "",
        wikipedia : "",
        thesaurus : ""    
    },
    
    init : function(dom_pgre) {
        _bindMethods(this);
        this.template = Handlebars.templates["rightClickMenu"];        
        this.elem = "#pgre";
        if (dom_pgre) {
            this.set(dom_pgre);
        } else {
            this.set($(".pgre-highlight:first")[0]);
        }
        var self = this;
        $(".pgre-highlight").each(function() {
            this.oncontextmenu = function (e){
                if (e.button == 2){
                    e.stopPropagation();
                    e.preventDefault();
                    self.set(e.target).render();
                    $(self.elem).css({
                        left: (e.pageX + "px"),
                        top: (e.pageY + "px")
                    }).show();
                }
            };
        });
        $("body").click(function(){
            $(self.elem).fadeOut("fast");
        });
        return this
    },

    set : function(dom_pgre) {
        if (!$(dom_pgre).hasClass("pgre-highlight")) return this;
        var data = $(dom_pgre).attr("data-hint")
            .split(" : ");
        this.word = data[0];
        this.def = data[1];
        this.original = $(dom_pgre).text();
        this.genUrl();
        return this
    }, 

    genUrl : function() {
        this.urls.google = "http://www.google.com/search?q=" + this.word;
        this.urls.wikipedia = "http://en.wikipedia.org/wiki/" + this.word;
        this.urls.thesaurus = "http://thesaurus.com/browse/" + this.word; 
        return this
    }, 

    toJSON : function() {
        return {
            word : this.word,
            def : this.def, 
            original : this.original, 
            urls : this.urls
        }
    },

    render : function() {
        $(this.elem).html(this.template(this.toJSON()));
        return this;
    }
    
};

//precompiled handlebar codes
(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['rightClickMenu'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"pgre-right-click\">\n    <ul>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.google)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "' target='_blank'>Google</a></li>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.wikipedia)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "' target='_blank'>Wikipedia</a></li>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.thesaurus)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "' target='_blank'>Thesaurus</a></li>\n    </ul>\n</div>\n";
  return buffer;
  });
})();


exports.grabText = grabText;
exports.highlightWords = highlightWords;
exports.wordModelView = function(dom_pgre) {
    return Object.create(wordModelView).init(dom_pgre);
};
