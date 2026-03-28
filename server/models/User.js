const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  gender: {
    type: String,
    enum: ['female', 'prefer_not_to_say', 'other'],
    required: true
  },
  selfDeclaration: {
    type: Boolean,
    required: true,
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: 'Self declaration must be true to support women\'s safety'
    }
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit Indian phone number']
  },
  trustedContacts: {
    type: [{
      name: String,
      phone: String
    }],
    validate: {
      validator: function(v) {
        return v.length <= 3;
      },
      message: 'Maximum of 3 trusted contacts allowed'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  trustedContacts: [{
    name: String,
    phone: String
  }]
});

// Pre-save middleware to hash password
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
