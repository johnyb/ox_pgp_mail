define('mailvelope/settings/pane', [
    'io.ox/core/extensions',
    'mailvelope/main',
    'io.ox/core/api/account'
], function (ext, api, accountAPI) {
    'use strict';

    ext.point('mailvelope/settings/detail').extend({
        draw: function () {
            this.append(
                $('<div>').addClass('mailvelope-settings-pane abs')
            );
            $.when(
                api.loaded,
                api.getKeyring(),
                accountAPI.getPrimaryAddress(),
                accountAPI.getDefaultDisplayName()
            ).then(function (mailvelope, keyring, mail, name) {
                var opt = {};
                if (mail && mail[1]) opt.email = mail[1];
                if (name) opt.fullName = name;
                mailvelope.createSettingsContainer('.mailvelope-settings-pane', keyring, opt);
            });
        }
    });

    return {};
});
