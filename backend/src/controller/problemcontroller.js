const problem = require("../models/problem");
const Problem = require("../models/problem");
const User = require("../models/users");
const solutionvid=require('../models/solutionvid');



const {

   getLanguageById,
     submitBatch,
     submitTokens,
} = require("../utils/problemsutils");

const submissionSchema = require("../models/submissions");






const createproblem = async (req, res) => {
    try {
        const {
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            problemcreator,
            refrenceSolution,
        } = req.body;

        // Verify every reference solution using only visible test cases/////////////
        for (const solution of refrenceSolution) {

            const languageId = getLanguageById(solution.language);

            if (!languageId) {
                return res.status(400).json({
                    success: false,
                    message: `${solution.language} is not supported.`,
                });
            }

           console.log(visibleTestCases);

            const submissions = visibleTestCases.map((testCase) => ({
                source_code: solution.completecode,
    language_id: languageId,
    
    stdin: testCase.input,
    expected_output: testCase.output,


        }));
    

console.log(JSON.stringify(submissions, null, 2));



            // Submit to Judge0//////////////////////////////////////////////////////
            const tokenResponse = await submitBatch(submissions);
///////////////////////////////////////// making array 
            const tokens = tokenResponse.map(
                (submission) => submission.token
            );


            // Wait until all submissions finish/////////////////////////
            const testresult = await submitTokens(tokens);

            
           
            for(const test of testresult){
                if(test.status_id !== 3){
                    return res.status(400).json({
                        success: false,
                        message: `Reference solution failed for ${solution.language}.`,
                        results: testresult,
                    });
                }
            }

        }




        // Save problem after all reference solutions pass/////////////////////////////////
        console.log(req.result._id);
        const problem = await Problem.create({
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            problemcreator: req.result._id,
            refrenceSolution,
        });

        return res.status(201).json({
            success: true,
            message: "Problem created successfully.",
            problem,
        });

    } catch (err) {
        console.error(err);

        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};



const updateProblem = async (req, res) => {
    const { id } = req.params;

    const {
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            problemcreator,
            refrenceSolution,
        } = req.body;

    try{

        if(!id){
           return res.status(400).json({
                success: false,
                message: "id is missing.",
            });
        }

        const dsap=await problem.findById(id);

        if(!dsap){
           return res.status(404).json({
                success: false,
                message: "problem not found.",
            });
        }




          for (const solution of refrenceSolution) {

            const languageId = getLanguageById(solution.language);

            if (!languageId) {
                return res.status(400).json({
                    success: false,
                    message: `${solution.language} is not supported.`,
                });
            }

           console.log(visibleTestCases);

            const submissions = visibleTestCases.map((testCase) => ({
                source_code: solution.completecode,
    language_id: languageId,
    
    stdin: testCase.input,
    expected_output: testCase.output,


        }));
    





            // Submit to Judge0//////////////////////////////////////////////////////
            const tokenResponse = await submitBatch(submissions);
///////////////////////////////////////// making array 
            const tokens = tokenResponse.map(
                (submission) => submission.token
            );


            // Wait until all submissions finish/////////////////////////
            const testresult = await submitTokens(tokens);

            console.log(testresult);
            
           
            for(const test of testresult){
                if(test.status_id !== 3){
                    return res.status(400).json({
                        success: false,
                        message: `Reference solution failed for ${solution.language}.`,
                        results: testresult,
                    });
                }
            }

        }

    const update=await problem.findByIdAndUpdate(id, {
           ...req.body
        },{runValidators:true,new:true}
    );
        
        res.status(200).json({
            success: true,
            message: "Problem updated successfully.",
            problem:update,
        });

        


    } catch (err) {
        console.error(err);
        return res.status(404).json({
            success: false,
            message: err.message,
        });
    }


}



const deleteProblem=async (req, res) => {
    const { id } = req.params;
    try{
   if(!id){
    return res.status(400).json({
        success: false,
        message: "id is missing.",
    });
   }

  const deletedprob=await problem.findByIdAndDelete(id);

  if(!deletedprob){
    return res.status(404).json({
        success: false,
        message: "problem is missingg .",
    });
  }



  
  res.status(200).json({
    success: true,
    message: "Problem deleted successfully.",
    problem:deletedprob,
  });

    }
    catch(err){
       console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }

}



const getProblemById=async (req,res)=>{
    const {id}=req.params;
    try{
        if(!id){
             return res.status(400).json({
        success: false,
        message: "id is missing.",
    });
        }

        let getprob=null;
        if(req.result.role==='admin')
            getprob=getprob=await problem.findById(id);
        else{
          getprob=await problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode refrenceSolution'); 
        }
        if(!getprob){
             return res.status(404).json({
        success: false,
        message: "problem is not in the db .",
    });
        }

        const video= await solutionvid.findOne({problemId:id});

        if(video){


const newthing = {
    ...getprob.toObject(),
    secureUrl: video.secureUrl,
    cloudinaryPublicId: video.cloudinaryPublicId,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
};


return      res.status(200).json({
    success: true,
    message: "Problem fetched successfully.",
    problem:newthing,
      
  });
    
  }

      res.status(200).json({
    success: true,
    message: "Problem fetched successfully.",
    problem:getprob,
      
  });


        

    }
    catch(err){
              
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}


const getAllProblems=async (req,res)=>{
   
    try{
   

        const getprob=await problem.find({}).select('_id title difficulty tags');

        if(getprob.length==0){
             return res.status(404).json({
        success: false,
        message: "problem is not in the db .",
    });
        }

        res.status(200).json({
    success: true,
    message: "Problems fetched successfully.",
    problems:getprob,
  });
        

    }
    catch(err){
              
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}



const problemSolvedByUser=async (req,res)=>{    
     try{
        if(!req.result){
            throw new Error("User not authenticated");
        }
        const userId=req.result._id;
        const user=await User.findById(userId).populate({
            path:'problemSolved',
            select:'_id title description difficulty tags'
        });

        res.status(200).json({
            success: true,
            message: "User problems fetched successfully.",
            problems: user.problemSolved,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}



     
     const submitproblem=async (req,res)=>{

        try{
            const userid=req.result._id;
            const probid=req.params.pid;

            const ans = await submissionSchema.find({ userId: userid, problemId: probid });
if (ans.length === 0) {
    return res.status(200).json({ success: true, message: "No submissions found", data: [] });
}




            res.status(200).json({
                success:true,
                message:"Submissions fetched successfully",
                data:ans
            });
              
        }
        catch(err){
              res.status(500).json({
                success:false,
                message:err.message
              });
        }
     }








module.exports = {
    createproblem,
    updateProblem,
    deleteProblem,
    getProblemById,
    getAllProblems,
    problemSolvedByUser,
    submitproblem
};