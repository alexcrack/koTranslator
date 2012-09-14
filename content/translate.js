var kotranslator = {
    supportsCommand: function(cmd) {
        return cmd === 'Tasks:Translate';
    },
    
    isCommandEnabled: function(cmd) {
        var view = ko.views.manager && ko.views.manager.currentView;
        switch (cmd) {
            case "Tasks:Translate":
                if (view && view.getAttribute('type') == 'editor') {
                    var scimoz = view.scintilla.scimoz;
                    return scimoz.selectionStart != scimoz.selectionEnd;
                }
        }
        return false;
    },
    
    onLoad: function() {
        window.controllers.appendController(this);
    },
    
    detectAndTranslate: function detectAndTranslate() {
        var selection = this.getSelection();
        if (selection.start != selection.end) {
            this.detect(selection.text, function(lang) {
                kotranslator.translate(selection.text, lang, function(translation) {
                    kotranslator.replace(selection, translation);
                });
            });
        }
    },
    
    detect: function detect(text, succCallback) {
        var req = new XMLHttpRequest();
        var url = 'http://translate.yandex.net/api/v1/tr.json/detect?text=';
        url += encodeURI(text);
        req.open('GET', url, true);
        req.onreadystatechange = function (evt) {
            if (req.readyState == 4) {  
                if(req.status == 200) {
                    var response = JSON.parse(req.responseText);
                    var lang = response['lang'];
                    succCallback(lang);
                } else {
                    dump('Could not retrieve language.');
                }
            }
        };
        req.send(null);
    },
    
    translate: function translate(text, from_langue, succCallback) {
        var req = new XMLHttpRequest();
        var url = 'http://translate.yandex.net/api/v1/tr.json/translate?lang=';
        url += from_langue;
        url += '-en';
        url += '&text=';
        url += encodeURI(text);
        req.open('GET', url, true);
        req.onreadystatechange = function (evt) {
            if (req.readyState == 4) {  
                if(req.status == 200) {
                    var response = JSON.parse(req.responseText);
                    var translation = response['text'];
                    succCallback(translation);
                } else {
                    dump('Could not retrieve language.');
                }
            }
        };
        req.send(null);
    },
    
    getSelection: function getSelection() {
        var scimoz = ko.views.manager.currentView.scintilla.scimoz;
        var lineStart = scimoz.lineFromPosition(scimoz.selectionStart);
        var lineEnd = scimoz.lineFromPosition(scimoz.selectionEnd);
        var selection = undefined;
        
        if (scimoz.selectionMode !== scimoz.SC_SEL_RECTANGLE) {
            selection = {};
            selection.start = scimoz.getLineSelStartPosition(lineStart);
            selection.end = scimoz.getLineSelEndPosition(lineEnd);
            selection.text = scimoz.getTextRange(selection.start, selection.end);
        }
        return selection;
    },
    
    replace: function replace(selection, translation) {
        var scimoz = ko.views.manager.currentView.scintilla.scimoz;
        // Reset selection in case it has been changed, then replace
        scimoz.setSel(selection.start, selection.end);
        scimoz.replaceSel(translation);
        // Afterwards, manually update command to disable menu item (why?)
        goUpdateCommand('Tasks:Translate');
    }
};

window.addEventListener("load", function(event) { kotranslator.onLoad(event); }, false);