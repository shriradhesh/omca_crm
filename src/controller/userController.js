const userModel = require('../model/userModel')
const bcrypt = require('bcryptjs')
const jwt =  require('jsonwebtoken')
const user_Email = require('../utils/userEmail')
const hospitalModel = require('../model/hospitalModel')
const patientModel = require('../model/patientModel')
const ExcelJs = require("exceljs");
const appointmentModel = require('../model/appointmentModel')
const treatement_course_model = require('../model/treatment_course_Model')
const { blacklistToken } = require('../middleware/blacklistToken');
const treatmentModel = require('../model/treatmentModel')
const enquiryModel = require('../model/enquiryModel')
const serviceModel = require('../model/serviceModel')
const mongoose = require('mongoose')
const chatModel = require('../model/chatModel')
 





                                                     /*  User section */

    // Api for add staff user

    const add_staff_user = async (req, res) => {
        try {
            const { name, email, phone_no, gender, role, password } = req.body;
            const requiredFields = ['name', 'email', 'phone_no', 'gender', 'role', 'password'];
    
            // Check for required fields
            for (let field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ success: false, message: `Required ${field.replace('_', ' ')}` });
                }
            }
    
            // Check if user already exists
            const exist_user = await userModel.findOne({ email });
            if (exist_user) {
                return res.status(400).json({ success: false, message: `User already exists with the email: ${email}` });
            }
    
            // Handle profile image if provided
            let profileImage = '';
            if (req.file) profileImage = req.file.filename;
    
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);  
           
    
            // Create new user
            const newUser = new userModel({
                name, email, gender, phone_no, role, password: hashedPassword, profileImage , userLogs : []
            });
    
           
            await newUser.save();
    
            return res.status(200).json({
                success: true,
                message: `${role} added successfully`,
                details: newUser
            });
    
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message
            });
        }
    };
    

    // Api for login
      const login = async( req , res )=> {
            try {
                   const { email , password } = req.body
                   // check for required fields
                   if(!email)
                   {
                    return res.status(400).json({
                           success : false ,
                           message : 'Required Email'
                    })
                   }

                   if(!password) 
                   {
                    return res.status(400).json({
                          success : false ,
                          message : 'passsword'
                    })
                   }

                   // check for user 
                   const user = await userModel.findOne({ email })
                   if(!user)
                   {
                    return res.status(400).json({
                           success : false ,
                           message : 'User Not Found'
                    })
                   }

                   // check for password match

                   const isPasswordMatch = await bcrypt.compare(password , user.password)
                   if(!isPasswordMatch)
                   {
                    return res.status(400).json({
                           success : false ,
                           message : 'Password Incorrect'
                    })
                   }
              
                    // Generate JWT token
                    const token = jwt.sign(
                      { id: user._id, role: user.role }, 
                      process.env.JWT_SECRET,
                      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
                  );
                  
                     // Generate Refresh Token (Long-Lived)
                const refreshToken = jwt.sign(
                  { id: user._id },
                  process.env.REFRESH_TOKEN_SECRET,
                  { expiresIn: '30d' } 
              );

              user.refreshToken = refreshToken;
              
                   
                      
                             const now = new Date();
                          const loginTime = now.toLocaleTimeString('en-US', {
                            hour12: false, 
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          });
                      
                          user.userLogs.push({
                            date : now ,
                            loginTime : loginTime,
                          })
               
                          await user.save()

                          if (user.userLogs && user.userLogs.length >= 2) {
                            let a = user.userLogs[user.userLogs.length - 2];
                            let b = user.userLogs[user.userLogs.length - 1];
                            
                            if (a && b && a.logoutTime === '') {
                              a.logoutTime = b.loginTime;
                            }
                          } else {
                            console.error("Insufficient logs or userLogs is undefined");
                          }
                          

                          await user.save()
                        
                    
                          //  // token expire time

                          //  const expiration = new Date(now.getTime() + 60 * 60 * 1000); 
                          //   const expireTime = expiration.toLocaleTimeString('en-US', {
                          //     hour12: false,
                          //     hour: '2-digit',
                          //     minute: '2-digit',
                          //     second: '2-digit',
                          //   });
                                if(user.role === 'Admin')
                                {
                                  return res.status(200).json({

                                    success : true ,
                                    message : `${user.role} login Successfully`,
                                    details : {
                                            _id : user._id ,
                                            name : user.name ,
                                            email : user.email ,
                                            phone_no : user.phone_no ,
                                            profileImage : user.profileImage,
                                            gender : user.gender ,
                                            role : user.role ,
                                            password : user.password ,
                                            status : user.status ,
                                            refreshToken : user.refreshToken,
                                            userLogs : user.userLogs
        
                                    } , 
                                    token : token,
                                    loginTime : loginTime ,
                                    // token_expire_time : expireTime
                            })
                                }
                                else
                                {
                                  return res.status(200).json({

                                    success : true ,
                                    message : `${user.role} login Successfully`,
                                    details : {
                                            _id : user._id ,
                                            name : user.name ,
                                            email : user.email ,
                                            phone_no : user.phone_no ,
                                            profileImage : user.profileImage,
                                            gender : user.gender ,
                                            role : user.role ,
                                            password : user.password ,
                                            status : user.status ,
                                            refreshToken : user.refreshToken,
                                          
        
                                    } , 
                                    token : token,
                                    loginTime : loginTime ,
                                    // token_expire_time : expireTime
                            })
                                }
                   
            } catch (error) {
                 return res.status(500).json({
                       success : false ,
                       message : 'Server error',
                       error_message : error.message
                 })
            }
      }


  // Api for logout 
  const logout = async (req, res) => {
    try {
      const { token } = req.body; 

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const userId = decoded.id;
  
      // Find the user by ID
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User Not Found',
        });
      }
  
      // Check if the user has any login logs
      if (user.userLogs.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No login logs found for this user',
        });
      }

      const latestLog = user.userLogs[0]; 
  
      // Add logout time to the latest log
      const now = new Date();
      const logoutTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
  
      latestLog.logoutTime = logoutTime; 
  
      // Save the updated user document
      await user.save();
  
      // Respond with a success message
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
       
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error_message: error.message,
      });
    }
  };

  
    
    // Api for get all user staffs
        const get_all_user_staffs = async( req , res )=> {
               try {
                        const user_staff = await userModel.find({ role : { $ne :'Admin'} }).sort({ createdAt : -1 }).lean()
                        if(!user_staff)
                        {
                            return res.status(400).json({
                                   success : false ,
                                   message : 'No Staff Found'
                            })
                        }

                        return res.status(200).json({
                               success : true ,
                               message : 'All user Staff',
                               Details : user_staff
                        })
               } catch (error) {
                    return res.status(500).json({
                           success : false ,
                           message : 'Server error',
                           error_message : error.message
                    })
               }
        }
                 

    // Api for get details
         const get_details = async ( req , res )=> {     
               try { 
                        const userId = req.params.userId
                        if(!userId)
                        {
                            return res.status(400).json({
                                  success : false ,
                                  message : 'User Id Required'
                            })
                        }

                          // check for user
                          const user = await userModel.findOne({ _id : userId })
                          if(!user)
                          {
                            return res.status(400).json({
                                   success : false ,
                                   message : `User Not Found`
                            })
                          }
                             
                             
                             
                              return res.status(200).json({
                                success : true ,
                                message : `${user.role} Detail`,
                                Details : {
                                  _id : user._id ,
                                  name : user.name,
                                  email : user.email,
                                  phone_no : user.phone_no,
                                  profileImage : user.profileImage ,
                                  gender : user.gender ,
                                  role : user.role ,
                                  password : user.password ,
                                  status : user.status,
                                  
                                  
                                }
                              }) 
                             

                        
               } catch (error) {
                   return res.status(500).json({
                        success : false ,
                        message : 'Server error',
                        error_message : error.message
                   })
               }
         }
             
    // Api for update details
        const update_details = async ( req , res )=> {
               try {
                    const { userId } = req.params
                    const { name , email , phone_no , gender } = req.body
                    // check for userId
                    if(!userId)
                        {
                              return res.status(400).json({
                                   success : false ,
                                   message : 'User Id Required'
                              })
                        }  

                    // check for user
                    const user = await userModel.findOne({ _id : userId })
                    if(!user)
                    {
                        return res.status(400).json({
                              success : false ,
                              message : 'User Not Found '
                        })
                    }

                       if(name)
                       {
                           user.name = name
                       }
                       
                       if(email)
                        {
                            user.email = email
                        }
                        
                       if(phone_no)
                        {
                            user.phone_no = phone_no
                        }
                        
                       if(gender)
                        {
                            user.gender = gender
                        }
                        if(req.file)
                        {
                             user.profileImage = req.file.filename
                        }

                        await user.save()

                        return res.status(200).json({
                              success : true ,
                              message : 'Details updated',
                              details : user
                        })
               } catch (error) {
                   return res.status(500).json({
                       success : false ,
                       message : 'Server error',
                       error_message : error.message
                   })
               }
        }

        const change_user_password = async (req, res) => {
            try {
              const userId  = req.params.userId ;
              const { oldPassword, newPassword, confirmPassword } = req.body;
          
              // Check for user ID
              if (!userId) {
                return res.status(400).json({
                  success: false,
                  message: 'userId is required',
                });
              }
          
              // Check if user exists
              const user = await userModel.findOne({ _id : userId });
              if (!user) {
                return res.status(400).json({
                  success: false,
                  message: 'user not found',
                });
              }
          
              // Validate required fields
              const requiredFields = ['oldPassword', 'newPassword', 'confirmPassword'];
              for (let field of requiredFields) {
                if (!req.body[field]) {
                  return res.status(400).json({
                    success: false,
                    message: `Required field ${field.replace("_", " ")} is missing`,
                  });
                }
              } 
          
              // Validate new password match
              if (newPassword !== confirmPassword) {
                return res.status(400).json({
                  success: false,
                  message: 'New password and confirm password do not match',
                });
              }
          
              // Validate old password
              const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
              if (!isOldPasswordValid) {
                return res.status(400).json({
                  success: false,
                  message: 'Old password is incorrect',
                });
              }
          
              // Hash the new password
              const hashedNewPassword = await bcrypt.hash(newPassword, 10);
          
              // Update the user's password
              user.password = hashedNewPassword;
          
              // Email content
              const emailContent = `
                <p style="text-align: center; font-size: 20px; color: #333; font-weight: 600; margin-bottom: 30px;">Congratulations! Your Password Has Been Changed</p>
                <p style="text-align: center; font-size: 16px; color: #666; margin-bottom: 20px;">Here are your updated account details:</p>
                <div style="display: flex; justify-content: center; align-items: center;">
                  <div style="width: auto; max-width: 500px; background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr style="background-color: #fff;">
                        <td style="padding: 14px 20px; text-align: left; font-weight: 600; font-size: 16px; border-bottom: 1px solid #e0e0e0;">Email:</td>
                        <td style="padding: 14px 20px; text-align: left; font-size: 16px; border-bottom: 1px solid #e0e0e0;">${user.email}</td>
                      </tr>
                      <tr style="background-color: #fff;">
                        <td style="padding: 14px 20px; text-align: left; font-weight: 600; font-size: 16px; border-bottom: 1px solid #e0e0e0;">Phone No:</td>
                        <td style="padding: 14px 20px; text-align: left; font-size: 16px; border-bottom: 1px solid #e0e0e0;">${user.phone_no}</td>
                      </tr>
                      <tr style="background-color: #fff;">
                        <td style="padding: 14px 20px; text-align: left; font-weight: 600; font-size: 16px;">Password:</td>
                        <td style="padding: 14px 20px; text-align: left; font-size: 16px;">${newPassword}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              `;
          
              // Send email to the user
              await user_Email(user.email, 'Password Changed Successfully', emailContent);
          
              // Save the updated user record
              await user.save();
          
              return res.status(200).json({
                success: true,
                message: 'Password changed successfully',
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message,
              });
            }
          };

          // Api for active inactive staff user
             const active_inactive_staff_user = async (req , res )=> {
                    try {
                            const staff_user_id = req.params.staff_user_id
                            // check for staff user id
                            if(!staff_user_id)
                            {
                                return res.status(400).json({
                                       success : false ,
                                       message : 'Staff User Id Required'
                                })
                            }

                            // check for staff user
                            const staff_user = await userModel.findOne({ _id : staff_user_id , role : { $ne : 'Admin' }})
                            if(!staff_user)
                            {
                                return res.status(400).json({
                                       success : false ,
                                       message : 'No User Found'
                                })
                            }
                                   let message = ''
                                if(staff_user.status === 0)
                                {
                                      staff_user.status = 1
                                      message = `${staff_user.role} is Active`
                                }
                                else
                                {
                                    staff_user.status = 0
                                      message = `${staff_user.role} is Inactive`
                                }

                                  await staff_user.save()

                                  return res.status(200).json({
                                       success : true,
                                       message : message
                                  })

                         
                    } catch (error) {
                        return res.status(500).json({
                              success : false ,
                              message : 'Server error',
                              error_message : error.message
                        })
                    }
             }
                                                          /* Hospital Section */

      // Api for add Hospital 

          const add_hospital = async( req , res )=> {
                try {
                       const { hospitalName , location , hospitalCode , contact } = req.body

                       // check for require fields
                           const requiredFields = ['hospitalName' , 'location' , 'hospitalCode' , 'contact' ]
                           for( const field of requiredFields )
                           {
                                if( !req.body[field])
                                {
                                    return res.status(400).json({  success : false ,
                                         message : `Required ${field.replace('_',' ')}`
                                    })
                                }
                           }

                           // check for already exist hospital
                              const exist_hospital = await hospitalModel.findOne({ hospitalCode })
                              if(exist_hospital)
                              {
                                return res.status(400).json({
                                       success : false , 
                                       message : 'Hospital Already Exist'
                                })
                              }

                              const hospitalImage = req.file.filename 
                            // add new Record
                            const add_new_hospital = new hospitalModel({
                                   hospitalName,
                                   location ,
                                   hospitalCode,
                                   contact,
                                   hospitalImage : hospitalImage,
                                   PatientAssigned : []
                            })

                            await add_new_hospital.save()
                            return res.status(200).json({
                                  success : true ,
                                  message : 'New Hospital addedd successfully',
                                  details : add_new_hospital
                            })

                } catch (error) {
                      return res.status(500).json({
                          success : false,
                          message : 'Server error',
                          error_message : error.message
                      })
                }
          }

