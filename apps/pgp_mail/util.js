define('pgp_mail/util', [
], function () {
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

    return {
        isPGPMail: isPGP,
        isEncryptedMail: isEncrypted,
        isSignedMail: isSigned
    };
});
