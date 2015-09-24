define('pgp_mail/keyring', [
    'io.ox/core/extensions'
], function (ext) {
    'use strict';

    var RecipientModel = Backbone.Model.extend({
        initialize: function () {
            this.listenTo(this, 'change:email', this.lookup);
            //do initial lookup
            this.lookup(this, this.get('email'));
        },
        defaults: {
            email: '',
            keys: []
        },
        addKey: function (obj) {
            this.set('keys', this.get('keys').concat(obj));
        },
        lookup: function (model, val) {
            if (!val) return;

            var baton = new ext.Baton({
                email: val
            });
            ext.point('pgp_mail/keyring/lookup').invoke('action', model, baton);
        }
    });
    var recipients = {
        Model: RecipientModel
    };

    return {
        recipients: recipients
    };
});