// Api for get all Hostpital 
          const getAll_hospital = async( req , res)=> {
               try {
                     const all_hospital = await hospitalModel.find({ }).sort({ createdAt : -1 }).lean()
                     if(!all_hospital)
                     {
                        return res.status(400).json({
                              success : false ,
                              message : 'NO Hospital Details Found'
                        })
                     }

                     return res.status(200).json({
                           success : true ,
                           message : 'All Hospital',
                           Hospital_Details : all_hospital.map((h)=> ({
                                    hospitalId : h._id ,
                                   hospitalName : h.hospitalName,
                                   location : h.location,
                                   hospitalCode : h.hospitalCode,
                                   contact : h.contact,
                                   hospitalImage : h.hospitalImage,
                                   status : h.status

                           }))
                     })
               } catch (error) {
                   return res.status(500).json({
                      success : false ,
                      message : 'Server error',
                      error_message : error.message
                   })
               }
          }

    // Api for update Hospital Details 
           const update_Hospital_Details = async( req , res )=> {
            try {
                const { hospitalId } = req.params
                const { hospitalName , location , contact } = req.body
                // check for hospitalId
                if(!hospitalId)
                    {
                          return res.status(400).json({
                               success : false ,
                               message : 'Hospital Id Required'
                          })
                    }  

                // check for Hospital 
                const hospital = await hospitalModel.findOne({ _id : hospitalId })
                if(!hospital)
                {
                    return res.status(400).json({
                          success : false ,
                          message : 'Hospital Not Found'
                    })
                }

                   if(hospitalName)
                   {
                    hospital.hospitalName = hospitalName
                   }
                   
                   if(location)
                    {
                        hospital.location = location
                    }
                    
                   if(contact)
                    {
                        hospital.contact = contact
                    }
                    
                   
                    if(req.file)
                    {
                        hospital.hospitalImage = req.file.filename
                    }

                    await hospital.save()

                    return res.status(200).json({
                          success : true ,
                          message : 'Details updated',
                          details : {
                                _id : hospital._id,
                               hospitalName : hospital.hospitalName,
                               location : hospital.location,
                               contact : hospital.contact,
                               hospitalImage : hospital.hospitalImage,
                               hospitalCode : hospital.hospitalCode,
                               status : hospital.status
                          }
                    })
           } catch (error) {
               return res.status(500).json({
                   success : false ,
                   message : 'Server error',
                   error_message : error.message
               })
           }
           }


           // delete Hospital

           const delete_hospital = async( req , res )=> {
               try {
                         const { hospitalId } = req.params
                         // check for required fields
                         if(!hospitalId)
                         {
                           return res.status(400).json({
                               success : false ,
                               message : 'hospital Id required'
                           })
                         }

                         // check for hospital 
                         const hospital = await hospitalModel.findOne({ _id : hospitalId })
                         if(!hospital)
                         {
                          return res.status(400).json({
                              success : false ,
                              message : 'Hospital Not Found'
                          })
                         }

                            if(hospital.PatientAssigned.length > 0)
                            {
                                 return res.status(400).json({
                                    success : false ,
                                    message : `Cannot delete hospital. Patients are still assigned.`
                                 })
                            }

                            await hospital.deleteOne()
                            return res.status(200).json({
                                success : true ,
                                message : 'Hospital Deleted Successfully'
                            })
               } catch (error) {
                    return res.status(500).json({
                         success : false ,
                         message : 'Server error',
                         error_message : error.message
                    })
               }
           }

                                                                /* Patient Section */

                                                                        // Function to generate a random number
        function generateRandomNumber(length) {
          let result = '';
          const characters = '0123456789';
          const charactersLength = characters.length;
      
          for (let i = 0; i < length; i++) {
              result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }
      
          return result;
      }

      const randomNumber = generateRandomNumber(5);

        // Api for add New Enquiry

        const add_new_enq = async (req, res) => {
          try {
            let { 
              name, 
              age, 
              gender, 
              email, 
              emergency_contact_no, 
              country,
              disease_name

            } = req.body;

       
            
            let userId = req.params.userId
        
                
            // Check for user ID
            if (!userId) {
              return res.status(400).json({
                success: false,
                message: 'User Id Required',
              });
            }

             // Check for user
             const user = await userModel.findOne({ _id: userId });
             if (!user) {
               return res.status(400).json({
                 success: false,
                 message: 'User not Found',
               });
             }
         
            // Check for required fields
            const requiredFields = [
              'name', 
              'age', 
              'gender', 
              'email', 
              'country', 
              'emergency_contact_no',
              'disease_name'
              
            ];
        
            for (let field of requiredFields) {
              if (!req.body[field]) {
                return res.status(400).json({
                  success: false,
                  message: `Required ${field.replace('_', ' ')}`,
                });
              }
            }
        
            
        
            // Check if the Enquiry already exists
            const exist_enq = await enquiryModel.findOne({ email });
            if (!exist_enq) {
          
              const enquiryId = `Enq-${randomNumber}`;
              // Create new Enquiry
              const newEnq = new enquiryModel({
                enquiryId : enquiryId,
                name,
                age,
                gender,
                email,
                emergency_contact_no,
                country,       
                created_by: [{
                  Name: user.name,
                  role: user.role,
                  userId: userId,
                }],  
                discussionNotes : {}  ,
                disease_name   
                
              });
        
              await newEnq.save();
        
              return res.status(200).json({
                success: true,
                message: 'New Enquiry Registered Successfully',
              });
            } else {
              return res.status(400).json({
                success: false,
                message: 'Enquiry already exists',
              });
            }
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: 'Server Error',
              error_message: error.message,
            });
          }
        };


    // Api for get all Enquiry

    const all_Enq = async (req, res) => {
      try {
      
        const statusPriority = {
          'Pending': 1,
          'Follow-Up': 2,
          'Hold': 3,
          'Dead': 4
        };
        
        const get_enq = await enquiryModel
          .aggregate([
            {
              $match: {
                enq_status: { $nin: ['Confirmed'] }  
              }
            },
            {
              $addFields: {
                statusPriority: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$enq_status', 'Pending'] }, then: 1 },
                      { case: { $eq: ['$enq_status', 'Follow-Up'] }, then: 2 },
                      { case: { $eq: ['$enq_status', 'Hold'] }, then: 3 },
                      { case: { $eq: ['$enq_status', 'Dead'] }, then: 4 }
                    ],
                    default: 5
                  }
                }
              }
            },
            {
              $sort: { statusPriority: 1, createdAt: -1 }  
            },
            {
              $project: { 
                enquiryId: 1,
                name: 1,
                email: 1,
                age: 1,
                gender: 1,
                country: 1,
                emergency_contact_no: 1,
                enq_status: 1,
                created_by: 1,
                disease_name: 1,
              }
            }
          ]);
    
        // Check if any enquiries were found
        if (!get_enq || get_enq.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No Enquiry Details found'
          });
        }
    
        // Return the response
        return res.status(200).json({
          success: true,
          message: 'All Enquiries',
          details: get_enq.map((p) => ({
            enquiryId: p.enquiryId,
            name: p.name,
            email: p.email,
            age: p.age,
            gender: p.gender,
            country: p.country,
            emergency_contact: p.emergency_contact_no,
            Enquiry_status: p.enq_status,
            createdBy: p.created_by[0]?.role || 'N/A', 
            disease_name: p.disease_name
          }))
        });
    
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
        });
      }
    };
    

