// Copyright 2011 Joyent, Inc.  All rights reserved.

var fs = require('fs');

var uuid = require('node-uuid');

var sdcClients = require('../lib/index');
var CloudAPI = sdcClients.CloudAPI;


var LOGIN = 'admin';
var KNAME = 'rsa-1';
var client = null;
var publicKey = null;
var privateKey = null;



function _trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}



exports.setUp = function(test, assert) {
  sdcClients.setLogLevel('debug');
  client = new CloudAPI({
    url: 'http://localhost:8080',
    username: 'admin',
    password: 'joypass123'
  });

  var keyFile = process.env.SSH_KEY;
  if (!keyFile)
    keyFile = process.env.HOME + '/.ssh/id_rsa';

  publicKey = _trim(fs.readFileSync(keyFile + '.pub', 'ascii'));
  privateKey = fs.readFileSync(keyFile, 'ascii');
  assert.ok(publicKey);
  assert.ok(privateKey);

  test.finish();
};


///--- Account Tests

exports.test_get_account_no_acct_param = function(test, assert) {
  client.getAccount(function(err, account) {
    assert.ifError(err);
    assert.ok(account);
    assert.equal(account.id, '930896af-bf8c-48d4-885c-6573a94b1853');
    assert.equal(account.firstName, 'Admin');
    assert.equal(account.lastName, 'User');
    assert.equal(account.email, 'user@joyent.com');
    test.finish();
  });
};


exports.test_get_account = function(test, assert) {
  client.getAccount(LOGIN, function(err, account) {
    assert.ifError(err);
    assert.ok(account);
    assert.equal(account.id, '930896af-bf8c-48d4-885c-6573a94b1853');
    assert.equal(account.firstName, 'Admin');
    assert.equal(account.lastName, 'User');
    assert.equal(account.email, 'user@joyent.com');
    test.finish();
  });
};


exports.test_get_account_404 = function(test, assert) {
  client.getAccount(uuid(), function(err, account) {
    assert.ok(err);
    assert.equal(err.code, 'ResourceNotFound');
    assert.ok(err.message);
    test.finish();
  });
};


///--- Keys Tests

exports.test_create_key_no_acct_param_no_name = function(test, assert) {
  var object = {
    key: publicKey
  };
  client.createKey(object, function(err, key) {
    assert.ifError(err);
    assert.ok(key);
    assert.equal(key.name, KNAME);
    assert.equal(key.key, publicKey);
    client.deleteKey(KNAME, function(err) {
      assert.ifError(err);
      test.finish();
    });
  });
};


exports.test_create_key_account_name = function(test, assert) {
  var object = {
    name: 'cloudapi.test.js',
    key: publicKey
  };
  client.createKey(LOGIN, object, function(err, key) {
    assert.ifError(err);
    assert.ok(key);
    assert.equal(key.name, 'cloudapi.test.js');
    assert.equal(key.key, publicKey);
    client.deleteKey('cloudapi.test.js', function(err) {
      assert.ifError(err);
      test.finish();
    });
  });
};


exports.test_create_key_plain_key = function(test, assert) {
  client.createKey(LOGIN, publicKey, function(err, key) {
    assert.ifError(err);
    assert.ok(key);
    assert.equal(key.name, KNAME);
    assert.equal(key.key, publicKey);
    client.deleteKey(KNAME, function(err) {
      assert.ifError(err);
      test.finish();
    });
  });
};


exports.test_create_key_account_404 = function(test, assert) {
  var object = {
    name: 'cloudapi.test.js',
    key: publicKey
  };
  client.createKey(uuid(), publicKey, function(err, key) {
    assert.ok(err);
    assert.ok(!key);
    assert.equal(err.code, 'ResourceNotFound');
    assert.ok(err.message);
    test.finish();
  });
};


exports.test_create_key_bad_key = function(test, assert) {
  client.createKey(uuid(), function(err, key) {
    assert.ok(err);
    assert.ok(!key);
    assert.equal(err.code, 'InvalidArgument');
    assert.ok(err.message);
    test.finish();
  });
};


exports.test_create_key_dup_key = function(test, assert) {
  client.createKey(publicKey, function(err, key) {
    assert.ifError(err);
    assert.ok(key);
    assert.equal(key.name, KNAME);
    assert.equal(key.key, publicKey);

    client.createKey(publicKey, function(err, key) {
      assert.ok(err);
      assert.ok(!key);
      assert.equal(err.code, 'InvalidArgument');
      assert.ok(err.message);
      // Note we're leaving the key in place for the rest
      // of the tests
      test.finish();
    });
  });
};


exports.test_list_keys_no_acct_param = function(test, assert) {
  client.listKeys(function(err, keys) {
    assert.ifError(err);
    assert.ok(keys);
    assert.equal(keys.length, 1);
    assert.equal(keys[0].name, KNAME);
    assert.equal(keys[0].key, publicKey);
    test.finish();
  });
};


exports.test_list_keys = function(test, assert) {
  client.listKeys(LOGIN, function(err, keys) {
    assert.ifError(err);
    assert.ok(keys);
    assert.equal(keys.length, 1);
    assert.equal(keys[0].name, KNAME);
    assert.equal(keys[0].key, publicKey);
    test.finish();
  });
};


exports.test_list_keys_404 = function(test, assert) {
  client.listKeys(uuid(), function(err, keys) {
    assert.ok(err);
    assert.equal(err.code, 'ResourceNotFound');
    assert.ok(err.message);
    test.finish();
  });
};


exports.test_get_key_no_acct_param = function(test, assert) {
  client.getKey(KNAME, function(err, key) {
    assert.ifError(err);
    assert.ok(key);
    assert.equal(key.name, KNAME);
    assert.equal(key.key, publicKey);
    test.finish();
  });
};


exports.test_get_key_no_acct_param_obj = function(test, assert) {
  var obj = {
    name: KNAME,
    key: publicKey
  };
  client.getKey(obj, function(err, key) {
    assert.ifError(err);
    assert.ok(key);
    assert.equal(key.name, KNAME);
    assert.equal(key.key, publicKey);
    test.finish();
  });
};


exports.test_get_key_acct = function(test, assert) {
  client.getKey(LOGIN, KNAME, function(err, key) {
    assert.ifError(err);
    assert.ok(key);
    assert.equal(key.name, KNAME);
    assert.equal(key.key, publicKey);
    test.finish();
  });
};


exports.test_get_key_acct_404 = function(test, assert) {
  client.getKey(uuid(), KNAME, function(err, key) {
    assert.ok(err);
    assert.ok(!key);
    assert.equal(err.code, 'ResourceNotFound');
    assert.ok(err.message);
    test.finish();
  });
};


exports.test_get_key_404 = function(test, assert) {
  client.getKey(uuid(), function(err, key) {
    assert.ok(err);
    assert.ok(!key);
    assert.equal(err.code, 'ResourceNotFound');
    assert.ok(err.message);
    test.finish();
  });
};


exports.tearDown = function(test, assert) {
  client.listKeys(function(err, keys) {
    assert.ifError(err);
    if (!keys || !keys.length)
      return test.finish();

    var done = 0;
    keys.forEach(function(k) {
      client.deleteKey(k, function(err) {
        assert.ifError(err);
        if (++done >= keys.length)
          test.finish();
      });
    });
  });
};
