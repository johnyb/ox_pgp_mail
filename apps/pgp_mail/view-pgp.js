define('pgp_mail/view-pgp',
       ['io.ox/core/extensions',
        'io.ox/mail/api'
    ], function (ext, api) {

    'use strict';

    ext.point('io.ox/mail/detail').extend({
        index: 400,
        id: 'encrypted_content',
        draw: function (baton) {

            if (baton.data.content_type !== 'multipart/encrypted') {
                return;
            }
            var data = _(baton.data.attachments).find(function (a) {
                    return (/^application\/octet-stream/).test(a.content_type);
                }),
                node = this.find('.content');

            $.ajax({ url: api.getUrl(data, 'view'), dataType: 'text' }).done(function (text) {
                node.empty().append(
                    $('<pre class="encrypted">').html(text)
                );
            });

        }
    });
});
