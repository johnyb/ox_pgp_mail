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
            var clock;
            beforeEach(function () {
                clock = undefined;
                return require(['mailvelope/main']);
            });
            afterEach(function () {
                if (clock) clock.restore();
            });

            it('should not call init method without mailvelope event', function () {
                var api = require('mailvelope/main');
                expect(api.loaded.state()).to.equal('pending');
            });
            it('should timeout after 2s', function () {
                var api = require('mailvelope/main');
                clock = sinon.useFakeTimers();
                var def = api.getKeyring();
                clock.tick(1999);
                expect(def.state()).to.equal('pending');
                expect(api.loaded.state()).to.equal('pending');
                clock.tick(1);
                expect(def.state()).to.equal('rejected');
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

            it('should create only one unique display container if called multiple times in a short interval', function () {
                var api = require('mailvelope/main');
                var def = $.Deferred();
                var spy = sinon.spy();
                mailvelopeAPI.createDisplayContainer = function (selector, armoredText, keyring, options) {
                    spy();
                    expect(selector).to.equal('#my_element');
                    expect(armoredText).to.equal('some PGP text');
                    expect(keyring.id).to.equal('jan.doe');
                    expect(options.sampleOption).to.be.true;
                    return def;
                };
                mailvelopeAPI.getKeyring = function (id) {
                    return $.Deferred().resolve({ id: id });
                };

                var def1 = api.createDisplayContainer('#my_element', 'some PGP text', { sampleOption: true });
                var def2 = api.createDisplayContainer('#my_element', 'some PGP text', { sampleOption: true });

                expect(def1).to.equal(def2);
                expect(spy.calledOnce, 'mailvelopeAPI.createDisplayContainer called once').to.be.true;


                return def.resolve().then(function () {
                    expect(def1.state()).to.equal('resolved');
                    expect(def2.state()).to.equal('resolved');

                    return api.createDisplayContainer('#my_element', 'some PGP text', { sampleOption: true });
                }).then(function () {
                    expect(spy.calledTwice, 'mailvelopeAPI.createDisplayContainer called twice').to.be.true;
                });
            });
        });
    });
});
