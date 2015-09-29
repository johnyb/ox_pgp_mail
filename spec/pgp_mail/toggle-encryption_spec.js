define([
    'pgp_mail/toggle-encryption'
],function (ToggleEncryption) {
    describe('Toggle Encryption Button', function () {
        describe('View', function () {
            it('should render an icon', function () {
                var v = new ToggleEncryption.View({
                    model: new Backbone.Model()
                });
                v.render();
                expect(v.$('i.fa').length, 'one font-awesome icon found').to.equal(1);
                expect(v.$('.encrypted').length, 'no encrypted class found').to.equal(0);
            });

            it('should add encryption class if encrypted', function () {
                var v = new ToggleEncryption.View({
                    model: new Backbone.Model({
                        encrypt: true
                    })
                });
                v.render();
                expect(v.$('i.fa').length, 'one font-awesome icon found').to.equal(1);
                expect(v.$('.encrypted').length, 'encrypted class found').to.equal(1);
            });

            it('should toggle encryption class if model changes', function () {
                var v = new ToggleEncryption.View({
                    model: new Backbone.Model()
                });
                v.render();
                expect(v.$('i.fa').length, 'one font-awesome icon found').to.equal(1);
                expect(v.$('.encrypted').length, 'encrypted class found').to.equal(0);
                v.model.set('encrypt', true);
                expect(v.$('i.fa').length, 'one font-awesome icon found').to.equal(1);
                expect(v.$('.encrypted').length, 'encrypted class found').to.equal(1);
            });

            it('should toggle encryption class on click', function () {
                var v = new ToggleEncryption.View({
                    model: new Backbone.Model()
                });
                v.render();
                expect(v.$('i.fa').length, 'one font-awesome icon found').to.equal(1);
                expect(v.$('.encrypted').length, 'encrypted class found').to.equal(0);
                v.$('i.fa').click();
                expect(v.$('i.fa').length, 'one font-awesome icon found').to.equal(1);
                expect(v.$('.encrypted').length, 'encrypted class found').to.equal(1);
            });
        });
    });
});
