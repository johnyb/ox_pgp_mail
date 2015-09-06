define('mailvelope/editor/main', [
    'mailvelope/main',
    'io.ox/core/extensions',
    'gettext!pgp_mail'
], function (api, ext, gt) {

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
        api.createEditorContainer(selector).then(function () {
            ready.resolve(editor);
        });

        this.setContent = function () {
        };
        this.getContent = function () {
            return '';
        };

        this.setPlainText = function () {
        };
        this.getPlainText = function () {
            return '';
        };

        this.show = function () {
            node.show();
        };
        this.hide = function () {
            node.hide();
        };

        this.destroy = function () {
            this.hide();
        };

        this.done = ready.done;
    }

    return Editor;
});
