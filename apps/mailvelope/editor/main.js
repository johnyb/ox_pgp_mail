define('mailvelope/editor/main', [
    'mailvelope/main',
    'io.ox/core/extensions',
    'pgp_mail/util',
    'pgp_mail/keyring',
    'pgp_mail/toggle-encryption',
    'settings!io.ox/mail'
], function (api, ext, utils, Keyring, ToggleEncryption, mailSettings) {

    var extensionsNeeded = ext.point('io.ox/mail/compose/actions/send').filter(function (p) {
        if (p.id === 'errors' ||
            p.id === 'warnings' ||
            p.id === 'success' ||
            p.id === 'update-caches' ||
            p.id === 'busy:end') {
            return true;
        }
        return false;
    });

    function send(mail) {
        var mimeBuilder = utils.builder.fromModel(mail);
        var requestBody = mimeBuilder.build();
        return require(['io.ox/core/http']).then(function (http) {
            return http.PUT({
                module: 'mail',
                params: { action: 'new', timestamp: _.then() },
                data: requestBody
            });
        });
    }

    ext.point('io.ox/mail/compose/actions/send').extend({
        id: 'send-mailvelope',
        index: 999,
        perform: function (baton) {
            if (baton.model.get('editorMode') !== 'mailvelope') return;

            return baton.view.getEditor().then(function (editor) {
                if (_.isFunction(editor.prepareContent)) {
                    return editor.prepareContent(baton.model);
                }
            }).then(function (armoredText) {
                if (armoredText) {
                    baton.model.setContent(armoredText);
                    baton.stopPropagation();
                    return send(baton.model).then(_.identity, function (result) {
                        if (result && result.error) baton.error = result.error;
                        if (result && result.warnings) baton.warning = result.warnings;
                        return $.when();
                    }).then(function () {
                        //manually run some of the extensions, since we stopped the original
                        //invokation of the point
                        return extensionsNeeded.forEach(function (p) {
                            //points are not async, we know that
                            p.perform(baton);
                        });
                    });
                }
            }, function (result) {
                var def = $.Deferred();
                if (result && result.message) baton.error = result.message;
                baton.stopPropagation();
                ext.point('io.ox/mail/compose/actions/send').get('errors', function (p) {
                    p.perform(baton);
                    def.resolve();
                });
                return def;
            });
        }
    });

    ext.point('pgp_mail/keyring/lookup').extend({
        id: 'mailvelope',
        action: function (baton) {
            var model = this;
            api.getKeyring().then(function (keyring) {
                var def = $.Deferred();
                keyring.validKeyForAddress([baton.email]).then(def.resolve, def.reject);
                return def;
            }).then(function (result) {
                if (!(result && result[baton.email])) return;

                //we trust everything from mailvelope
                model.addKey(_.extend({ trusted: true }, result[baton.email]));
            });
        }
    });

    ext.point('io.ox/mail/compose/createtoken').extend({
        id: 'mailvelope-token',
        action: function (baton) {
            if (baton.model.get('editorMode') !== 'mailvelope') return;

            var email = baton.event.attrs.model.get('token').value;
            var target = $(baton.event.relatedTarget);
            var view = new Keyring.recipients.View({
                model: new Keyring.recipients.Model({
                    email: email
                })
            });

            target.find('.close').before(view.render().$el);
        }
    });

    ext.point('io.ox/mail/compose/fields').extend({
        id: 'toggle-encryption',
        index: 'last',
        draw: function (baton) {
            var node = this.find('.row.sender');
            var view = new ToggleEncryption.View({
                model: baton.model
            });
            //HACK: always insert first, since we do not control
            //other content
            node.prepend(view.render().$el);
        }
    });

    ext.point('io.ox/mail/compose/fields').extend({
        id: 'toggle-mailvelope',
        draw: function (baton) {
            //FIXME: find a better way to switch editorMode if encrypt flag changed
            var oldMode = baton.model.get('editorMode');
            //oldMode should never be mailvelope, since this is used if encryption is removed
            if (oldMode === 'mailvelope') oldMode = mailSettings.get('messageFormat');
            //default setting is mailvelope? Use text instead.
            if (oldMode === 'mailvelope') oldMode = 'text';

            baton.view.listenTo(baton.model, 'change:encrypt', function (model, val) {
                if (val === true) {
                    model.set('editorMode', 'mailvelope');
                } else {
                    model.set('editorMode', oldMode);
                }
            });
            baton.view.listenTo(baton.model, 'change:editorMode', function (model, val) {
                //remember last mode, that is not mailvelope
                if (val !== 'mailvelope') oldMode = val;
                model.set('encrypt', val === 'mailvelope');
            });
        }
    });

    function Editor (container, options) {

        var selector = '#' + container.data('editorId');
        var node = $('<div class="mailvelope-editor">').attr({ id: container.data('editorId') });
        container.append(node);
        this.events = _.extend({}, Backbone.Events);

        var ready = $.Deferred();
        var editor = this;
        var mailvelope;
        var setupComplete = $.Deferred();

        //ensure mailvelope has a public/private key-pair, or trigger the setup wizard
        api.getKeyring().then(function (keyring) {
            var from = options.model.get('from');
            var def = $.Deferred();
            var email = _.isArray(from) && _.isArray(from[0]) && from[0][1];
            if (!email) return def.reject({ code: 'UNKNOWN_SENDER' });
            keyring.exportOwnPublicKey(email).then(def.resolve, def.reject);
            return def;
        }).then(function (key) {
            if (key) setupComplete.resolve();
        }, function (err) {
            if (err && err.code === 'NO_KEY_FOR_ADDRESS') {
                //not handled by API, but we need a key, here
                api.trigger('setupNeeded', 'no keypair');
            }
        });
        this.events.listenTo(api, 'setupNeeded', function () {
            require(['mailvelope/tour'], function (runTour) {
                runTour().then(setupComplete.resolve, setupComplete.reject);
            });
        });

        setupComplete.then(function () {
            editor.events.stopListening(api, 'setupNeeded');
            return api.createEditorContainer(selector);
        }, function () {
            editor.events.stopListening(api, 'setupNeeded');
            options.model.set('encrypt', false);
        }).then(function (ed) {
            mailvelope = ed;
            ready.resolve(editor);
        });

        function getMailAddress(item) {
            return item[1];
        }
        var armored = '';
        this.prepareContent = function (model) {
            var recipients = [];

            recipients = recipients.concat(
                (model.get('to') || []).map(getMailAddress),
                (model.get('cc') || []).map(getMailAddress)
            );

            var def = $.Deferred();
            mailvelope.encrypt(recipients).then(function (text) {
                armored = text;
                def.resolve(text);
            }, def.reject);
            return def;
        };
        this.setContent = function () {
        };
        this.getContent = function () {
            return armored;
        };
        this.content_type = 'multipart/encrypted';

        this.setPlainText = function () {
        };
        this.getPlainText = function () {
            return '';
        };

        function resizeEditor() {
            node.css('min-height', Math.max(300, ($(window).height() - node.offset().top - $('#io-ox-topbar').height())));
            node.find('iframe').css('min-height', node.height() - 5);
        }

        this.show = function () {
            //update tokenfields
            var model = options.model;
            model.trigger('change:to', model, model.get('to'));
            model.trigger('change:cc', model, model.get('cc'));

            $(window).on('resize.mailvelope', resizeEditor);
            node.show();
            _.defer(resizeEditor);
        };
        this.hide = function () {
            //update tokenfields
            var model = options.model;
            options.model.trigger('change:to', model, model.get('to'));
            options.model.trigger('change:cc', model, model.get('cc'));
            node.hide();
            $(window).off('resize.mailvelope', resizeEditor);
        };

        this.destroy = function () {
            this.hide();
            this.events.stopListening();
        };

        this.done = ready.done;
    }

    return Editor;
});