// Api for get particular enquiry
const get_Enq = async( req , res )=> {
  try {
   const enquiryId = req.params.enquiryId
               // check for enquiryId
               if(!enquiryId)
               {
                 return res.status(400).json({
                      success : false ,
                      message : 'enquiry Id Required'
                 })
               }

               // check for Enquiry
               const enq = await enquiryModel.findOne({ enquiryId : enquiryId })
               if(!enq)
               {
                 return res.status(400).json({
                      success : false ,
                      message : 'enquiry Details Not Found'
                 })
               }
               return res.status(200).json({
                    success : true ,
                    message : 'Enquiry Detail',
                    detail : {
                      enquiryId : enq.enquiryId ,
                     name : enq.name,
                     age : enq.age,
                     country : enq.country ,
                     email : enq.email ,
                     gender : enq.gender ,
                     emergency_contact_no : enq.emergency_contact_no,
                     enq_status : enq.enq_status,                
                      created_by : enq.created_by[0].role,
                      disease_name : enq.disease_name,
                     discussionNotes : enq.discussionNotes.map((d)=> ({
                             note : d.note,
                             date : d.date
                     })) || []
                    }
               })
  } catch (error) {
      return res.status(500).json({
          success : false ,
          message : 'Server error',
          error_message : error.message
      })
  }
}


// Api for update Enquiry

const update_enq = async( req , res )=> {
  try {
        const enquiryId = req.params.enquiryId
        const {  name , age , gender , email , emergency_contact_no ,
                country  , discussionNotes , disease_name  } = req.body

            // check for patient Id
          if(!enquiryId)
          {
                res.status(400).json({
                    success : false ,
                    message : 'enquiryId Required'
                })
          }
          
             // check for enquiry 
             
             const enq = await enquiryModel.findOne({ enquiryId : enquiryId })
             if(!enq)
             {
              return res.status(400).json({
                   success : false ,
                   message : 'No enquiry Found'
              })
             }
               
                 if(name)
                 {
                    enq.name = name
                 }
                 
                 if(age)
                  {
                    enq.age = age
                  }
                 if(gender)
                  {
                    enq.gender = gender
                  }
                 if(email)
                  {
                    enq.email = email
                  }
                 if(emergency_contact_no)
                  {
                    enq.emergency_contact_no = emergency_contact_no
                  }
                 if(country)
                  {
                    enq.country = country
                  }
                 if(disease_name)
                  {
                    enq.disease_name = disease_name
                  }
                 


                let dNotes = []
                  var today = new Date()
                  if(discussionNotes)
                  {
                    dNotes.push({
                           note : discussionNotes ,
                           date : today
                    })

                    enq.discussionNotes = dNotes

                  }

                  await enq.save()
                  return res.status(200).json({
                       success : true ,
                       message : 'enquiry Details updated'
                  })
                  

  } catch (error) {
       return res.status(500).json({
           success : false ,
           message : 'Server error',
           error_message : error.message
       })
  }
}


// Api for update Enquiry status
const update_Enquiry_status = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const { status } = req.body;

    // Validate enquiryId
    if (!enquiryId) {
      return res.status(400).json({
        success: false,
        message: "enquiryId is required",
      });
    }

    // Validate status
    if (status === undefined || typeof status !== "number") {
      return res.status(400).json({
        success: false,
        message: "Valid status is required",
      });
    }

    // Find enquiry
    const enquiry = await enquiryModel.findOne({ enquiryId });
    if (!enquiry) {
      return res.status(400).json({
        success: false,
        message: "enquiry not found",
      });
    }
    
    const statusMappings = {
      1: { enq_status: "Confirmed" },
      2: { enq_status: "Hold"},
      3: { enq_status: "Follow-Up" },
      4: { enq_status: "Dead" },
    };

    // Update patient status
    const updateData = statusMappings[status];
    if (!updateData) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    Object.assign(enquiry, updateData);
    

    // Save updated enquiry
    await enquiry.save();

        if(enquiry.enq_status === 'Confirmed')
        {

             // check for patient Exist

               
            const exist_patient = await patientModel.findOne({ email : enquiry.email });
            if (exist_patient) {
                // Update existing patient details
                exist_patient.patient_name = enquiry.name;
                exist_patient.age = enquiry.age;
                exist_patient.country = enquiry.country;
                exist_patient.gender = enquiry.gender;
                exist_patient.emergency_contact_no = enquiry.emergency_contact_no;
                exist_patient.patient_disease = {
                    disease_name: enquiry.disease_name,
                };
                exist_patient.created_by = enquiry.created_by;

                // Save updated patient details
                await exist_patient.save();


            } else {
                // Add new enquiry as a patient
                const patientId = `Pt-${randomNumber}`;
                const newPatient = new patientModel({
                    patientId: patientId,
                    patient_name: enquiry.name,
                    age: enquiry.age,
                    country: enquiry.country,
                    email: enquiry.email,
                    gender: enquiry.gender,
                    emergency_contact_no: enquiry.emergency_contact_no,
                    patient_disease: {
                        disease_name : enquiry.disease_name,
                    },
                    created_by : enquiry.created_by,
                    discussionNotes : enquiry.discussionNotes,
                    medical_History : [],
                    Kyc_details : [],
                    services : [],
                });

                // Save the new patient
                await newPatient.save();
                         }

                                
                    }
              
    
    return res.status(200).json({
      success: true,
      message: "enquiry status updated successfully",
     
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error_message: error.message,
    });
  }
};

