define('mailvelope/main', function () {
    'use strict';

    function Mailvelope () {
        var loaded = this.loaded = $.Deferred();

        function loadMailvelope () {
            loaded.resolve(window.mailvelope);
        }

        function fromPromise (promise) {
            var def = $.Deferred();
            promise.then(def.resolve, def.reject);
            return def;
        }

        this.getKeyring = function getKeyring () {
            var def = $.Deferred();
            var timeout = window.setTimeout(function () {
                def.reject({
                    code: 'TIMEOUT'
                });
            }, 2000);

            loaded.then(function (mailvelope) {
                window.clearTimeout(timeout);
                return fromPromise(mailvelope.getKeyring(ox.user));
            }).then(_.identity, function (err) {
                if (err.code !== 'NO_KEYRING_FOR_ID') return $.Deferred().reject(err);

                return fromPromise(window.mailvelope.createKeyring(ox.user));
            }).then(def.resolve, def.reject);
            return def;
        };

        this.createEditorContainer = function createEditorContainer (node, options) {
            return $.when(loaded, this.getKeyring()).then(function (mailvelope, keyring) {
                return fromPromise(mailvelope.createEditorContainer(node, keyring, options));
            });
        };

        var hash = {};
        this.createDisplayContainer = function createDisplayContainer (selector, armoredText, options) {
            if (hash[selector] && (_.now() - hash[selector].timestamp < 5000)) return hash[selector].def;

            hash[selector] = {
                timestamp: _.now()
            };
            hash[selector].def = $.when(loaded, this.getKeyring()).then(function (mailvelope, keyring) {
                return fromPromise(mailvelope.createDisplayContainer(selector, armoredText, keyring, options));
            });
            return hash[selector].def.always(function () {
                delete hash[selector];
            });
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
