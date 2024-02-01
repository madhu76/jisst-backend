const mongoose = require('mongoose');
const newfilesubmissionSchema = new mongoose.Schema(
    {

        ref_id: {
            type: String
        },
        filename: {
            type: String
        },
        avatar: {
            type: String
        },
        cloudinary_id: {
            type: String
        }

    }
);
const NewFilesubmission = mongoose.model('newfilesubmission', newfilesubmissionSchema);
module.exports = NewFilesubmission;