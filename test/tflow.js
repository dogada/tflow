'use strict';

var tflow = require('../tflow');
var expect = require('chai').expect;

describe('tflow', function () {

  function expectArgs(actual, expected) {
    expect(Array.prototype.slice.call(actual)).eql(expected);
  }

  function echo(arg, done) {
    done(null, arg)
  }

  it('should run task in series and then execute callback if it\'s present', function() {
    tflow([
      function() {
        expectArgs(arguments, []);
        this(null, 'one');
      },
      function(arg) {
        expect(arg).to.equal('one');
        expectArgs(arguments, ['one']);
        this(null, 'first', 'second', 'third');
      },
      function(first, second) {
        expect(first).to.equal('first');
        expect(second).to.equal('second');
        expectArgs(arguments, ['first', 'second', 'third']);
        this(null, 'done');
      }
    ], function(err, arg) {
      expectArgs(arguments, [null, 'done']);
    });
  });

  it('should not call next task if previous finished with an error', function() {
    tflow([
      function() {
        expectArgs(arguments, []);
        this('first task error');
      },
      function(arg) {
        // should not be called
        expect(false).to.equal(true);
      }
    ], function(err, arg) {
      expectArgs(arguments, ['first task error']);
    });
  });

  it('can stop tasks flow on any stage', function() {
    function done(err, arg) {
      expectArgs(arguments, [null, 'from first task']);
    }
    
    tflow([
      function() {
        done(null, 'from first task');
      },
      function(arg) {
        // should not be called
        expect(false).to.equal(true);
      }
    ], function(err, arg) {
      // should not be called
      expect(false).to.equal(true);
    });
  });

  it('should handle single task with callback', function() {
    tflow([
      function() {
        expectArgs(arguments, []);
        this(null, 'done');
      }
    ], function(err, arg) {
      expectArgs(arguments, [null, 'done']);
    });
  });

  it('should handle single task without callback', function() {
    tflow([
      function() {
        expectArgs(arguments, []);
        this(null);
      }
    ]);
  });

  it('should handle empty tasks with callback', function() {
    tflow([
    ], function(err) {
      expectArgs(arguments, [null]);
    });
  });

  it('should handle empty tasks without callback', function() {
    tflow([]);
  });


  it('should throw an error if called without tasks array', function() {
    expect(function() {
      tflow();
    }).to.throw('tflow requires array of tasks as first argument.');
  });

  it('this.next(arg) send arg to next task, same as this(next, arg)', function() {
    tflow([
      function() {
        this.next('arg');
      },
      function() {
        expectArgs(arguments, ['arg']);
        this(null, 'done');
      },
    ], function(err, arg) {
      expectArgs(arguments, [null, 'done']);
    });
  });

  it('this.fail(err) completes task flow with error, same as this(err)', function() {
    tflow([
      function() {
        this.fail('Failed');
      },
      function() {
        // should no be executed
        expect(false).to.equal(true);
      },
    ], function(err, arg) {
      expectArgs(arguments, ['Failed']);
    });
  });

  it('this.done(arg) completes task flow and sends result to main callback', function(done) {
    tflow([
      function() {
        this.done('OK');
      },
      function() {
        // should not be executed
        expect(false).to.equal(true);
      },
    ], function(err, arg) {
      expectArgs(arguments, [null, 'OK']);
      done();
    });
  });

  it('test function echo(arg, done) should pass arg to callback', function(done) {
    tflow([
      function() {
        echo('Test echo', this);
      },
    ], function(err, arg) {
      expectArgs(arguments, [null, 'Test echo']);
      done();
    });
  });

  it('this.result(arg1, arg2, ...) should create callback that will receive arg1 and arg2 always', function(done) {
    tflow([
      function() {
        this.next('First');
      },
      function(arg) {
        echo('Second', this.result(arg))
      },
    ], function(err, arg) {
      expectArgs(arguments, [null, 'First']);
      done();
    });
  });

  it('this.prepend(1, 2) should prepend 1, 2 to result of parent callback', function(done) {
    tflow([
      function() {
        echo('First', this.prepend(1, 2));
      },
      function(one) {
        expectArgs(arguments, [1, 2, 'First']);
        this.done(one)
      },
    ], function() {
      expectArgs(arguments, [null, 1]);
      done();
    });
  });

  it('this.append(1, 2) should append 1, 2 to result of parent callback', function(done) {
    tflow([
      function() {
        echo('First', this.append(1, 2));
      },
      function(one) {
        expectArgs(arguments, ['First', 1, 2]);
        this.next(one)
      },
    ], function() {
      expectArgs(arguments, [null, 'First']);
      done();
    });
  });

});
