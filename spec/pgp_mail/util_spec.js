define([
    'pgp_mail/util',
    'io.ox/mail/compose/model'
], function(util, MailModel) {
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

        describe('PGPMailBuilder', function () {
            //do not run in PhantomJS, since it does not provide TextEncode/TextDecode API
            if (_.device('PhantomJS')) return;

            it('should create MIME part for basic mail model', function () {
                var mail = new MailModel();
                var mb = util.builder.fromModel(mail);
                var mime = mb.build();
                expect(mime).to.be.a('string');
                expect(mb.getHeader('content-type')).to.equal('multipart/encrypted; protocol="application/pgp-encrypted";');
                //version identification
                var node = mb._childNodes[0];
                expect(node.getHeader('content-type')).to.equal('application/pgp-encrypted');
                expect(node.getHeader('content-description')).to.equal('PGP/MIME version identification');
                expect(node.content).to.contain('Version: 1');
                //encrypted message
                node = mb._childNodes[1];
                expect(node.getHeader('content-type')).to.equal('application/octet-stream; name="encrypted.asc"');
                expect(node.getHeader('content-description')).to.equal('PGP/MIME encrypted message');
                expect(node.getHeader('content-disposition')).to.equal('inline; filename="encrypted.asc"');
            });

            it('should create MIME part for a mail model with many headers', function () {
                var mail = new MailModel();
                //not really a PGP message, but we want to make sure it makes it into the MIME block
                mail.setContent('Example content 1337');
                mail.set('from', [['John Doe', 'doe@example.com']]);
                mail.set('to', [
                    ['James Kirk', 'captain@enterprise'],
                    ['Leonard McCoy', 'bones@enterprise']
                ]);
                mail.set('cc', [
                    ['Spock', 'spock@enterprise']
                ]);
                mail.set('bcc', [
                    ['NSA', 'spy@starfleet']
                ]);
                mail.set('subject', '1337 subject');
                var mb = util.builder.fromModel(mail);
                var mime = mb.build();

                expect(mime).to.contain('John Doe <doe@example.com>');
                expect(mime).to.contain('James Kirk <captain@enterprise>');
                expect(mime).to.contain('Leonard McCoy <bones@enterprise>');
                expect(mime).to.contain('Spock <spock@enterprise>');
                expect(mime).not.to.contain('NSA <spy@starfleet>');
                expect(mime).to.contain('Subject: 1337 subject');

                var envelope = mb.getEnvelope();
                expect(envelope.from).to.equal('doe@example.com');
                //the smtp envelope contains all recipient addresses
                expect(envelope.to).to.deep.equal(['captain@enterprise', 'bones@enterprise', 'spock@enterprise', 'spy@starfleet']);

                var node = mb._childNodes[1];
                expect(node.content).to.contain('Example content 1337');
            });

            it('should handle encoding to UTF8 correctly', function () {
                var mail = new MailModel();
                mail.set('from', [['Drescher, Mäh', 'maeh.drescher@landmaschi.ne']]);
                var mb = util.builder.fromModel(mail);
                var mime = mb.build();
                //expect(mime).to.contain('From: =?UTF-8?Q?Drescher=2C_M=C3=A4h?= <maeh.drescher@landmaschi.ne>');
                //FIXME: remove workaround for mailbuild library
                expect(mime).to.contain('From: =?UTF-8?B?RHJlc2NoZXIsIE3DpGg=?= <maeh.drescher@landmaschi.ne>');
            });
        });
    });
});
