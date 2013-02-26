

var pgre = window.pgre || Object.create({
    
    vocab : null,

    init : function(where) {
        this.where = where = (where || "background");

        if (where == "background") {
            this.wordChecker = require("./typo.js").typo();
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
            this.texts = require("./dom.js").grabText();
            this.loadVocab();
            this.port = chrome.extension.connect({name: "pgre-connection"});
            this.port.onMessage.addListener(function(msg) {
                var node,
                    parent,
                    newNode,
                    word,
                    nWord,
                    matches,
                    i;
                for (var j=0, jlen=msg.length;j<jlen;j++) {
                    matches = msg[j].matches, 
                    i = msg[j].index;
                    for (word in matches) {
                        node = self.texts[i].node;
                        parent = self.texts[i].parent;
                        nWord = matches[word];
                        newNode = document.createElement("pgre");
                        newNode.innerHTML = node.data.replace(word, 
                            '<span class="pgre-highlight" data="'+nWord+'">'+word+'</span>');
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

		return req.responseText;
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
        text = textBlob.replace(/^\s\s*/, '').replace(/\s\s*$/, '').split(/\s+/);
        for (var j=0, jlen=text.length;j<jlen;j++) {
            if (word = this.wordChecker.check(text[j])) {
                matches[text[j]] = word.replace(/[^a-zA-Z]/, "").toLowerCase();
            }
        }
        return matches
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
    var $ = require('jquery-browserify');
}



