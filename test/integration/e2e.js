var should = require('should');

describe('Apple', function() {
    beforeEach(function() {
        this.apple = { sound: 'crunch' };
    });

    afterEach(function() {
        delete this.apple;
    });

    it('should go crunch', function() {
        this.apple.should.have.property('sound', 'crunch');
    });
});
