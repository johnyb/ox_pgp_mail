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

            it('should create a keyring with username', function () {
                var api = require('mailvelope/main');
                var getKeyringCalled = false,
                    createKeyringCalled = false;
                mailvelopeAPI.getKeyring = function (id) {
                    var err = new Error('No keyring found for this identifier.');
                    err.code = 'NO_KEYRING_FOR_ID';
                    getKeyringCalled = true;
                    return $.Deferred().reject(err);
                };
                mailvelopeAPI.createKeyring = function (id) {
                    expect(getKeyringCalled, 'getKeyring called before createKeyring').to.be.true;
                    mailvelopeAPI.keyring = { id: id };
                    createKeyringCalled = true;
                    return $.Deferred().resolve(mailvelopeAPI.keyring);
                };
                return api.getKeyring().then(function (keyring) {
                    expect(keyring).to.exist;
                    expect(keyring).to.equal(mailvelopeAPI.keyring);
                    expect(keyring.id).to.equal('jan.doe');
                    expect(createKeyringCalled, 'createKeyring called on window.mailvelope').to.be.true;
                });
            });

            it('should get an existing keyring', function () {
                var api = require('mailvelope/main');
                mailvelopeAPI.getKeyring = function (id) {
                    return $.Deferred().resolve({ id: id });
                };
                return api.getKeyring().then(function (keyring) {
                    expect(keyring).to.exist;
                    expect(keyring.id).to.equal('jan.doe');
                });
            });

            it('should provide a createEditorContainer method', function () {
                var api = require('mailvelope/main');
                mailvelopeAPI.createEditorContainer = function (selector, keyring, options) {
                    expect(selector).to.equal('#my_element');
                    expect(keyring.id).to.equal('jan.doe');
                    expect(options.sampleOption).to.be.true;
                    return $.when({ id: 'test' });
                };
                mailvelopeAPI.getKeyring = function (id) {
                    return $.Deferred().resolve({ id: id });
                };
                return api.createEditorContainer('#my_element', { sampleOption: true }).then(function (editor) {
                    expect(editor).to.exist;
                });
            });

            it('should provide a createDisplayContainer method', function () {
                var api = require('mailvelope/main');
                mailvelopeAPI.createDisplayContainer = function (selector, armoredText, keyring, options) {
                    expect(selector).to.equal('#my_element');
                    expect(armoredText).to.equal('some PGP text');
                    expect(keyring.id).to.equal('jan.doe');
                    expect(options.sampleOption).to.be.true;
                    return $.when();
                };
                mailvelopeAPI.getKeyring = function (id) {
                    return $.Deferred().resolve({ id: id });
                };
                return api.createDisplayContainer('#my_element', 'some PGP text', { sampleOption: true }).then(function (editor) {
                    expect(editor).to.be.undefined;
                });
            });
        });
    });
});
