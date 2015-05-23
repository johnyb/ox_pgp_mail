define([
    'io.ox/core/extensions'
], function (ext) {
    describe('Mailvelope integration', function () {
        var mailvelopeAPI = {};

        beforeEach(function () {
            window.mailvelope = mailvelopeAPI;
            return require([
                'mailvelope/main',
                'mailvelope/settings/register',
                'mailvelope/settings/pane'
            ]);
        });
        afterEach(function () {
            //manually remove handler, or it will be triggered multiple times
            $(window).off('mailvelope');
            delete window.mailvelope;
            require.undef('mailvelope/main');
        });

        describe('provides settings extension', function () {
            var nameStub, emailStub;
            beforeEach(function () {
                var api = require('io.ox/core/api/account');
                nameStub = sinon.stub(api, 'getDefaultDisplayName', function () { return 'Jan Doe'; });
                emailStub = sinon.stub(api, 'getPrimaryAddress', function () { return ['Jan Doe', 'jan.doe@example.com']; });
            });
            afterEach(function () {
                nameStub.restore();
                emailStub.restore();
            });

            it('should register mailvelope to "io.ox/settings/pane" extension point', function () {
                var hasMailvelope = ext.point('io.ox/settings/pane').has('mailvelope');
                expect(hasMailvelope, 'extension point exists').to.be.true;
            });

            it('should paint the mailvelope settings pane', function () {
                var $el = $('<div id="settingsPanes" class="scrollable-pane">');
                mailvelopeAPI.createSettingsContainer = _.noop;
                mailvelopeAPI.getKeyring = function (id) {
                    return $.when({ id: id });
                };
                ext.point('mailvelope/settings/detail').invoke('draw', $el);
                expect($el.find('div').hasClass('mailvelope-settings-pane abs')).to.be.true;
                expect($el.find('div').hasClass('scrollable-pane')).to.be.false;
            });

            it('should call the mailvelope API to render the mailvelope settings', function () {
                var $el = $('<div id="settingsPanes">');
                var painted = $.Deferred();
                mailvelopeAPI.createSettingsContainer = _.noop;
                mailvelopeAPI.getKeyring = function (id) {
                    return $.when({ id: id });
                };
                var stub = sinon.stub(mailvelopeAPI, 'createSettingsContainer', function (selector, keyring, options) {
                    expect(selector).to.equal('.mailvelope-settings-pane');
                    expect(keyring.id).to.equal('jan.doe');
                    expect(options.email).to.equal('jan.doe@example.com');
                    expect(options.fullName).to.equal('Jan Doe');
                    painted.resolve();
                });
                ext.point('mailvelope/settings/detail').invoke('draw', $el);
                return painted.then(function () {
                    expect(stub.calledOnce, 'createSettingsContainer called once').to.be.true;
                    stub.restore();
                });
            });
        });
    });
});
