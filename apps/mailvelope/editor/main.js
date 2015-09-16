define('mailvelope/editor/main', [
    'mailvelope/main',
    'io.ox/core/extensions',
    'pgp_mail/util',
    'gettext!pgp_mail'
], function (api, ext, utils, gt) {

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
            console.log('sending', requestBody);
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
            });
        }
    });

    ext.point('io.ox/mail/compose/editors').extend({
        id: 'mailvelope',
        label: gt('Mailvelope'),
        mode: 'mailvelope'
    });

    function Editor (container) {

        var selector = '#' + container.data('editorId');
        var node = $('<div>').attr({ id: container.data('editorId') });
        container.append(node);

        var ready = $.Deferred();
        var editor = this;
        var mailvelope;
        api.createEditorContainer(selector).then(function (ed) {
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
                (model.get('cc') || []).map(getMailAddress),
                (model.get('bcc') || []).map(getMailAddress)
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
            $(window).on('resize.mailvelope', resizeEditor);
            node.show();
            _.defer(resizeEditor);
        };
        this.hide = function () {
            node.hide();
            $(window).off('resize.mailvelope', resizeEditor);
        };

        this.destroy = function () {
            this.hide();
        };

        this.done = ready.done;
    }

    return Editor;
});
