define('pgp_mail/view-pgp', [
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'pgp_mail/util',
    'gettext!pgp_mail',
    'less!pgp_mail/style.less'
], function (ext, api, util, gt) {
    'use strict';

    ext.point('io.ox/mail/detail/header').extend({
        before: 'attachments',
        id: 'filter_attachments',
        draw: function (baton) {
            if (!util.isPGPMail(baton.data)) {
                return;
            }
            var filtered = baton.data.attachments.filter(function (attachment) {
                return (/^application\/pgp-encrypted$/).test(attachment.content_type) ||
                       (/^application\/octet-stream/).test(attachment.content_type) ||
                       (/^application\/pgp-signature/).test(attachment.content_type);
            });

            baton.data.attachment = false;
            baton.data.attachments = _(baton.data.attachments).difference(filtered);
            baton.data.pgp_attachments = filtered;
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'pgp_info',
        draw: function (baton) {
            if (!util.isPGPMail(baton.data)) {
                return;
            }
            var node = $('<div class="pgp-info">');

            node.append(
                $('<a href="#">')
                .attr({
                    'role': 'button'
                })
                .append(function () {
                    var info = [];
                    if (util.isSignedMail(baton.data)) {
                        info.push($.txt(gt('This message is signed')));
                    }
                    if (util.isEncryptedMail(baton.data)) {
                        info.push($.txt(gt('This message is encrypted')));
                    }
                    return info;
                })
            );
            this.append(node);
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 400,
        id: 'encrypted_content',
        draw: function (baton) {

            if (!util.isEncryptedMail(baton.data)) {
                return;
            }
            var data = _(baton.data.pgp_attachments).find(function (a) {
                    return (/^application\/octet-stream/).test(a.content_type);
                }),
                node = this.find('.content');

            node.addClass('encrypted');
            data.mail = baton.data;
            $.ajax({ url: api.getUrl(data, 'view'), dataType: 'text' }).done(function (text) {
                node.empty().append(
                    $('<pre>').html(text)
                );
            });

        }
    });
    ext.point('io.ox/mail/detail').extend({
        index: 500,
        id: 'signed_content',
        draw: function (baton) {

            if (!util.isSignedMail(baton.data)) {
                return;
            }

            this.find('.content').addClass('signed');
        }
    });
});
