var assert = require("assert")

calculator = {
  SumarNumero: function(a, b){
    return a + b;
  },

  RestarNumero: function(a, b){
    return a - b;
  }

}

describe('Calculadora', function() {
it('Deberia sumar dos numeros', function () {
assert.equal(5, calculator.SumarNumero(2, 3));
assert.equal(9, calculator.SumarNumero(3, 6));
});

it('Deberia restar dos numeros', function () {
assert.equal(5, calculator.RestarNumero(8, 3));
assert.equal(3, calculator.RestarNumero(9, 6));
});
});