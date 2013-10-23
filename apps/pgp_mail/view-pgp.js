define('pgp_mail/view-pgp', [
    'io.ox/core/extensions',
    'io.ox/mail/api'
], function (ext, api) {
    'use strict';

    ext.point('io.ox/mail/detail/header').extend({
        before: 'attachments',
        id: 'filter_attachments',
        draw: function (baton) {
            if (!baton.data.attachment || baton.data.content_type !== 'multipart/encrypted') {
                return;
            }
            var filtered = baton.data.attachments.filter(function (attachment) {
                return (/^application\/pgp-encrypted$/).test(attachment.content_type) ||
                       (/^application\/octet-stream/).test(attachment.content_type);
            });

            baton.data.attachment = false;
            baton.data.attachments = _(baton.data.attachments).difference(filtered);
            baton.data.pgp_attachments = filtered;
        }
    });

    ext.point('io.ox/mail/detail').extend({
        index: 400,
        id: 'encrypted_content',
        draw: function (baton) {

            if (baton.data.content_type !== 'multipart/encrypted') {
                return;
            }
            var data = _(baton.data.pgp_attachments).find(function (a) {
                    return (/^application\/octet-stream/).test(a.content_type);
                }),
                node = this.find('.content');

            data.mail = baton.data;
            $.ajax({ url: api.getUrl(data, 'view'), dataType: 'text' }).done(function (text) {
                node.empty().append(
                    $('<pre class="encrypted">').html(text)
                );
            });

        }
    });
});
