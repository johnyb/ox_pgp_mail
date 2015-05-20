define('mailvelope/main', function () {
    'use strict';

    function Mailvelope () {
        var loaded = this.loaded = $.Deferred();
        this.init = function loadMailvelope () {
            loaded.resolve(window.mailvelope);
        };
    }

    var api = new Mailvelope();

    if (typeof window.mailvelope !== 'undefined') {
        api.init();
    } else {
        $(window).on('mailvelope', api.init);
    }

    return api;
});