// Api for get all patient details
              const all_patients = async( req , res )=> {
                    try {
                           const { disease_name , country  } = req.query
                           const filter = {};
                            // Gender filter
                            if (disease_name) {
                              filter["patient_disease.disease_name"] = disease_name; 
                          }
                            if (country) {
                              filter.country = country; 
                          }
                            // check for all patient
                            const get_patient = await patientModel.find({ ...filter }).sort({ createdAt : -1}).lean()
                            if(!get_patient)
                            {
                              return res.status(400).json({
                                  success : false ,
                                  message : 'No Patient Details found'
                              })
                            }
                            return res.status(200).json({
                                 success : true ,
                                 message : 'All patient',
                                 details : get_patient.map((p)=> ({
                                          patientId  : p.patientId,
                                          patient_name : p.patient_name,
                                          email : p.email,
                                          age : p.age,
                                          gender : p.gender,
                                          country : p.country,
                                          patient_disease : p.patient_disease,
                                          emergency_contact : p.emergency_contact_no,
                                          patient_status : p.patient_status,
                                          patient_type : p.patient_type,
                                           createdBy : p.created_by[0].role,                                   
                                         
                                 }))
                            })
                    } catch (error) {
                        return res.status(500).json({
                             success : false,
                             message : 'Server error',
                             error_message : error.message
                        })
                    }
              }

          // Api for get particular patient Details
          const get_patient = async (req, res) => {
            try {
                const { patientId } = req.params;
        
                // Check for patient ID
                if (!patientId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Patient Id Required',
                    });
                }
        
                // Fetch patient details
                const patient = await patientModel.findOne({ patientId }).lean();
                if (!patient) {
                    return res.status(400).json({
                        success: false,
                        message: 'Patient Details Not Found',
                    });
                }
        
                // Fetch patient's treatment details
                const patient_treatment = await treatmentModel
                    .find({ patientId })
                    .sort({ updatedAt: -1 })
                    .lean();
        
                // Map patient treatment details and payment details
                const treatments = patient_treatment.map((t) => ({
                    treatment_id: t.treatment_id,
                    treatment_name: t.treatment_course_name,                  
                    treatment_total_charge : t.totalCharge,
                     treatment_due_payment : t.duePayment  ,
                     Hospital_details : t.hospital,
                     appointments_details : t.appointments          
                }));
        
                const payment_details = patient_treatment.flatMap((t) =>
                    t.payment_details.map((p) => ({
                        paid_amount: p.paid_amount,
                        paymentMethod: p.paymentMethod,
                        payment_Date: p.payment_Date,
                    }))
                );
                
                return res.status(200).json({
                    success: true,
                    message: 'Patient Detail',
                    detail: {
                        patientId: patient.patientId,
                        patient_name: patient.patient_name,
                        age: patient.age,
                        country: patient.country,
                        email: patient.email,
                        gender: patient.gender,
                        emergency_contact_no: patient.emergency_contact_no,
                        patient_status: patient.patient_status,
                        patient_disease: patient.patient_disease.map((m) => ({
                            disease_name: m.disease_name,
                        })),
                        treatment_course_id: patient.treatment_course_id,
                        patient_type: patient.patient_type,
                        created_by: patient.created_by[0]?.role || 'N/A',
                        discussionNotes: patient.discussionNotes.map((d) => ({
                            note: d.note,
                            date: d.date,
                        })),
                        treatmentCount: patient.treatmentCount,
                        serviceCount: patient.serviceCount,
                        Kyc_details: patient.Kyc_details || [],
                        services: patient.services || [],
                        payment_details,
                        treatments,
                        
                    },
                });
            } catch (error) {
                
                return res.status(500).json({
                    success: false,
                    message: 'Server error',
                    error_message: error.message,
                });
            }
        };
        
        
      // Api for delete particular patient record 
                       const deletePatient = async( req , res )=> {
                            try {
                                  const patientId = req.params.patientId
                                  // check for patient Id
                                  if(!patientId)
                                  {
                                    return res.status(400).json({
                                         success : false ,
                                         message : 'Patient Id Required'
                                    })
                                  }

                                  // check for patient
                                  const patient = await patientModel.findOne({ patientId : patientId })
                                  if(!patient)
                                  {
                                    return res.status(400).json({
                                         success : false ,
                                         message : 'Patient Details Not Found'
                                    })
                                  }
                                    // check for hospital
                                //    const hospital = await hospitalModel.findOne({ _id : patient.hospital_id })

                                    // await hospitalModel.updateOne(
                                    //                 { _id: hospital._id },
                                    //                 { $pull: { PatientAssigned: { patientId } } } 
                                    //          );
                                 
                                  await patient.deleteOne()

                                  return res.status(200).json({ 
                                        success : true ,
                                        message : 'Patient Record Deleted successfully'
                                  })
                            } catch (error) {
                                 return res.status(500).json({
                                     success : false ,
                                     message : 'Server error',
                                     error_message : error.message
                                 })
                            }
                       }


