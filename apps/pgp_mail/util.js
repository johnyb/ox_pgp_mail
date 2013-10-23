define('pgp_mail/util', [
], function () {
    'use strict';

    function isPGP(mail) {
        return isEncrypted(mail);
    }

    function isEncrypted(mail) {
        return mail.content_type === 'multipart/encrypted';
    }

    return {
        isPGPMail: isPGP,
        isEncryptedMail: isEncrypted
    };
});
