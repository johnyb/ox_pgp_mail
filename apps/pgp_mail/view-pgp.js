define('pgp_mail/view-pgp', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/mail/api',
    'pgp_mail/util',
    'gettext!pgp_mail',
    'less!pgp_mail/style.less'
], function (ext, links, actions, api, util, gt) {
    'use strict';

    var Action = actions.Action;

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

    new Action('io.ox/mail/actions/pgp_info', {
        id: 'pgp_info',
        requires: function (e) {
            return util.isPGPMail(e.baton.data);
        },
        action: function (baton) {
            var mail = baton.data,
                pgpInfo = util.getPGPInfo(mail);

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog()
                    .addPrimaryButton('close', gt('Close'))
                    .header(
                        $('<h4>').text(gt('PGP Info'))
                    )
                    .append(
                        $('<div class="pgp-info">')
                    )
                    .show(function () {
                        var self = this.busy();
                        pgpInfo.done(function () {
                            var node = self.find('.pgp-info');
                            node.append(
                                $('<div class="content-type">').append(
                                    gt('Content Type'),
                                    ': ',
                                    mail.content_type
                                )
                            );
                            self.idle();
                        });
                    });
            });
        }
    });

    _.delay(function () {
        ext.point('io.ox/mail/links/inline').extend(new links.Link({
            id: 'pgp_info',
            prio: 'lo',
            label: gt('PGP Details'),
            ref: 'io.ox/mail/actions/pgp_info'
        }));
    }, 100);

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

            var contentNode = this.find('.content'),
                verified = util.isVerifiedMail(baton.data);

            contentNode.addClass('signed');
            if (verified) {
                contentNode.addClass('verified');
            } else if (!verified) {
                contentNode.addClass('verification-failed');
            }
        }
    });
});
