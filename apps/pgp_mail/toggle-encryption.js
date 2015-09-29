define('pgp_mail/toggle-encryption', [
], function () {
    'use strict';

    var ToggleEncryptionView = Backbone.View.extend({
        initialize: function () {
            this.listenTo(this.model, 'change:encrypt', function (model, val) {
                this.$('i.fa').toggleClass('encrypted', val);
            });
        },
        className: 'toggle-encryption',
        events: {
            'click i.fa': 'toggle'
        },
        toggle: function () {
            this.model.set('encrypt', !this.model.get('encrypt'));
        },
        render: function () {
            this.$el.empty().append(
                $('<i class="fa fa-2x">')
                    .toggleClass('encrypted', !!this.model.get('encrypt'))
            );

            return this;
        }
    });

    return {
        View: ToggleEncryptionView
    };
});
