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

        it('should add the lock item to mail compose fields', function (done) {
            var pointDefined = ext.point('io.ox/mail/compose/fields').has('toggle-encryption');
            expect(pointDefined).to.be.true;
            ext.point('io.ox/mail/compose/fields').get('toggle-encryption', function (p) {
                expect(p.draw, 'draw method').to.be.a('function');
                done();
            });
        });

        it('should register editorMode/encrypt event handlers for mail compose view/model', function (done) {
            ext.point('io.ox/mail/compose/fields').get('toggle-mailvelope', function (p) {
                expect(p.draw, 'draw method').to.be.a('function');
                var baton = new ext.Baton({
                    view: new Backbone.View(),
                    model: new Backbone.Model({
                        editorMode: 'text'
                    })
                });
                baton.view.model = baton.model;
                p.draw(baton);
                baton.model.set('encrypt', true);
                expect(baton.model.get('editorMode')).to.equal('mailvelope');
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
                    return $.when(window.mailvelope);
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
                var extension, baton;

                beforeEach(function (done) {
                    baton = new ext.Baton({
                        model: new Backbone.Model({
                            editorMode: 'mailvelope',
                            to: [['James Kirk', 'captain@enterprise']],
                            cc: [['Leonard McCoy', 'bones@enterprise']],
                            bcc: [['NSA', 'spy@starfleet']]
                        }),
                        view: {
                            getEditor: function () {
                                return $.when(editor);
                            }
                        }
                    });

                    baton.model.setContent = function (text) {
                        expect(text).to.equal('Some example text from mailvelope');
                    };
                    baton.model.getContent = function (text) {
                        return 'Some example text from mailvelope';
                    };

                    point.get('send-mailvelope', function (e) {
                        extension = e;
                        done();
                    });
                });
                afterEach(function () {
                    extension = undefined;
                    baton = undefined;
                });

                it('should add "send-mailvelope" action', function () {
                    expect(extension).to.be.defined;
                    expect(extension.perform).to.be.a('function');
                });

                //do not run in PhantomJS, since it does not provide TextEncode/TextDecode API
                if (_.device('PhantomJS')) return;
                it('should encrypt for all recipients', function () {
                    window.mailvelope.encrypt = function (recipients) {
                        expect(recipients).to.contain('captain@enterprise');
                        expect(recipients).to.contain('bones@enterprise');
                        expect(recipients).not.to.contain('spy@starfleet');
                        return $.when('Some example text from mailvelope');
                    };

                    return extension.perform(baton);
                });

                it('should fail when encryption is not possible', function () {
                    window.mailvelope.encrypt = function (recipients) {
                        expect(recipients).to.contain('captain@enterprise');
                        expect(recipients).to.contain('bones@enterprise');
                        expect(recipients).not.to.contain('spy@starfleet');
                        return $.Deferred().reject({ message: 'undefined example error' });
                    };

                    ext.point('io.ox/mail/compose/actions/send').extend({
                        id: 'errors',
                        perform: function (baton) {
                            expect(baton.error).to.equal('undefined example error');
                            return $.when();
                        }
                    });

                    return extension.perform(baton).then(_.identity, function () {
                        expect(baton.isPropagationStopped(), 'point propagation is stopped').to.be.true;
                        //yes, we are good!
                        return $.when();
                    });
                });
            });

            describe('key status extension for tokenfield', function () {
                //TODO: implement me, once this feature gets ironed out
                it('should indicate, that a key is known');

                it('should indicate, that a key is not known');
            });
        });
    });
});
