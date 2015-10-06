var modules = {}, usedby = {};

/**
 * remember loaded modules/dependencies
 */
require.onResourceLoad = function (context, module, dependencies) {
    if (module.name && !(module.name in modules)) {
        modules[module.name] = _.pluck(dependencies, 'id');
        //inversed dependency
        _.each(_.pluck(dependencies, 'id'), function (dep) {
            usedby[dep] = usedby[dep] || [];
            usedby[dep].push(module.name);
        });
    }
};

define('spec/shared/modules', function () {

    var tree = {}, update, self;
    /**
    * build dependency tree
    * @param  {string}  module id
    * @param  {object}  target
    * @param  {numeric} level level of recursion
    * @return { object}  root target
    */
    function traverse(module, target, level) {
        //reset when called without target
        target = target || (tree = {});
        level = level || 0;

        var current = {},
            children = usedby[module] || [];

        if (children.length) {
            //add
            target[module] = tree[module] = current;
            //recursion
            _.each(children, function (id) {
                if (typeof tree[id] !== 'undefined') {
                    //reuse already visited modules
                    current[id] = tree[id];
                } else {
                    traverse(id, current, level + 1);
                }
            });
        } else if (level !== 0) {
            //resolve
            return current;
        } else {
            //return root target
            return target;
        }
    }
    /**
     * ids of (directly/indirectly) consuming modules
     * @param  {string} module id
     * @param  {object} hash
     * @return { object} hash
     */
    function getConsumers(module, hash) {
        var children = Object.keys(tree[module] || {});
        //ignore root module
        if (!hash) {
            hash = {};
        } else {
            hash[module] = true;
        }
        //recursion
        _.each(children, function (id) {
            getConsumers(id, hash);
        });
        return Object.keys(hash);
    }

    self = {
        /**
         * list consumers
         * @param  {string} module id
         * @return { string} deep
         */
        list: function (id, deep) {
            traverse(id);
            return deep ? getConsumers(id) : usedby[id];
        },
        /**
         * list consumer tree
         * @param  {string} module id
         */
        tree: function (id) {
            traverse(id);
            return tree[id];
        },
        /**
         * reload modules consuming specified module
         */
        reload: function (id) {
            var def = $.Deferred(),
                consumers;
            //build dependency tree
            traverse(id);
            //get affected consumers
            consumers = getConsumers(id);
            //undefine
            _.each(consumers, function (id) {
                requirejs.undef(id);
            });
            //define again
            requirejs(consumers, function () {
                var args = arguments,
                data = {};
                //return fresh ones
                _.each(consumers, function (id, index) {
                    data[id] = args[index];
                });
                def.resolve(data);
            });
            return def;
        }
    };
    return self;
});