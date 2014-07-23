define('fixture', {
    load: function (name, parentRequire, load, config) {
        if (name.substr(-5, 5) === '.json') {
            return $.getJSON('/base/spec/fixtures/' + name).then(
                load,
                function fail() {
                    // this simple line might save life time
                    console.log('Cannot load/parse fixture', name, arguments);
                    load.error.apply(load, arguments);
                }
            );
        }
        if (name.substr(-4, 4) === '.txt') {
            return $.get('/base/spec/fixtures/' + name).then(load, load.error);
        }
        return require(['/base/spec/fixtures/' + name], load, load.error);
    }
});
