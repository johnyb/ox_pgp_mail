define([
    'mailvelope/main',
    'spec/shared/capabilities',
    'io.ox/core/manifests',
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'mailvelope/editor/main'
], function (api, caputil, manifests, cap, ext) {

    'use strict';

    var capabilities = caputil.preset('common').init(['io.ox/core/manifests'], [manifests]);

    describe('Mailvelope integration', function () {

        beforeEach(function () {
            return capabilities.enable(['mailvelope']);
        });

        //FIXME: test environment does not inject manifests
        //it works, if ox.serverConfig.manifests is set accordingly, but that's not what we want to test, here
        it.skip('should register a new editor', function () {
            manifests.reset();
            var plugins = manifests.manager.pluginsFor('io.ox/mail/compose/editor/mailvelope');

            expect(plugins).not.to.be.empty;
        });

        it('should extend the list of editors available for mail compose', function (done) {
            var pointDefined = ext.point('io.ox/mail/compose/editors').has('mailvelope');
            expect(pointDefined).to.be.true;
            ext.point('io.ox/mail/compose/editors').get('mailvelope', function (p) {
                expect(p.label, 'a label for the menu').to.exist;
                expect(p.mode, 'editor mode').to.equal('mailvelope');
                done();
            });
        });

        describe('implement the Editor interface for new mail compose', function () {
            var editor,
                editorNode = $('<div class="editable" data-editor-id="editor-1337">');

            beforeEach(function () {
                window.mailvelope = {};
                window.mailvelope.getKeyring = function (id) {
                    return $.when({ id: id });
                };
                window.mailvelope.createEditorContainer = function (selector) {
                    var node = $(selector);
                    node.append($('<iframe>'));
                    return $.when(editor);
                };

                require.undef('mailvelope/main');
                require.undef('mailvelope/editor/main');
                var def = require(['mailvelope/editor/main']).then(function (Editor) {
                    $('body').append(editorNode);
                    editor = new Editor(editorNode, {
                        model: new Backbone.Model()
                    });
                });
                $(window).trigger('mailvelope');
                return def;
            });
            afterEach(function () {
                editorNode.empty().remove();
                require.undef('mailvelope/main');
                require.undef('mailvelope/editor/main');
            });

            it('should provide a done method which returns a deferred object', function () {
                expect(editor.done).to.be.a('function');
            });

            it('should call createEditorContainer API method during initialization', function (done) {
                editor.done(function () {
                    //fake implementation will append an iframe
                    expect(editorNode.find('iframe').length, 'fake element added to editorNode during initialization').to.equal(1);
                    done();
                });
            });

            it('should provide a setContent method', function () {
                expect(editor.setContent).to.be.a('function');
            });

            it('should provide a setPlainText method', function () {
                expect(editor.setPlainText).to.be.a('function');
            });

            it('should provide show and hide methods', function () {
                expect(editor.show).to.be.a('function');
                editor.show();
                expect(editorNode.find('#editor-1337').is(':visible'), 'editor node is visible').to.be.true;
                editor.hide();
                expect(editorNode.find('#editor-1337').is(':visible'), 'editor node is visible').to.be.false;
            });

            it('should provide a destroy method', function () {
                expect(editor.destroy).to.be.a('function');
            });

            describe('extends io.ox/mail/compose/actions/send', function () {
                var point = ext.point('io.ox/mail/compose/actions/send');

                it('should add "send-mailvelope" action', function (done) {
                    point.get('send-mailvelope', function (e) {
                        expect(e).to.be.defined;
                        expect(e.perform).to.be.a('function');
                        done();
                    });
                });
            });
        });
    });
});
