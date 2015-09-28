define('mailvelope/view-detail', [
    'io.ox/core/extensions',
    'mailvelope/main'
], function (ext, mailvelope) {
    'use strict';

    ext.point('pgp_mail/detail/encrypted').extend({
        id: 'mailvelope',
        draw: function (baton) {
            var cid = _.cid(baton.data);
            //var node = this;
            if (!cid) return;
            return mailvelope.createDisplayContainer('.mail-item.mail-detail[data-cid="' + cid + '"] .content', baton.encrypted_content)
                .then(function () {
                    baton.stopPropagation();
                });
        }
    });
});
