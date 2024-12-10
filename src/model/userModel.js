const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
       
          name  : {
                type : String
          },
          email : {
               type : String
             
               
          },
          phone_no : {
               type : Number
          },
          profileImage : {
               type : String
          },
          gender : {
               type : String,
               enum : ['Female' , 'Male' , 'Other']
          },
          role : {
                type : String,
               enum : ['Admin' , 'Manager' , 'Receptionist' ]
          },
          password : {
               type : String
          },
         
          status : {
              type : Number,
              enum : [1 , 0 ],
              default : 1
          } ,

          refreshToken : String
} , { timestamps : true })

const userModel = mongoose.model('user', userSchema)

module.exports = userModel