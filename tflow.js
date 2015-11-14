'use strict';

/**
   Return next tick function for current environment.
*/
function nextTickFn() {
  // setImmediate allows to run task after already queued I/O callbacks
  if (typeof setImmediate === 'function') {
    return setImmediate;
  } else if (typeof process !== 'undefined' && process.nextTick) {
    return function(fn) {
      process.nextTick(fn);
    }
  } else {
    return function(fn) {
      setTimeout(fn, 0);
    }
  }
}

var nextTick = nextTickFn();

/**
   tflow - t(his)flow or t(ask)flow. 

   Runs an array of functions in series, each passing their results to the next
   in the array. However, if any of the functions pass an error to the callback,
   the next function is not executed and the callback is immediately called
   with the error.
   
   @params {Array<function>} tasks Tasks to run in series.
   @param {function} [callback] Function to run after last task or after failure
   of any task.
*/
function tflow(tasks, callback) {
  if (!Array.isArray(tasks)) {
    throw new Error('tflow requires array of tasks as first argument.');
  }

  var current = 0;

  function taskCallback(err) {
    if (err) {
      //if (tflow.log) tflow.log(err);
      return complete([err]);
    }
    nextTask(arguments);
  }

  function complete(args) {
    if (callback) {
      nextTick(function () {
        callback.apply(taskCallback, args);
      });
    }
  }

  function slice(args, start) {
    return Array.prototype.slice.call(args, start || 0)
  }

  function nextTask(args) {
    if (current < tasks.length) {
      var task = tasks[current++];
      // call next task with result of previous task
      nextTick(function() {
        task.apply(taskCallback, slice(args, 1));
      });
    } else {
      complete(args);
    }
  }


  // optional shortcats this.next and this.fail
  // useful for browsers where there is no Node-style callbacks
  taskCallback.next = function() {
    taskCallback.apply(taskCallback, [null].concat(slice(arguments)));
  };

  // complete task flow and send result to main callback 
  taskCallback.complete = function() {
    complete([null].concat(slice(arguments)));
  };

  //backward compatible
  taskCallback.done = taskCallback.complete
  
  // complete task flow with an error
  taskCallback.fail = function(status, err) {
    if (!err) {
      err = status
      status = undefined
    }
    var error = (typeof err === 'string') ? new Error(err) : err;
    if (status) error.status = status
    complete([error]);
  };

  // return callback that will send predefined arguments to next callback
  taskCallback.send = function() {
    var args = slice(arguments)
    return function(err) {
      taskCallback.apply(taskCallback, [err].concat(args));
    }
  };

  // return callback that will preppend some predefined arguments to the result 
  taskCallback.join = function() {
    var args = slice(arguments)
    return function(err) {
      taskCallback.apply(taskCallback, [err].concat(args).concat(slice(arguments, 1)));
    }
  };


  //reset result container on the start of flow
  taskCallback.data = {};
  // start the chain of tasks
  taskCallback(null);
}

module.exports = tflow;