// Api for upload patient with excel
            
          // Generate sample file
                     
              const generate_sampleFile = async (req, res) => {
                try {
                  const workbook = new ExcelJs.Workbook();
                  const worksheet = workbook.addWorksheet("Enquiry");
              
                  worksheet.addRow([
                    "enquiryId",
                    "name",
                    "Age",
                    "Email",
                    "Gender",
                    "Country",
                    "emergency_contact_no",
                    "Enquiry Status"                  
                  
                  ]);
              
                  // Add sample data
                  worksheet.addRow([
                     "Enq-12345",
                     "SAMUEL SESAY",
                     "42" ,
                     "xyz@gmail.com",
                     "Male",
                     "India",
                    "7894651320",                                       
                    "Pending",                 
                  
                  ]);
              
                  // Set response headers for Excel download with the filename
                  res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  );
                  res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=sample_sheet.xlsx"
                  );
              
                  // Send the Excel file as a response
                  await workbook.xlsx.write(res);
                  res.end();
                  console.log("Excel file sent");
                } catch (error) {
                  console.error("Error sending Excel file:", error);
                  res.status(500).send("Internal Server Error");
                }
              };


  // Api for import patient 


  const import_file = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Validate userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
  
      // Fetch user details
      const user = await userModel.findOne({ _id: userId });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
  
      const workbook = new ExcelJs.Workbook();
      await workbook.xlsx.readFile(req.file.path);
  
      const worksheet = workbook.getWorksheet(1);
      const requiredHeaders = [
        "enquiryId",
        "Name",
        "Age",
        "Email",
        "Gender",
        "Country",
        "Emergency Contact Number",
        "Enquiry Status",
       
      ];
  
      // Validate headers
      const actualHeaders = [];
      worksheet.getRow(1).eachCell((cell) => {
        actualHeaders.push(cell.value);
      });
  
      const isValidHeaders = requiredHeaders.every(
        (header, index) => header === actualHeaders[index]
      );
  
      if (!isValidHeaders) {
        return res.status(400).json({
          success: false,
          error: "Use sample file format to import the data",
        });
      }
  
      const fileData = [];
      const emailSet = new Set();
  
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          const rowData = {
            
               enquiryId: row.getCell(1).value,
                name: row.getCell(2).value,
            age: row.getCell(3).value,
            email: row.getCell(4).value,
            gender: row.getCell(5).value,
            country: row.getCell(6).value,
            emergency_contact_no: row.getCell(7).value || 0,
            enq_status: row.getCell(8).value,
            patient_type: row.getCell(9).value,             
            created_by: [
              {
                Name: user.name,
                role: user.role,
                userId: userId,
              },
            ],
            
          };
  
          if (!emailSet.has(rowData.email)) {
            emailSet.add(rowData.email);
            fileData.push(rowData);
          }
        }
      });
  
      const uniqueData = [];
      for (const data of fileData) {
        const existingRecord = await enquiryModel.findOne({ email: data.email });
        if (!existingRecord) {
          uniqueData.push(data);
        }
      }
  
      if (uniqueData.length > 0) {
        // Insert the unique data into the database
        await enquiryModel.insertMany(uniqueData);
  
        res.status(200).json({
          success: true,
          message: "Data imported successfully",
        });
      } else {
        res.status(200).json({
          success: true,
          message: "No new data to import",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: "There was an error while importing data",
      });
    }
  };
  

  // Api for update patient Details 
   const update_patient = async( req , res )=> {
        try {
              const patientId = req.params.patientId
              const {  patient_name , age , gender , email , emergency_contact_no ,
                      country  , discussionNotes  } = req.body

                  // check for patient Id
                if(!patientId)
                {
                      res.status(400).json({
                          success : false ,
                          message : 'Patient Id Required'
                      })
                }
                
                   // check for patient 
                   
                   const patient = await patientModel.findOne({ patientId : patientId })
                   if(!patient)
                   {
                    return res.status(400).json({
                         success : false ,
                         message : 'No Patient Found'
                    })
                   }
                     
                       if(patient_name)
                       {
                          patient.patient_name = patient_name
                       }
                       
                       if(age)
                        {
                           patient.age = age
                        }
                       if(gender)
                        {
                           patient.gender = gender
                        }
                       if(email)
                        {
                           patient.email = email
                        }
                       if(emergency_contact_no)
                        {
                           patient.emergency_contact_no = emergency_contact_no
                        }
                       if(country)
                        {
                           patient.country = country
                        }                      
                    
                        var today = new Date()
                        if(discussionNotes)
                        {
                          patient.discussionNotes.push({
                                 note : discussionNotes ,
                                 date : today
                          })                     
                        }

                        await patient.save()
                        return res.status(200).json({
                             success : true ,
                             message : 'patient Details updated'
                        })
                        

        } catch (error) {
             return res.status(500).json({
                 success : false ,
                 message : 'Server error',
                 error_message : error.message
             })
        }
   }

      // Api for update patient status 
      const update_patient_status = async (req, res) => {
        try {
          const { patientId } = req.params;
          const { status } = req.body;
      
          // Validate patientId
          if (!patientId) {
            return res.status(400).json({
              success: false,
              message: "PatientId is required",
            });
          }
      
          // Validate status
          if (status === undefined || typeof status !== "number") {
            return res.status(400).json({
              success: false,
              message: "Valid status is required",
            });
          }
      
          // Find patient
          const patient = await patientModel.findOne({ patientId });
          if (!patient) {
            return res.status(400).json({
              success: false,
              message: "Patient not found",
            });
          }
        
          const statusMappings = {
            1: { patient_status: "Confirmed" },
            2: { patient_status: "Denied" ,  patient_type: "Dead"  },
            3: { patient_status: "Follow-Up", patient_type: "Repeat" },
            4: { patient_status: "Completed", patient_type: "Completed" },
          };
      
          // Update patient status
          const updateData = statusMappings[status];
          if (!updateData) {
            return res.status(400).json({
              success: false,
              message: "Invalid status value",
            });
          }
      
          Object.assign(patient, updateData);          
      
          // Save updated patient
          await patient.save();
       
          
          return res.status(200).json({
            success: true,
            message: "Patient status updated successfully",
           
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Server error",
            error_message: error.message,
          });
        }
      };
      
                                                             /* Appointment Section */
            
    // Api for create appointment
    const create_appointment = async (req, res) => {
      try {
        const userId = req.params.userId;
        const { patientId, treatment_id, hospitalId, note, appointment_Date } = req.body;
    
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: "User Id Required",
          });
        }
    
        const user = await userModel.findOne({ _id: userId });
        if (!user) {
          return res.status(400).json({
            success: false,
            message: "User Not Found",
          });
        }
    
        const requiredFields = ["patientId", "note", "hospitalId", "treatment_id", "appointment_Date"];
        for (let field of requiredFields) {
          if (!req.body[field]) {
            return res.status(400).json({
              success: false,
              message: `Required ${field.replace("_", " ")}`,
            });
          }
        }
    
        const patient = await patientModel.findOne({ patientId : patientId });
        if (!patient) {
          return res.status(400).json({
            success: false,
            message: "Patient Not Found",
          });
        }
    
        const treatment = await treatmentModel.findOne({ treatment_id });
        if (!treatment) {
          return res.status(400).json({
            success: false,
            message: "Patient Treatment Details Not Found",
          });
        }
        
        // Convert the hospitalId string to ObjectId
        const hospitalObjectId = new mongoose.Types.ObjectId(hospitalId);
        
        const hospital = treatment.hospital.find(
          (h) => h.hospital_id.toString() === hospitalObjectId.toString()
        );
        if (!hospital) {
          return res.status(400).json({
            success: false,
            message: `Patient not assigned in given hospital  for treatment: ${treatment_id}`,
          });
        }
    
        const existingAppointment = await appointmentModel.findOne({
          patientId,
          treatment_id,
          status: { $ne: "Complete" },
        });
    
        if (existingAppointment) {
          existingAppointment.status = "Complete";
          await existingAppointment.save();
        }
    
       
        const appointmentId = `Appt-${randomNumber}`;
        const newAppointment = new appointmentModel({
          appointmentId,
          patientId,
          patientName: patient.patient_name,
          treatment_id,
          treatment_name: treatment.treatment_course_name,
          discussionNotes: note,
          appointment_Date,
          hospital_id: hospitalId,
          hospitalName: hospital.hospital_Name || "Unknown Hospital",
          createdBy: [
            {
              userId,
              name: user.name,
              role: user.role,
            },
          ],
        });
    
        await newAppointment.save();
    
        if (
          !treatment.appointments.some((appt) => appt.appointmentId === appointmentId)
        ) {
          treatment.appointments.push({
            appointmentId,
            appointment_Date,
            disease_name : newAppointment.treatment_name

          });
        }
    
        await treatment.save();
    
        return res.status(200).json({
          success: true,
          message: "Appointment Created Successfully",
          
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Server Error",
          error_message: error.message,
        });
      }
    };
    
    

          // Api for get all appointment 
          const all_appointment = async (req, res) => {
            try {
              // Fetch all appointments
              const getall_appointment = await appointmentModel.find({}).sort({ createdAt: -1 }).lean();
          
              if (!getall_appointment) {
                return res.status(400).json({
                  success: false,
                  message: "No Appointment Found",
                });
              }
                       
               
              return res.status(200).json({
                success: true,
                message: "All Appointments Retrieved",
                data: getall_appointment.map((a)=>({
                    
                       appointmentId : a.appointmentId,
                       patientId : a.patientId,
                       patientName : a.patientName,
                       disease_name : a.treatment_name,                                     
                        appointement_status : a.status,
                       Hospital_name :  a.hospitalName ,
                       discussionNotes : a.discussionNotes,
                       appointment_Date : a.appointment_Date,
                       created_by : a.createdBy[0].role,                        
                       

                })),
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: "Server error",
                error_message: error.message,
              });
            }
          };

          // Get  particular  patient appointment
          
             const get_patient_appointment = async ( req , res )=> {
                     try {
                           const patientId = req.params.patientId
                           // check for patientId
                           if(!patientId)
                           {
                            return res.status(400).json({
                                 success : false ,
                                 message : 'Patient Id Required'
                            })
                           }

                           // check for patient 
                           const patient = await patientModel.findOne({
                               patientId : patientId
                           })

                           if(!patient)
                           {
                              return res.status(400).json({
                                   success : false ,
                                   message : 'Patient Not found'
                              })
                           }

                           // check for appointment 
                             const appointment = await appointmentModel.find({ patientId }).sort({ createdAt : -1 }).lean()
                             if(!appointment)
                             {
                              return res.status(400).json({
                                   success : false ,
                                   message : 'NO Appointment found for patient'
                              })
                             }

                              
                             return res.status(200).json({
                                 success : false ,
                                 message : 'All Appointments of patient',
                                 appointment : appointment.map((a)=> ({
                                  appointmentId : a.appointmentId,
                                  patientId : a.patientId,
                                  patientName : a.patientName,
                                  disease_name : a.treatment_name,                                                                     
                                   appointement_status : a.status,
                                  Hospital_name :  a.hospitalName,
                                  discussionNotes : a.discussionNotes,
                                  appointment_Date : a.appointment_Date,
                                  created_by : a.createdBy[0].role,
                                 }))
                                 
                             })

                     } catch (error) {
                         return res.status(500).json({
                              success : false,
                              message : 'Server error',
                              error_message : error.message
                         })
                     }
             }
          

     
        
                                                         /* treatement Course section */

                // Api for add treatment course

                const add_treatment_course = async (req, res) => {
                  try {
                    const { course_name, course_price , categories } = req.body;
                
                    // Validate course_name
                    if (!course_name) {
                      return res.status(400).json({
                        success: false,
                        message: 'Course Name is required',
                      });
                    }
                    if (!course_price) {
                      return res.status(400).json({
                        success: false,
                        message: 'course price is required',
                      });
                    }
                
                    // Validate categories array
                    if (!Array.isArray(categories) || categories.length === 0) {
                      return res.status(400).json({
                        success: false,
                        message: 'At least one category is required',
                      });
                    }
                
                    // Check for already existing treatment course using $regex
                    const exist_course = await treatement_course_model.findOne({
                      course_name: { $regex: `^${course_name}$`, $options: 'i' }, 
                    });
                    if (exist_course) {
                      return res.status(400).json({
                        success: false,
                        message: 'Course already exists with the same name',
                      });
                    }
                
                    // Validate for duplicate category names in the array
                    const uniqueCategories = new Set(categories);
                    if (uniqueCategories.size !== categories.length) {
                      return res.status(400).json({
                        success: false,
                        message: 'Duplicate category names are not allowed',
                      });
                    }
                
                    // Format categories
                    const formattedCategories = categories.map((category_name) => ({
                      category_name,
                    }));
                
                    // Logic to save the treatment course in the database
                    const new_course = new treatement_course_model({
                      course_name,
                      course_price,
                      categories: formattedCategories,
                    });
                    await new_course.save();
                
                    return res.status(200).json({
                      success: true,
                      message: 'Treatment course added successfully',
                     
                    });
                  } catch (error) {
                    return res.status(500).json({
                      success: false,
                      message: 'Server error',
                      error_message: error.message,
                    });
                  }
                };
                


        // Api for get all the treatement courses
        
         const get_all_treatment_courses = async( req , res )=> {
             try { 
                        // check for all treatment courses
                         
                        const treatments = await treatement_course_model.find({ }).sort({ createdAt : -1 }).lean()
                        if(!treatments)
                        {
                          return res.status(400).json({
                               success : false ,
                               message : 'No Treatment Course added yet'
                          })
                        }

                        return res.status(200).json({
                              success : true ,
                              message : 'all Treatement Course',
                              traement_course : treatments.map((t)=> ({
                                       course_id : t._id,
                                      course_name : t.course_name,
                                      course_price :  t.course_price ,
                                       categories : t.categories.map((c)=> ({
                                             category_name : c.category_name,
                                             category_id : c._id
                                       }))
                              }))
                        })
             } catch (error) {
                  return res.status(500).json({
                       success : false ,
                       message : 'Server error',
                       error_message : error.message
                  })
             }
         }

          // Api for update treatment Course price
                
          const update_treatment_course = async (req, res) => {
            try {
              const { treatment_course_id } = req.params;
              const { course_name , course_price } = req.body;
          
              // Validate treatment_course_id
              if (!treatment_course_id) {
                return res.status(400).json({
                  success: false,
                  message: 'Treatment course ID is required.',
                });
              }
          
              // Check for treatment course existence
              const treatment_course = await treatement_course_model.findById(treatment_course_id);
              if (!treatment_course) {
                return res.status(400).json({
                  success: false,
                  message: 'Treatment course not found.',
                });
              }                        
          
              // Update fields
              if (course_name && course_name !== treatment_course.course_name) {
                treatment_course.course_name = course_name;
              }
              if (course_price && course_price !== treatment_course.course_price) {
                if (isNaN(course_price) || course_price <= 0) {
                  return res.status(400).json({
                    success: false,
                    message: 'Invalid course price. It must be a positive number.',
                  });
                }
                treatment_course.course_price = course_price;
              }
          
              await treatment_course.save();
          
              return res.status(200).json({
                success: true,
                message: 'Treatment course details updated successfully.',
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: 'Server error.',
                error_message: error.message,
              });
            }
          };


          
      // Api for delete particular treatement course
      const delete_treatment_course = async ( req , res )=> {
            try {
                    const courseId = req.params.courseId
                    // check for id
                    if(!courseId)
                    {
                      return res.status(400).json({
                           success : false ,
                           message : 'Treatment Course Id Required'
                      })
                    }                  
                        
                    // check for course
                    const course = await treatement_course_model.findOne({
                           _id : courseId
                    })
                    if(!course)
                    {
                      return res.status(400).json({
                             success : false ,
                             message : 'No Treatment Course Found'
                      })
                    }
                    // check for treatment course is used 

                    const check_course = await patientModel.find({ 
                      treatment_course_id :  courseId,  
                      patient_type: { $ne: 'Completed' }
                    });
                    if (check_course.length > 0) {
                      return res.status(400).json({
                          success: false,
                          message: `You can't delete the treatment course, some patients are having this treatment.`
                      });
                  }
                    
                  await course.deleteOne()
                      return res.status(200).json({
                           success : true ,
                           message : 'Treatment Course deleted successfully'
                      })
            } catch (error) {
                 return res.status(500).json({
                     success : false ,
                     message : 'Server error',
                     error_message : error.message
                 })
            }   
      }

                                                                /* treatment Section  */

          // Api for create treatment
          const create_treatment = async ( req , res )=> {
                  try {
                           const { patientId , treatment_course_id  , services , totalCharge , amount_paid , paymentMethod } = req.body

                           // check for patient Id
                           if(!patientId)
                           {
                            return res.status(400).json({ 
                                 success : false ,
                                 message : 'patient Id Required'
                            })
                           }

                           // check for treatment course Id
                           if(!treatment_course_id)
                           {
                            return res.status(400).json({
                                 success : false ,
                                 message : 'treatment Course Id Required'
                            })
                           }  
                            let fetchedServices = [];
                                if (services) {

                                  // Validate services array
                                  if (!Array.isArray(services) || services.length === 0) {
                                    return res.status(400).json({
                                      success: false,
                                      message: 'At least one service is required',
                                    });
                                  }                                               
                                  
                                  // Fetch service details in parallel
                                  const servicePromises = services.map((serviceId) =>
                                    serviceModel.findOne({ serviceId })                                
                                  );
                                  const serviceResults = await Promise.all(servicePromises);

                                  // Check for any missing services
                                  for (const service of serviceResults) {
                                    if (!service) {
                                      return res.status(400).json({
                                        success: false,
                                        message: 'One or more services not found',
                                      });   
                                    }  

                                    fetchedServices.push({
                                      serviceId: service.serviceId,
                                      serviceName: service.serviceName,
                                      price: service.price,
                                      duration: service.duration,
                                    });
                                  }
                                }

                           // check for patient
                           const patient = await patientModel.findOne({ patientId : patientId })
                           if(!patient)
                           {
                            return res.status(400).json({
                                 success : false ,
                                 message : 'Patient Not found'
                            })
                           }

                           // check for treatment course
                           const treatment_course = await treatement_course_model.findOne({ _id : treatment_course_id })
                           if(!treatment_course)
                           {
                            return res.status(400).json({
                                 success : false ,
                                 message : 'Treatment Course Not Found'
                            })
                           }                    
                    

                             if(patient.patient_status !== 'Confirmed')
                             {
                                 return res.status(400).json({
                                      success : false ,
                                      message : 'Please Confirmed the patient before create treatment'
                                 })
                             }

                                // check for the treatment 

                           const treatment = await treatmentModel.findOne({ patientId : patientId , 
                                                                       treatment_course_name : treatment_course.course_name ,
                                                                         status : {$ne : 'Complete' }  })
                           if(treatment)
                           {
                               return res.status(400).json({
                                    success : false ,
                                    message : 'Treatment already exist for the patient'
                               })              
                                       
                           }    

                             const treatmentId = `Tx-${randomNumber}`;
                                 const new_data = new treatmentModel({
                                      treatment_id  : treatmentId ,
                                       patientId , 
                                       patient_name : patient.patient_name,
                                       treatment_course_id : treatment_course_id,
                                       totalCharge : totalCharge,
                                       treatment_course_name : treatment_course.course_name,
                                       services : fetchedServices || [] ,
                                       hospital : [],
                                       appointments : [],
                                       payment_details : []
                                 })

                                      
                                    patient.treatmentCount += 1;
                                      await  patient.save()
                                        await new_data.save()  

                                        new_data.payment_details.push({
                                          paid_amount : amount_paid,
                                          paymentMethod : paymentMethod,
                                          payment_Date : new Date()

                                        })

                                        await new_data.save()

                                        new_data.duePayment = totalCharge - amount_paid

                                        await new_data.save()

                                    
                                 return res.status(200).json(({
                                      success : true ,
                                      message : 'patient Treatment Record saved successfully ',
                                      patientId : patientId
                                 }))



                  } catch (error) {
                       return res.status(500).json({
                            success : false ,
                            message : 'Server error',
                            error_message : error.message
                       })
                  }
          }



      // Api for get patient treatment 
       
          const get_patient_treatment = async ( req , res )=> {
              try {
                      const patientId = req.params.patientId
                // check for patientId
                if(!patientId)
                {
                  return res.status(400).json({
                       success : false ,
                       message : 'Patient Id Required'
                  })
                }

                // check for patient 
                const patient = await patientModel.findOne({ patientId : patientId })
                if(!patient)
                {
                  return res.status(400).json({
                       success : false ,
                       message : 'Patient Not Found'
                  })
                }

                // check for the treatment detail of the patient
                const patient_treatment_details = await treatmentModel.find({ patientId })
                if(!patient_treatment_details)
                {
                  return res.status(400).json({
                       success : false ,
                       message : 'No patient treatment Record Found'
                  })
                }
                       
                return res.status(200).json({
                     success : true ,
                     message : 'Patient Treatements',
                     patient_treatments : patient_treatment_details.map((t)=> ({
                            treatmentId : t.treatment_id ,
                            patientId : t.patientId,
                            patient_name : t.patient_name,
                            treatment_name : t.treatment_course_name,
                            totalCharge : t.totalCharge ,
                            treatment_status : t.status,
                            all_appointments : t.appointments.map((a)=> ({
                                           appointmentId : a.appointmentId,
                                           appointment_Date : a.appointment_Date,
                            })),
                            hospital_Name: (t.hospital?.[0]?.hospital_Name) || '',
                           
                          }))
                })
              } catch (error) {
                    return res.status(500).json({
                         success : false ,
                         message : 'Server error',
                         error_message : error.message
                    })
              }
          }    

   // Api for add patient in hospital
   const assign_patient_to_hospital = async (req, res) => {
    try {
            const { patientId } = req.params;
            const { hospitalId , treatmentId , hospital_charge } = req.body ;

            // Check for patientId
            if (!patientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient Id Required'
                });
            }

        // Check for patient
            const patient = await patientModel.findOne({ patientId: patientId });
            if (!patient) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient not Found'
                });
            }

        // Check for hospitalId
            if (!hospitalId) {
                return res.status(400).json({
                    success: false,
                    message: 'Hospital Id Required' 
                });
            }
          // check for treatment 
          
              const treatment = await treatmentModel.findOne({ treatment_id : treatmentId })
              if(!treatment)
              {
                  return res.status(400).json({
                      success : false ,
                      message :  'Patient Treatment Record not Found'
                  })
              }

        // Check for hospital
              const hospital = await hospitalModel.findOne({ _id: hospitalId });
              if (!hospital) {
                  return res.status(400).json({
                      success: false,
                      message: 'Hospital Not Found'
                  });
              }

               if(patient.patient_status === 'Confirmed') 
               {                          

              const newAssignment = {
                  patientId: patientId,
                  Assigned_Date: new Date()
              };

              hospital.PatientAssigned.push(newAssignment); 
              await hospital.save();
                    
                    if (!Array.isArray(treatment.hospital)) {
                      treatment.hospital = [];
                    }
                    
                    treatment.hospital.push({                          
                                  
                                  hospital_id: hospitalId,
                                  hospital_Name: hospital.hospitalName,
                                  hospital_charge : hospital_charge
                            
                    });                   
            
            // Save the updated treatment document
            await treatment.save();         
           
              return res.status(200).json({
                  success: true,
                  message: 'Patient assigned to Hospital successfully'
              });
                      }

                          } catch (error) {
                              return res.status(500).json({
                                  success: false,
                                  message: 'Server error',
                                  error_message: error.message
                              });
                          }
                      };


            // Api for update treatment status
            const update_patient_treatment_status = async( req , res )=> {
                   try {
                          const treatment_id = req.params.treatment_id
                          let status = req.body.status

                          if(!treatment_id)
                          {
                            return res.status(400).json({
                                  success : false ,
                                  message : 'Treatment Id Required'
                            })
                          }
                             

                          // check for status
                         
                        if (status === undefined || typeof status !== "number") {
                          return res.status(400).json({
                            success: false,
                            message: "Valid status is required",
                          });
                        }

                        // check for treatment 
                        const treatment = await treatmentModel.findOne({ treatment_id })
                        if(!treatment)
                        {
                          return res.status(400).json({
                               success : false ,
                               message : 'treatment Details not Found'
                          })
                        }

                        const statusMappings = {
                          1: { status : 'Schedule' },
                          2: { status : 'Follow-Up' },
                          3: { status : 'Complete' },
                        }

                        // update status
                        const updateData = statusMappings[status]
                        if(!updateData)
                        {
                             return res.status(400).json({
                                 success : false ,
                                 message : 'Invalid Status Value'
                             })
                        }

                        Object.assign(treatment , updateData)

                        await treatment.save()

                        return res.status(200).json({
                              success : true ,
                              message : 'Patient Treatment Status Updated'
                        })


                   } catch (error) {
                        return res.status(500).json({
                             success : false ,
                             message : 'Server error',
                             error_message : error.message
                        })
                   }
            }
               
                 
                        
                                                           /* Report Section */

          const exportfilteredpatient = async (req, res) => {
          try {
              const userId = req.params.userId;
              const { country, gender , treatment_name, age  } = req.query;
      
              // Check for userId
              if (!userId) {
                  return res.status(400).json({
                      success: false,
                      message: 'userId is required',
                  });
              }

      
              // Check for user existence
              const user = await userModel.findOne({ _id: userId });
              if (!user) {
                  return res.status(400).json({
                      success: false,
                      message: 'user not found',
                  });
              }
      
              // Construct filter for applied job patients
              const filter = {};     
              
      
              // Gender filter
              if (gender) {
                  filter.gender = gender;
              }
      
              // Construct regex-based filters for `district` and `job_Type` 
              if (country) {
                  filter.country = { $regex: country , $options: 'i' }; 
              }
              if (treatment_name) {
                  filter.treatment_name = { $regex: treatment_name, $options: 'i' }; 
              }
              if (age) {
                  filter.age = age ; 
              }
      
              // Fetch patients
              const totalpatients = await patientModel.find({ ...filter });
              if (totalpatients.length === 0) {
                  return res.status(400).json({
                      success: false,
                      message: 'No patient found ',
                  });
              }          
                  
                  // Create Excel workbook and worksheet
              const workbook = new ExcelJs.Workbook();              
              const worksheet = workbook.addWorksheet("patients");
      
              // Define Excel header
              worksheet.columns = [
                  { header: "Patient Id", key: "patientId", width: 15 },
                  { header: "Patient Name", key: "patient_name", width: 15 },
                  { header: "Patient Email", key: "email", width: 25 },
                  { header: "Country", key: "country", width: 15 },
                  { header: "Emergency Contact Number", key: "emergency_contact_no", width: 15 },                 
                  { header: "Gender", key: "gender", width: 10 },
                  { header: "Treatment Name", key: "treatment_name", width: 20 },
                  { header: "Patient Disease", key: "patient_disease", width: 50 },
                  
              ];
      
              // Add data to the worksheet
              totalpatients.forEach(patient => {
                  worksheet.addRow({
                    patientId: patient.patientId,
                    patient_name: patient.patient_name,
                      user_Email: patient.user_Email,
                      email: patient.email,
                      country: patient.country,
                      emergency_contact_no: patient.emergency_contact_no,                   
                      gender: patient.gender,
                      treatment_name: patient.treatment_name,
                      patient_disease: patient.patient_disease.map((p)=> ({
                                       patient_disease : p.disease_name
                      })),                     
                  });
              });                 

      
              // Set response headers for downloading the Excel file
              res.setHeader(
                  "Content-Type",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              );
              res.setHeader(
                  "Content-Disposition",
                  `attachment; filename=patientsData.xlsx`
              );
      
              // Generate and send the Excel file as a response
              await workbook.xlsx.write(res);
      
              // End the response
              res.end();
              
      
              
          } catch (error) {
              console.error("Error exporting patients:", error);
              res.status(500).json({
                  success: false,
                  message: 'Server error',
                  error_message: error.message,
              });
          }
      };

      

                                                        /* Dashboard Section */

      // APi for Dashboard
         
             const Dashboard_count = async( req , res)=> {
                 try {
                
                    // check for all Staff 
                    const totalStaff = await userModel.countDocuments({ role : { $ne : 'Admin' } });
                    // check for Total Hospital 
                    const totalHospital = await hospitalModel.countDocuments();
                    // check for pending Enquiry
                    const all_Enquiry = await enquiryModel.countDocuments({ enq_status :  { $ne :  'Confirmed' } });
                    // check for Confirmed Patient
                    const Patients = await patientModel.countDocuments({ patient_status : 'Confirmed' });
                    // check for Total Appointment 
                    const totalAppointment = await appointmentModel.countDocuments();
                    // check for total Earning
                    const treatments = await treatmentModel.find({});   
                    let totalEarning = 0;
                     let myEarning = 0
                     let hospitalCharge = 0
                    treatments.forEach((treatment) => {
                        const totalCharge = treatment.totalCharge || 0; 
                        const totalDue = treatment.duePayment || 0; 
                        hospitalCharge += treatment.hospital?.[0]?.hospital_charge || 0; 
                        totalEarning += (totalCharge - totalDue);

                    });                             
                         
                    myEarning =  totalEarning - hospitalCharge
                          
                      return  res.status(200).json({
                        success : true ,
                        message : 'Dashboard Count',
                        totalStaff,
                        totalHospital,
                        all_Enquiry,
                        Patients,
                        totalAppointment,
                        OMCA_total_Earning : myEarning
                    });
                                              
                 } catch (error) {
                     return res.status(500).json({
                         success : false ,
                         message : 'Server error',
                         error_message : error.message
                     })
                 }
             }
      
                                                              /* service Section */
                
          // Api for add new service
             const add_service = async( req , res)=> {
                  try {
                       
                        const { serviceName , description ,  price , duration   } = req.body

                        // check for required Fields

                        const requiredFields = ['serviceName' , 'description' , 'price' , 'duration']
                        for( let field of requiredFields)
                        {
                                if(!req.body[field])
                                {
                                      return res.status(400).json({
                                           success : false ,
                                           message : `Required ${field.replace('_' , ' ')}`
                                      })
                                }

                        }

                        // check for service exist

                          const existService = await serviceModel.findOne({ serviceName : { $regex: `^${serviceName}$`, $options: 'i' } })
                          if(existService)
                          {
                              return res.status(400).json({
                                   success : false ,
                                   message  : `Service already Exist : ${serviceName}`
                              })
                          }
                          else
                          {

                                   const serviceId = `Svc-${randomNumber}`
                                   // add new service
                                   const newService = new serviceModel({
                                       serviceId : serviceId,
                                       serviceName,
                                       description,
                                       price ,
                                       duration

                                        
                                   })

                                   await newService.save()

                                   return res.status(200).json({
                                        success : true ,
                                        message : 'New Service addedd'
                                   })
                          }
                  } catch (error) {
                      return res.status(500).json({
                           success : false ,
                           message : 'Server error',
                           error_message : error.message
                      })
                  }
             }

                    

        // Api for get all services
            const all_services = async ( req , res )=> {
                 try {
                        const services = await serviceModel.find({ }).sort({ createdAt : -1 }).lean()
                        
                        if(!services)
                        {
                             return res.status(400).json({
                                  success : false ,
                                  message : 'No Services added yet'
                             })
                        }

                        return res.status(200).json({
                             success : true ,
                             message : 'All Services',
                             services : services.map((s)=> ({
                                   serviceId : s.serviceId,
                                   serviceName : s.serviceName,
                                   description : s.description,
                                   price : s.price,
                                   duration : s.duration,
                                   isActive : s.isActive
                             }))
                        })

                 } catch (error) {
                     return res.status(500).json({
                         success : false ,
                         message : 'Server error',
                         error_message : error.message
                     })
                 }
            }


        // Api for active inactive service
                   const active_inactive_Service = async( req , res )=> {
                        try {
                               const serviceId = req.params.serviceId
                               // check for service ID
                               if(!serviceId)
                               {
                                  return res.status(400).json({
                                       success : false ,
                                       message : 'Service Id Required'
                                  })
                               }

                               // check for service
                               const service = await serviceModel.findOne({
                                     serviceId : serviceId
                               })
                               if(!service)
                               {
                                  return res.status(400).json({
                                       success : false ,
                                       message : 'Service not Found'
                                  })
                               }

                                 
                               let message = ''
                               if(service.isActive === 1)
                               {
                                service.isActive = 0
                                     message = `service : ${service.serviceId} is Inactive`
                               }
                               else 
                               {
                                      service.isActive = 1
                                     message = `service : ${service.serviceId} is Active`
                               }

                                  await service.save()

                               return res.status(200).json({
                                    success : true ,
                                    message : message
                               })
                        } catch (error) {
                              return res.status(500).json({
                                   success : false ,
                                   message : 'Server error',
                                   error_message : error.message
                              })
                        }
                   }


          // Api for get all active services

              const get_activeServices = async( req , res)=> {
                try {
                  const services = await serviceModel.find({ isActive : 1 }).sort({ createdAt : -1 }).lean()
                  
                  if(!services)
                  {
                       return res.status(400).json({
                            success : false ,
                            message : 'No Services added yet'
                       })
                  }

                  return res.status(200).json({
                       success : true ,
                       message : 'All Services',
                       services : services.map((s)=> ({
                             serviceId : s.serviceId,
                             serviceName : s.serviceName,
                             description : s.description,
                             price : s.price,
                             duration : s.duration,
                             isActive : s.isActive
                       }))
                  })

           } catch (error) {
               return res.status(500).json({
                   success : false ,
                   message : 'Server error',
                   error_message : error.message
               })
           }
              }
      // Api for add kyc details
       const patient_Kyc_details = async( req , res)=> {
             try {
                     const patientId = req.params.patientId
                     // check for patientId
                     if(!patientId)
                     {
                      return res.status(400).json({
                           success : false ,
                           message : 'PatientId Required'
                      })
                     }

                     // check for patient
                     const patient = await patientModel.findOne({
                           patientId : patientId
                     })

                     if(!patient)
                     {
                      return res.status(400).json({
                           success : false,
                           message : 'patient Not Found'
                      })
                     }

                     // add kyc details
                     const newKycDetails = {};

                     if (req.files.id_proof) {
                      newKycDetails.id_proof = req.files.id_proof[0].filename;
                  }
                  if (req.files.passport) {
                      newKycDetails.passport = req.files.passport[0].filename;
                  }
                  if (req.files.photo) {
                      newKycDetails.photo = req.files.photo[0].filename;
                  }
          
                  patient.Kyc_details.push(newKycDetails);
                  await patient.save();

                  return res.status(200).json({
                        success : true  ,
                        message : 'patient kyc details added'
                  })
                        
                            
             } catch (error) {
                  return res.status(500).json({
                       success : false ,
                       message : 'Server error' ,
                       error_message : error.message
                  })
             }
       }
            

    // Api for add extra services for patient

    const patient_extra_service = async (req, res) => {
      try {
        const patientId = req.params.patientId;
        const { services } = req.body;
    
        // Check for patientId
        if (!patientId) {
          return res.status(400).json({
            success: false,
            message: 'Patient ID required',
          });
        }
    
        // Find the patient
        const patient = await patientModel.findOne({ patientId: patientId });
    
        if (!patient) {
          return res.status(400).json({
            success: false,
            message: 'Patient not found',
          });
        }
    
        let fetchedServices = [];
    
        // Check if services are provided
        if (services) {
          // Validate the services array
          if (!Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'At least one service is required',
            });
          }
    
          // Loop through each service to fetch serviceName
          for (let service of services) {
            const { serviceId, price } = service;
    
            const serviceData = await serviceModel.findOne({ serviceId });
    
            if (!serviceData) {
              return res.status(400).json({
                success: false,
                message: `Service with serviceId :  ${serviceId} not found`,
              });
            }   
           
            fetchedServices.push({
              serviceId: serviceId,
              serviceName: serviceData.serviceName, 
              price: price,
            });
          }
        }    
   
        patient.services = fetchedServices;
        patient.serviceCount += 1;        
        await patient.save();
    
        return res.status(200).json({
          success: true,
          message: 'Extra services added',
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message,
        });
      }
    };
    

    // Api for add payment record in the treatment

    const add_new_treatment_payment = async (req, res) => {
      try {
          const { treatment_id } = req.params;
          const { paid_amount, paymentMethod, payment_Date } = req.body;
  
          // Validate required fields
          const requiredFields = ['paid_amount', 'paymentMethod', 'payment_Date'];
          for (let field of requiredFields) {
              if (!req.body[field]) {
                  return res.status(400).json({
                      success: false,
                      message: `Required ${field.replace('_', ' ')}`,
                  });
              }
          }

          if (!treatment_id) {
              return res.status(400).json({
                  success: false,
                  message: "Treatment ID is required", 
              });
          }
  
          // Fetch treatment by treatment_id
          const treatment = await treatmentModel.findOne({ treatment_id });
          if (!treatment) {
              return res.status(400).json({
                  success: false,
                  message: "Treatment not found",
              });
          }
  
          if (paid_amount <= 0) {
              return res.status(400).json({
                  success: false,
                  message: "Paid amount must be greater than 0",  
              });
          }
  
          if (treatment.duePayment > 0) {
              if (paid_amount >= treatment.duePayment) {
                  const clearpayment = paid_amount - treatment.duePayment;
                  treatment.duePayment = 0;
                  totalCharge += clearpayment; 
              } else {
                  treatment.duePayment -= paid_amount 
              }
  
              // Add payment details
              treatment.payment_details.push({
                  paid_amount,
                  paymentMethod,
                  payment_Date,
              });
  
              await treatment.save();
  
              return res.status(200).json({
                  success: true,
                  message: `Payment details added for treatment ID: ${treatment_id}`,
              });
          } else {
              return res.status(400).json({
                  success: false,
                  message: "No due payment remaining for this treatment",
              });
          }
      } catch (error) {
          return res.status(500).json({
              success: false,
              message: "Server error",
              error_message: error.message,
            
          });
      }
  };

                                              /* All earnings  */
      
  const totalEarnings = async( req , res)=> {
         try {
               // check for all treatments
               const treatments = await treatmentModel.find({});   
               if(!treatments)
               {
                return res.status(400).json({
                     success : false ,
                     message : 'No transaction found'
                })
               }

               return res.status(200).json({
                    success : true ,
                    message : 'All Earnings',
                    earnings : treatments.map((e)=> ({
                      patientId : e.patientId,
                      patient_name : e.patient_name,
                      Disease_agreement : e.treatment_course_name,
                      total_Amount : e.totalCharge,
                      amount_paid : (e.totalCharge - e.duePayment),
                      remaining_balance : e.duePayment

                    }))
               })
                
         } catch (error) {
             return res.status(500).json({
                 success : false ,
                 message : 'Server error',
                 error_message : error.message
             })
         }
  }
                                                                 /* Chat Section */

            // Api for add user chat 

            const userChat = async (req, res) => {
              try {
                  const userId = req.params.userId;
                  const { message } = req.body;
          
                  // Check for user ID
                  if (!userId) {
                      return res.status(400).json({
                          success: false,
                          message: 'User Id Required',
                      });
                  }
          
                  const user = await userModel.findOne({
                      _id: userId,
                  });
                  if (!user) {
                      return res.status(400).json({
                          success: false,
                          message: 'User Not Found',
                      });
                  }
          
                  // Check if file is uploaded (attachment is optional)
                  let attachment = '';
                  if (req.file) {
                      attachment = req.file.filename;
                  }
          
                  // Add new message
                  const newMessage = new chatModel({
                      userId,
                      userName: user.name,
                      message,
                      attachment,
                  });
          
                  await newMessage.save();
          
                  return res.status(200).json({
                      success: true,
                      message: 'Message Submitted Successfully',
                  });
              } catch (error) {
                  return res.status(500).json({
                      success: false,
                      message: 'Server error',
                      error_message: error.message,
                  });
              }
          };
          
  

          // Api for get all chats
             const get_chats = async( req , res)=> {
                   try {
                           // check for all chats

                           const allChats = await chatModel.find({ })
                           if(!allChats)
                           {
                            return res.status(200).json({
                                 success : false ,
                                 message : 'No chats found'
                            })
                           } 

                           return res.status(200).json({
                               success : true ,
                               message : 'All Chats',
                               chats : allChats.map((c)=> ({
                                      userId : c.userId,
                                      userName : c.userName,
                                      message : c.message,
                                      attachment : c.attachment || ''
                               }))
                           })
                   } catch (error) {
                       return res.status(500).json({
                            success : false ,
                            message : 'Server error',
                            error_message : error.message
                       })
                   }
             }
    
      
