
// utility functions
function forEach(obj, iterator, context) {
    var key;
    context = context || this;
    if (obj) {
        if (obj instanceof Function){
            for (key in obj) {
                if (key != 'prototype' && key != 'length' && key != 'name' && obj.hasOwnProperty(key)) {
                iterator.call(context, obj[key], key);
                }
            }
        } else if (obj instanceof Array) {
            for (key = 0; key < obj.length; key++)
                iterator.call(context, obj[key], key);
        } else {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator.call(context, obj[key], key);
                }
            }
        }
    } 
    return obj;
}

function map(arraylike, fn, context) {
    context = context || this;
    var i, ret = [];
    for (i=0;i<arraylike.length;i++) {
        ret.push(fn.call(context, arraylike[i]))   
    }
    return ret
}

function toArray(obj, name) {
    name = name || "name";
    var key, prop, ret = [], el;
    for (key in obj) {
        el = {};
        el[name] = key;
        for (prop in obj[key]) {
            el[prop] = obj[key][prop];
        }
        ret.push(el);
    }
    return ret
}

var pgre = Object.create({
    
    vocab : null,

    init : function(where) {
        this.where = where = (where || "background");
        this.loadVocab();

        if (where == "background") {
            this.wordChecker = Typo.typo();
            var self = this;
            chrome.extension.onConnect.addListener(function(port) {
                port.onMessage.addListener(
                    function(msg) {
                        var matches, res = [];
                        for (var i=0, ilen=msg.length;i<ilen;i++) {
                            matches = self.lookupTextBlob(msg[i].contents);
                            if (Object.keys(matches).length) {
                                res.push({matches: matches, index: msg[i].index});
                            }
                        }
                        port.postMessage(res);
                });
            });
        } else {
            // Flag the DOM to prevent further content scripts execution, also place
            // holder for contextmenu
            var domFlag = document.createElement("pgre");
            domFlag.id = "pgre";
            document.body.appendChild(domFlag);
            var self = this;
            this.texts = pgreDOM.grabText();
            this.port = chrome.extension.connect({name: "pgre-connection"});
            this.port.onMessage.addListener(function(msg) {
                pgreDOM.highlightWords(msg, self);
                pgreDOM.wordModelView();
                self.storeWords.call(self, msg);
                pgreDOM.pgreView(self.words, '<div id=\"pgre-container\"></div>');
            });
        }
        this.loaded = true;
        return this;
    },

    // common
    loadVocab : function() {

		var req = new XMLHttpRequest();
		req.open("GET", chrome.extension.getURL('/dictionaries/gre.json'), false);
		req.send(null);

		req.responseText;
        this.vocab = JSON.parse(req.responseText);
        return this
    },

    // content

    storeWords : function(raw) {
        if (this.where == "background") return this;
        var words = {};
        forEach(raw, function(entry, j){
            var matches = entry.matches; 
            var i = entry.index;
            var word, stem, sentences;
            for (word in matches) {
                stem = matches[word];
                sentences = this.findSentences(
                    pgreDOM.extractBackground(this.texts[i].parent), 
                    word) || []; 
                if (words[stem] && !words.__proto__[stem]) {
                    words[stem].sentences = words[stem].sentences.concat(sentences);
                } else {
                    words[stem] = {
                        def : this.vocab[stem],
                        sentences : sentences
                    }
                }
            }
        }, this); 
        this.words = toArray(words, "word");
        return this
    },

    // content
    highlightWords : function() {
        if (this.where == "background") return this;
        var entry, text, msg = [];
        for (var i=0, len=this.texts.length;i<len;i++) {
            text = this.texts[i].node.data;
            if (/[a-zA-Z]+/.test(text)) {
                entry = { 
                    contents: text,  
                    index : i
                };
                msg.push(entry);
            }
        }
        this.port.postMessage(msg);

        return this
    }, 

    // background
    lookupTextBlob: function(textBlob) {
        var text, word, matches={};
        text = textBlob.replace(/^\s\s*/, '').replace(/\s\s*$/, '').split(/[^a-zA-Z\-]+/);
        for (var j=0, jlen=text.length;j<jlen;j++) {
            if (text[j].length<2) continue;
            if (this.vocab && this.vocab[text[j]]) {
                matches[text[j]] = text[j];
            } else {
                word = this.wordChecker.check(text[j]);
                if (word && this.vocab && this.vocab[text[j]]) {
                    matches[text[j]] = word.replace(/[^a-zA-Z\-]+/, "");
                }
            }
        }
        return matches
    },

    // content
    wordDef : function(word, backupWord) {
        var line, 
            blockDef; 
            def = (this.vocab && this.vocab[word]) ? this.vocab[word] : (
                (this.vocab[backupWord] && (word = backupWord)) ? this.vocab[backupWord] : "unknown word"); 

        def = word + " : " + def;
        if (def.length<=40) return def;
        def = def.split(/\s+/);
        line = blockDef = "";
        while (word = def.shift()) {
            line += (word+" ");
            if (line.length>40) {
               blockDef += (line+"\n");
               line = "";    
            }         
        }
        return (blockDef + line)
        
    }, 

    // content
    findSentences : function(p,w) {

        w = new RegExp(w, "i"); 

        if (!w.test(p)) return [];

        p = p.replace(/\s+/g, " ").replace(/(^\s+|\s+$)/g, "");

        var sentence,
            sentences = [], 
            all_sentences = p.match(/\(?[A-Z]([^\.|]|\S\.\S)+[\.!\?]\)?/g);

        if (!all_sentences) return sentences;
        
        while (sentence = all_sentences.shift()) {
            if (w.test(sentence)) {
                sentences.push(sentence);
            }
        } 

        return sentences;
    }
    
});


// Determine whether the script is run as content or background script
try {
    chrome.browserAction.onClicked.addListener(function(tab) {
        if (pgre.loaded) {
            chrome.tabs.executeScript(null,
                                     {file: "pgre-bundle.js"});
        }
    });
    var Typo = require("./lib/typo.js");
    pgre.init().highlightWords();
} catch (e) {
    if (!document.getElementById("pgre")) {
        var pgreDOM = require("./lib/dom.js");
        pgre.init("content").highlightWords();
    }
}



