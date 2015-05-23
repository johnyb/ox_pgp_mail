define('mailvelope/settings/register', [
    'io.ox/core/extensions',
    'gettext!pgp_mail'
], function (ext, gt) {
    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'mailvelope',
        title: gt('Mailvelope'),
        ref: 'mailvelope'
    });

    return {};
});