module.exports = { add_staff_user  ,  login  , get_all_user_staffs , get_details , update_details,
    change_user_password, active_inactive_staff_user , logout ,

    /* Hospital Section */
    add_hospital , getAll_hospital , update_Hospital_Details , delete_hospital ,

    /* Enquiry Section */

    add_new_enq , all_Enq , get_Enq , update_enq , update_Enquiry_status , 

    
    /* treatment Course */
    add_treatment_course , get_all_treatment_courses , update_treatment_course  , delete_treatment_course ,

    /* Patient Section */
     all_patients , deletePatient , generate_sampleFile ,
    import_file, get_patient , update_patient , update_patient_status ,  

    /* patient_Kyc_details */
    patient_Kyc_details, 
        
    /* patient_extra_service */
    patient_extra_service ,

    /* service Section */
    add_service , all_services , active_inactive_Service , get_activeServices ,
         
    /* treatment section */

    create_treatment , get_patient_treatment ,   assign_patient_to_hospital , update_patient_treatment_status , add_new_treatment_payment ,

    /* Appointment Section */
    create_appointment , all_appointment , get_patient_appointment , 


    /* Report section */
    exportfilteredpatient  ,

    /* Dashboard Section */

    Dashboard_count ,

    /* All earnings */
    totalEarnings,

    /* Chat Group */
    userChat  , get_chats


    
 }



