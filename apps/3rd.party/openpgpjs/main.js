define('3rd.party/openpgpjs/main', [
    'io.ox/core/notifications',
    '3rd.party/openpgpjs/openpgp'
], function (notifications) {

    window.showMessages = function (text) {
        var txt = $(text);
        txt = txt.text().replace(/^WARNING:/, '');
        notifications.yell('warning', txt);
    };
    /* global openpgp */
    return openpgp;
});
