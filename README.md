# tflow - t(his)flow or t(ask)flow. 

Runs an array of functions in series, each passing their results to the next
in the array. However, if any of the functions pass an error to the callback,
the next function is not executed and the callback is immediately called
with the error.

Does same thing as async-waterflow or async.waterflow but
tasks use `this` as callback instead of last argument. It has several
advantages:
 - All tasks use same `this` object that references current task flow, so you
can use it as temporary storage of task results and exchange results between
tasks.
 - You don't need to declare callback for each task and always use `this`
instead.
 - You can use this.next and this.fail for better readibility and automaticaly
wrapping of string errors to errors with stacktraces.
 - It's possible to log all application callback errors in single place.

Example of usage:

```js

var tflow = require('tflow')

function makeGuid(data, done) {
  var guid;
  tflow([
    function() {
      if (data.addr && (data.host || data.user)) return this.fail('guid.make: addr and user&host are mutually exclusive.')
      if (!data.addr && !data.host) return this.fail('guid.make: addr or host are required.')
      if (!data.path) return this.fail('guid.make: path is required.')
      this.next();
    },
    function() {
      if (data.addr) guid = data.addr
      else if (data.user) guid = data.user + '@' + data.host
      else guid = data.host

      guid += '/' + data.path;
      //ensure we can parse just made guid
      parse(guid, this);
    },
    function(parsed) {
      this.done(guid);
    },
  ], done);
}
        
```


