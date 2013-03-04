// requires
var $ = require("jquery-browserify");
var Handlebars = require("handlebars");


// regExps
var ignoreTags = /^(script|img|style|pgre|textarea|input)$/i;
var ignoreClasses = /^(pgre)/i;
var inlineTags = /^(a|b|i|span|strong|pgre)$/i;
var unlikelyMeaningful = /foot|header|menu|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pagination|pager|popup|button|btn|ui-/i;
   
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
        node = pgre.texts[i].node;
        parent = pgre.texts[i].parent;
        for (word in matches) {
            nWord = matches[word];
            newNode = document.createElement("pgre");
            span = 
                '<a name="pgre'+(n++)+'"></a><span class="pgre-highlight hint hint--top" data-hint="' 
                + pgre.wordDef(word, nWord)
                +'" word="'
                +nWord
                +'">'+word+'</span>';
            newNode.innerHTML = node.data.replace(word,span); 
        }
        try {
            parent.replaceChild(newNode, node);
        } catch (e) {
            console.log("Unexpeced error.");
        }
    }

    pgre.__occurrences = n+1;
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

var extractBackground = function(elem, word) {

    var text = elem.innerText;
    // just one word contained in the element, and the element is inline
    while (!(/(\S\s+\S)/.test(text)) && inlineTags.test(elem.tagName)) {
        elem = elem.parentNode;    
        text = elem.innerText;
    }

    var indicator = elem.id + elem.className;
    if (indicator.search(unlikelyMeaningful) !== -1) return "";
    return text
};

var pgreView = function(words, elem) {
    if (!words || !elem || !words.length) return;

    var template = Handlebars.templates["pgre-main"];        
    var el = $(elem);
    el.html(template({ words : words})).appendTo("body")
        .find(".pgre-dropdown").click(function(e){
            if ($(this).hasClass("pgre-dropdown-down")) {
                $(this).next().slideUp();
            } else {
                $(this).next().slideDown();
            }
            $(this).toggleClass("pgre-dropdown-down");   
        });
    $('<div id="pgre-curtain"></div>').appendTo("body").click(function(){
        $(this).hide();
        el.hide();
    });;
};

var pgreControlView = function(pgre) {
    var x = '<div class="pgre-control-container"><div style="display:block;width:200px;float:right"><span class="pgre-control-currword">pervasive</span><a href="#" class="pgre-control-btn"></a><a href="#"><div class="pgre-control-arrow-up"></div></a><a href="#"><div class="pgre-control-arrow-down"></div></a></div></div>';
    x = $(x).appendTo("body");
    pgre.__occurrences = $("pgre").length-1;
    var routing = function(e){
        if (!e) {
            var anchor = pgre.prevWord();
            var word = $('a[name="'+anchor+'"]').next().attr("word");
            $(".pgre-control-currword:first").html(word);
            return
        }
        e.preventDefault();
        var repeat = 0;
        if(e.target.className == "pgre-control-btn") {
            $("#pgre-container").toggle();
            $("#pgre-curtain").toggle();
        } else if (e.target.className == "pgre-control-arrow-down") {
            var word, anchor;
            while(!word && repeat<pgre.__occurrences) {
                repeat++;
                anchor = pgre.nextWord();
                word = $('a[name="'+anchor+'"]').next().attr("word");
            }
            document.location.hash = anchor;
            $(".pgre-control-currword:first").html(word);
        } else {
            var word, anchor;
            while(!word && repeat<pgre.__occurrences) {
                repeat++;
                anchor = pgre.prevWord();
                word = $('a[name="'+anchor+'"]').next().attr("word");
            }
            document.location.hash = anchor;
            $(".pgre-control-currword:first").html(word);
        }
    };
    x.find("a").click(routing);
    routing();
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
    + "'>Google</a></li>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.wikipedia)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "'>Wikipedia</a></li>\n      <li><a href='"
    + escapeExpression(((stack1 = ((stack1 = depth0.urls),stack1 == null || stack1 === false ? stack1 : stack1.thesaurus)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "'>Thesaurus</a></li>\n    </ul>\n</div>\n";
  return buffer;
  });
templates['pgre-main'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n<div class=\"pgre-word-wrapper\">\n  <p class=\"pgre-word\">";
  if (stack1 = helpers.word) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.word; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n  <p class=\"pgre-def\">";
  if (stack1 = helpers.def) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.def; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "></p>\n  <div class=\"pgre-dropdown\">Example sentences on this page ("
    + escapeExpression(((stack1 = ((stack1 = depth0.sentences),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</div>\n  <div class=\"pgre-sentences\">\n  ";
  stack2 = helpers.each.call(depth0, depth0.sentences, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </div>\n</div>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "";
  buffer += "\n    <p>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</p>\n  ";
  return buffer;
  }

  buffer += "<div class='pgre-title'>Pervasive GRE detected the following words on this page:</div>\n";
  stack1 = helpers.each.call(depth0, depth0.words, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n";
  return buffer;
  });
})();

exports.grabText = grabText;
exports.highlightWords = highlightWords;
exports.pgreView = pgreView;
exports.pgreControlView = pgreControlView;
exports.extractBackground = extractBackground;
exports.wordModelView = function(dom_pgre) {
    return Object.create(wordModelView).init(dom_pgre);
};
