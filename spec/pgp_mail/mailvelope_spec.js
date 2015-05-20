define(function () {
    describe('Mailvelope integration', function () {
        var mailvelopeAPI = {};

        afterEach(function () {
            //manually remove handler, or it will be triggered multiple times
            $(window).off('mailvelope');
            delete window.mailvelope;
            require.undef('mailvelope/main');
        });

        describe('window.mailvelope not available', function () {
            beforeEach(function () {
                return require(['mailvelope/main']);
            });


            it('should not call init method without mailvelope event', function () {
                var api = require('mailvelope/main');
                expect(api.loaded.state()).to.equal('pending');
            });
            it('should handle the mailvelope event', function () {
                var api = require('mailvelope/main');
                window.mailvelope = mailvelopeAPI;
                $(window).trigger('mailvelope');
                expect(api.loaded.state()).to.equal('resolved');
            });
        });

        describe('window.mailvelope available', function () {
            beforeEach(function () {
                window.mailvelope = mailvelopeAPI;
                return require(['mailvelope/main']);
            });
            it('should run init directly', function () {
                var api = require('mailvelope/main');
                expect(api.loaded.state()).to.equal('resolved');
            });
        });
    });
});
