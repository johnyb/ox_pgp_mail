define([
    'pgp_mail/keyring',
    'io.ox/core/extensions'
], function (Keyring, ext) {
    'use strict';

    describe('Keyring', function () {
        ext.point('pgp_mail/keyring/lookup').extend({
            id: 'test',
            action: function (baton) {
                if (baton.email === 'jan.doe@example.com') {
                    this.addKey({
                        fingerprint: '1337deadbeef'
                    });
                }
            }
        });

        describe('recipients model', function () {
            var model;

            beforeEach(function () {
                model = new Keyring.recipients.Model();
            });
            it('should create a Backbone based model', function () {
                expect(model.set).to.be.a('function');
                expect(model.get).to.be.a('function');
            });

            it('should provide an addKey method', function () {
                expect(model.addKey).to.be.a('function');
                model.addKey({
                    fingerprint: '1337deadbeef'
                });
            });

            it('should do an initial lookup', function () {
                var m = new Keyring.recipients.Model({
                    email: 'jan.doe@example.com'
                });
                expect(m.get('keys').length).to.be.above(0);
            });

            it('should invoke a lookup extension point on e-mail change', function () {
                model.set('email', 'jan.doe@example.com');
                expect(model.get('keys').length).to.be.above(0);
            });
        });
    });
});
