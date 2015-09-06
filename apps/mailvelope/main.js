define('mailvelope/main', function () {
    'use strict';

    function Mailvelope () {
        var loaded = this.loaded = $.Deferred();

        function loadMailvelope () {
            loaded.resolve(window.mailvelope);
        }

        this.getKeyring = function getKeyring () {
            //make sure, we return jQuery Defered, not a ES6 Promise
            var def = $.Deferred();
            loaded.then(function (mailvelope) {
                return mailvelope.getKeyring(ox.user);
            }).then(
                function (keyring) {
                    return def.resolve(keyring);
                },
                function (err) {
                    if (err.code !== 'NO_KEYRING_FOR_ID') return def.reject(err);

                    return window.mailvelope.createKeyring(ox.user).then(def.resolve, def.reject);
                }
            );
            return def;
        };

        this.createEditorContainer = function createEditorContainer (node, options) {
            //make sure, we return jQuery Defered, not a ES6 Promise
            var def = $.Deferred();
            $.when(loaded, this.getKeyring()).then(function (mailvelope, keyring) {
                return mailvelope.createEditorContainer(node, keyring, options);
            }).then(def.resolve, def.reject);
            return def;
        };

        if (typeof window.mailvelope !== 'undefined') {
            loadMailvelope();
        } else {
            $(window).on('mailvelope', loadMailvelope);
        }
    }

    var api = new Mailvelope();

    return api;
});
