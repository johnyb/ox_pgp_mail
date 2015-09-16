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
            return loaded.then(function (mailvelope) {
                return fromPromise(mailvelope.getKeyring(ox.user));
            }).then(_.identity, function (err) {
                if (err.code !== 'NO_KEYRING_FOR_ID') return $.Deferred().reject(err);

                return fromPromise(window.mailvelope.createKeyring(ox.user));
            });
        };

        this.createEditorContainer = function createEditorContainer (node, options) {
            return $.when(loaded, this.getKeyring()).then(function (mailvelope, keyring) {
                return fromPromise(mailvelope.createEditorContainer(node, keyring, options));
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
