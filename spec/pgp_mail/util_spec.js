define(['pgp_mail/util'], function(util) {
    'use strict';

    describe('PGP Mail Utils', function () {
        it('should exist', function () {
            expect(util).to.exist;
        });

        describe('PGP mail detection (pgp/mime)', function () {
            it('should detect a signed PGP mail', function () {
                var mail = {
                    content_type: 'multipart/signed'
                };

                expect(util.isPGPMail(mail)).to.be.true;
            });
            it('should detect an encrypted PGP mail', function () {
                var mail = {
                    content_type: 'multipart/encrypted'
                };

                expect(util.isPGPMail(mail)).to.be.true;
            });

            it('should detect non-PGP mails', function () {
                var mail = {
                    content_type: 'text/plain'
                };

                expect(util.isPGPMail(mail)).to.be.false;
            });
        });
    });
});
