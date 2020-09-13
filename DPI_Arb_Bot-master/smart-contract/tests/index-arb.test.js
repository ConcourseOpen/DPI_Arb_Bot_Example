const Arb = artifacts.require("DefipulaeIndexTrade");

contract('DefiPulseIndexTrade', function(accounts) {
  it("should put 10000 MetaCoin in the first account", function() {
    return MetaCoin.deployed().then(function(instance) {
      return instance.getBalance.call(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
    });
  });

  it("should call a function that depends on a linked library", function() {
    var arb;

    return Arb.deployed().then(function(instance) {
      dfp = instance;
      return meta.testFunction.call(accounts[0]);
    }).then(function(balance) {
      console.log(balance);
      assert.equal(balance, 55543);
    })
  });
});
