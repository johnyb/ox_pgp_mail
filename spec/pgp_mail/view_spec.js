define([
    'io.ox/core/extensions',
    'pgp_mail/view-pgp'
], function (ext) {
    'use strict';

    describe('PGP Mail Views', function () {
        describe('should extend io.ox/mail/detail/body', function () {
            var point = ext.point('io.ox/mail/detail/body');
            it('for encrypted mails', function () {
                expect(point.keys()).to.contain('encrypted_content');
            });

            it('for signed mails', function () {
                expect(point.keys()).to.contain('signed_content');
            });
        });
    });
});
