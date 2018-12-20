var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
    },
    isOver           : Boolean,
    locateboat       : [{
        x                :Number,
        y                :Number,
        isBoat           :Boolean,
        isBreak          :Boolean,
        isShoot          :Boolean
    }],
    isTurn           :Boolean,
    enemyId          : String
   /* locateEnemy      :[{
    x                :Number,
    y                :Number,
    isShoot          :Boolean,
    isBoat           :Boolean
}]*/

});

// C�c phuong th?c ======================
// T?o m� h�a m?t kh?u
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// ki?m tra m?t kh?u c� tr�ng kh?p
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


module.exports = mongoose.model('User', userSchema);