define('mailvelope/tour', [
    'mailvelope/main',
    'io.ox/core/api/account',
    'io.ox/core/tk/wizard',
    'settings!mailvelope',
    'gettext!pgp_mail'
], function (api, accountAPI, Tour, settings, gt) {
    'use strict';

    Tour.registry.add({
        id: 'mailvelope/initial_setup'
    }, function () {
        var def = $.Deferred();
        var tour = new Tour();
        var finished = false;

        if (api.loaded.state() === 'pending') {
            //assume mailvelope is not properly setup, yet
            tour.step()
                .title(gt('Install Mailvelope browser extension'))
                .content($('<div>').append(
                    gt('Please install the extension from'),
                    ' ',
                    $('<a href="https://www.mailvelope.com/" target="_blank">').text(gt('the Mailvelope web site.')),
                    ' ',
                    gt('Activate the extension now, to continue the setup')
                ))
                .beforeShow(function () {
                    var step = this;
                    step.toggleNext(false);

                    api.loaded.then(function () {
                        step.toggleNext(true);
                    }.bind(step));
                })
                .end();
        }

        var elementId = 'mailvelope-wizard-' + _.uniqueId();

        tour.step()
            .title('Generate cryptographic keys')
            .content($('<div>').attr({ id: elementId }).css('height', '250px'))
            .beforeShow(function () {
                this.toggleNext(false);
                $.when(api.getKeyring(), accountAPI.getAllSenderAddresses(), accountAPI.getPrimaryAddress())
                .then(function (keyring, allAddresses, primaryAddress) {
                    var ids = [].concat([primaryAddress], allAddresses.filter(function (user) {
                        //remove primary address
                        return !(user[1] === primaryAddress[1] && user[0] === primaryAddress[0]);
                    })).map(function (user) {
                        return {
                            email: user[1],
                            fullName: user[0]
                        };
                    });
                    var options = {
                        userIds: ids,
                        keySize: settings.get('defaultKeySize', 4096)
                    };
                    var def = $.Deferred();
                    keyring.createKeyGenContainer('#' + elementId, options).then(def.resolve, def.reject);

                    return def;
                }).then(function (generator) {
                    this.generator = generator;
                    this.toggleNext(true);
                    return generator;
                }.bind(this));
                //hide next button, we will define our own
                this.$el.find('[data-action=next]').hide();
                var step = this;
                this.footer(
                    $('<button class="btn btn-primary">')
                        .text(gt('Generate'))
                        .click(function (ev) {
                            //do not click twice
                            $(ev.target).prop('disabled', true);
                            //disable close actions
                            step.mandatory();

                            step.generator.generate().then(function () {
                                step.trigger('next');
                            }, function (err) {
                                if (err.code !== 'INPUT_NOT_VALID') throw(err);

                                $(ev.target).prop('disabled', false);
                            });
                        })
                );
            })
            .end();
        tour.step()
            .title(gt('Setup complete'))
            .content(gt('Congratulations! You have successfully set up encryption.'))
            .beforeShow(function () {
                //no going back from here
                this.toggleBack(false);
                finished = true;
            })
            .end();

        tour.on('stop', function () {
            if (def.state() === 'pending' && finished) return def.resolve();

            //last step not shown, guess user aborted
            def.reject({
                code: 'INCOMPLETE_SETUP'
            });
        });
        tour.start();

        return def;
    });

    return Tour.registry.get('mailvelope/initial_setup').get('run');
});
