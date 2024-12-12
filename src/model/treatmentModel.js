const mongoose = require('mongoose')
const treatmentSchema = new mongoose.Schema({
       treatment_id : {
            type : String
       },

        patientId : {
                type : String,
                ref : 'patientModel'
        },
         patient_name : {
                 type : String
         },
       
        treatment_course_id : {
                   type : mongoose.Schema.Types.ObjectId
        },
        treatment_course_name : {
                   type : String
        },

        services : [{
                   serviceId : String,
                   serviceName : String,
                   price : Number,
                   duration : String
        }],

        totalCharge : Number,
        duePayment :{
                  type : Number ,
                  default : 0
        } ,

         payment_details : [{
                    paid_amount : Number ,                    
                    paymentMethod : String ,
                    payment_Date : Date
         }],
                  
        
         
        hospital : [{
            hospital_id : {
                type : mongoose.Schema.Types.ObjectId
                },

                hospital_Name : {
                       type : String
               },  
               hospital_charge : {
                   type : Number
               },

                     }],
       
          appointments : [{
                appointmentId : String ,
                appointment_Date : String ,
                disease_name : String,
                status : String

        }],  

       
            status : {
                 type : String,
                 enum : ['New' , 'Schedule' , 'Follow-Up' ,  'Complete'],
                 default : 'New'
            },
} , { timestamps : true })

const treatmentModel =  mongoose.model('treatment' , treatmentSchema)

module.exports = treatmentModel