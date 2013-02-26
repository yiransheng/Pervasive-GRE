

var pgre = window.pgre || Object.create({
    
    vocab : null,

    init : function(where) {
        this.where = where = (where || "background");
        this.loadVocab();

        if (where == "background") {
            this.wordChecker = require("./lib/typo.js").typo();
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
            var self = this;
            this.texts = require("./lib/dom.js").grabText();
            this.port = chrome.extension.connect({name: "pgre-connection"});
            this.port.onMessage.addListener(function(msg) {
                var node,
                    parent,
                    newNode,
                    word,
                    nWord,
                    matches,
                    span;
                for (var j=0, jlen=msg.length;j<jlen;j++) {
                    matches = msg[j].matches, 
                    i = msg[j].index;
                    for (word in matches) {
                        node = self.texts[i].node;
                        parent = self.texts[i].parent;
                        nWord = matches[word];
                        newNode = document.createElement("pgre");
                        span = 
                            '<span class="pgre-highlight hint hint--top" data-hint="' 
                            + self.wordDef(word, nWord)
                            +'">'+word+'</span>';
                        newNode.innerHTML = node.data.replace(word,span); 
                        try {
                            parent.replaceChild(newNode, node);
                        } catch (e) {
                            // console.log(parent);
                            // console.log(node);
                        }
                    }
                }
            });
        }
        this.loaded = true;
        return this;
    },

    loadVocab : function() {

		var req = new XMLHttpRequest();
		req.open("GET", chrome.extension.getURL('/dictionaries/gre.json'), false);
		req.send(null);

		req.responseText;
        this.vocab = JSON.parse(req.responseText);
        return this
    },

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

    lookupTextBlob: function(textBlob) {
        var text, word, matches={};
        text = textBlob.replace(/^\s\s*/, '').replace(/\s\s*$/, '').split(/[^a-zA-Z\-]+/);
        for (var j=0, jlen=text.length;j<jlen;j++) {
            if (text[j].length<2) continue;
            if (this.vocab && this.vocab[text[j]]) {
                matches[text[j]] = text[j];
            } else {
                word = this.wordChecker.check(text[j]);
                if (word) {
                    matches[text[j]] = word.replace(/[^a-zA-Z\-]+/, "");
                }
            }
        }
        return matches
    },

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
    pgre.init().highlightWords();
} catch (e) {
    pgre.init("content").highlightWords();
    // var $ = require('jquery-browserify');
}



