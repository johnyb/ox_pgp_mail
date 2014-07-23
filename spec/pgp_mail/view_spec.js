define([
    'io.ox/core/extensions',
    'fixture!testmails.json',
    'pgp_mail/view-pgp'
], function (ext, testmails) {
    'use strict';

    describe('PGP Mail Views', function () {
        describe('extend io.ox/mail/detail/body', function () {
            var point = ext.point('io.ox/mail/detail/body');

            describe('for encrypted mails', function () {
                it('should add "encrypted_content" extension', function () {
                    expect(point.keys()).to.contain('encrypted_content');
                });
                it('should render content for pgp/mime encrypted mails', function () {
                    var server = ox.fakeServer.create();
                    server.respondWith('GET', /\/api\/mail\?action=attachment/, [
                        200, {
                            'Content-Type': 'text/plain'
                        },
                        testmails.encrypted_body
                    ]);

                    var baton = new ext.Baton(testmails.encrypted_mail);
                    var node = $('<div class="content">');
                    point.all().forEach(function (p) {
                        if (p.id === 'encrypted_content' || p.id === 'collect_pgp_attachments') return;
                        point.disable(p.id);
                    });
                    point.invoke('draw', $('<section class="body">').append(node), baton);
                    server.respond();
                    expect(node.text()).to.contain('-----BEGIN PGP MESSAGE-----');
                    server.restore();
                });
                it('should add a CSS class "encrypted" to the mail content node', function () {
                    var baton = new ext.Baton(testmails.encrypted_mail);
                    var node = $('<div class="content">');
                    point.all().forEach(function (p) {
                        if (p.id === 'encrypted_content' || p.id === 'collect_pgp_attachments') return;
                        point.disable(p.id);
                    });
                    point.invoke('draw', $('<div class="body">').append(node), baton);
                    expect(node.hasClass('encrypted')).to.be.true;
                });
            });

            it('for signed mails', function () {
                expect(point.keys()).to.contain('signed_content');
            });
        });
    });
});
