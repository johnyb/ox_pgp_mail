define('pgp_mail/util', [
    'io.ox/mail/api'
], function (api) {
    'use strict';

    function isPGP(mail) {
        return isEncrypted(mail) || isSigned(mail);
    }

    function isEncrypted(mail) {
        return mail.content_type === 'multipart/encrypted';
    }

    function isSigned(mail) {
        return mail.content_type === 'multipart/signed';
    }

    function isVerified(mail) {
        require(['3rd.party/openpgpjs/main'], function (openpgp) {
            openpgp.init();
            var data = _(mail.pgp_attachments).find(function (a) {
                return (/^application\/pgp-signature/).test(a.content_type);
            });
            data.mail = mail;
            $.ajax({ url: api.getUrl(data, 'view'), dataType: 'text' }).done(function (text) {
                var signature = openpgp.read_message(text)[0].signature,
                    msg;
                text = mail.attachments[0].content.replace(/<br>/g, '\n') + '\n' + text;
                text = '-----BEGIN PGP SIGNED MESSAGE-----\nHash:' +
                       window.util.get_hashAlgorithmString(signature.hashAlgorithm) +
                       '\n\n' + text;
                msg = openpgp.read_message(text)[0];
                msg.verifySignature();
            });
        });
    }

    function getPGPInfo() {
        return $.when();
    }

    return {
        isPGPMail: isPGP,
        isEncryptedMail: isEncrypted,
        isSignedMail: isSigned,
        isVerifiedMail: isVerified,
        getPGPInfo: getPGPInfo
    };
});
