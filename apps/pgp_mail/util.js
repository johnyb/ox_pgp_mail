define('pgp_mail/util', [
    'io.ox/mail/util',
    'static/3rd.party/mailbuild.js'
], function (util, lib) {
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

    function getPGPInfo() {
        return $.when();
    }

    function buildFromModel(model) {
        var mail = new lib.mailbuild('multipart/encrypted; protocol="application/pgp-encrypted";');
        mail.addHeader({
            from: (model.get('from') || []).map(util.formatSender),
            to: (model.get('to') || []).map(util.formatSender),
            cc: (model.get('cc') || []).map(util.formatSender),
            bcc: (model.get('bcc') || []).map(util.formatSender),
            subject: model.get('subject')
        });
        mail.createChild('application/pgp-encrypted')
            .addHeader('content-description', 'PGP/MIME version identification')
            .setContent('Version: 1');
        mail.createChild('application/octet-stream; name="encrypted.asc"')
            .addHeader('content-description', 'PGP/MIME encrypted message')
            .addHeader('content-disposition', 'inline; filename="encrypted.asc"')
            .setContent(model.getContent());
        return mail;
    }

    return {
        isPGPMail: isPGP,
        isEncryptedMail: isEncrypted,
        isSignedMail: isSigned,
        getPGPInfo: getPGPInfo,
        builder: {
            fromModel: buildFromModel
        }
    };
});
