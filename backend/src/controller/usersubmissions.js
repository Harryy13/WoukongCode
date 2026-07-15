const problem=require('../models/problem'); 
const submission=require('../models/submissions');
const {getLanguageById,submitBatch,submitTokens}=require('../utils/problemsutils');


const submitcode=async(req,res)=>{
    
    try{
        const userid=req.result._id;
        const probid=req.params.id;

        const {code,language}=req.body;

        if(!userid || !probid || !code || !language){
            return res.status(400).json({message:"Missing required fields"});
        }

        const prob=await problem.findById(probid);

        if(!prob){
            return res.status(404).json({message:"Problem not found"});
        }

        const newSubmission=await submission.create({
            userId:userid,
            problemId:probid,
            code,
            language,
            status:"pending",
            
            totalTestCases:prob.hiddenTestCases.length

        });

        const languageId = getLanguageById(language);

           const submissions = prob.hiddenTestCases.map((testCase) => ({
                source_code: code,
    language_id: languageId,
    
    stdin: testCase.input,
    expected_output: testCase.output,


        }));


        const tokenResponse = await submitBatch(submissions);

        const tokens = tokenResponse.map(
                (submission) => submission.token
            );

            const testresult = await submitTokens(tokens);


let testcases=0;
let status="accepted";
let runtime=0;
let memory=0;
let errorMessage=null;

for(const test of testresult){
    if(test.status_id==3){
        testcases++;
        runtime=runtime+parseFloat(test.time);
        memory=Math.max(memory,test.memory);
        status="accepted";
        console.log("testcases passed: "+test.stdin); 
    }else{
        if(test.status_id==4){
            console.log("testcases failed: "+test.stdin);
            status="error";
            errorMessage=test.stderr;
            break;
        }
        else{
            console.log("testcases failed: "+test.stdin);
            errorMessage=test.stderr;
            status="wrong";
            break;
        }
    }
}

newSubmission.status=status;
newSubmission.testCasesPassed=testcases;
newSubmission.runtime=runtime;
newSubmission.memory=memory;
newSubmission.errorMessage=errorMessage;

await newSubmission.save();


if(!req.result.problemSolved.includes(probid) && status==="accepted"){
    req.result.problemSolved.push(probid);
    await req.result.save();
}

const accepted=(status=='accepted');
res.status(200).json({
    accepted,
    totalTestCases:newSubmission.totalTestCases,
    passedTestCases:testcases,
    runtime,
    memory,
    errorMessage
});
    }

    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal server error"});
    }


}


const runcode = async (req, res) => {
    try {
        const userid = req.result._id;
        const probid = req.params.id;
 
        const { code, language } = req.body;
 
        if (!userid || !probid || !code || !language) {
            return res.status(400).json({ message: "Missing required fields" });
        }
 
        const prob = await problem.findById(probid);
 
        if (!prob) {
            return res.status(404).json({ message: "Problem not found" });
        }
 
        const languageId = getLanguageById(language);
 
        const submissions = prob.visibleTestCases.map((testCase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output,
        }));
 
        const tokenResponse = await submitBatch(submissions);
        const tokens = tokenResponse.map((s) => s.token);
        const testresult = await submitTokens(tokens);
 
        
        const testCaseResults = testresult.map((test, idx) => {
            const passed = test.status_id === 3; // 3 = Accepted in Judge0
            return {
                input: prob.visibleTestCases[idx]?.input,
                expectedOutput: prob.visibleTestCases[idx]?.output,
                actualOutput: test.stdout ?? '',
                passed,
                // status_id 6 = Compilation Error, 5 = Time Limit Exceeded, etc.
                // stderr covers runtime errors, compile_output covers compile errors.
                errorMessage: passed ? null : (test.stderr || test.compile_output || null),
                statusDescription: test.status?.description || (passed ? 'Accepted' : 'Wrong Answer'),
            };
        });
 
        let testcases = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
 
        for (const result of testCaseResults) {
            if (result.passed) {
                testcases++;
            } else if (status === 'accepted') {
                // Distinguish a genuine runtime/compile error from a plain wrong answer
                status = result.errorMessage ? 'error' : 'wrong';
            }
        }
        for (const test of testresult) {
            runtime += parseFloat(test.time) || 0;
            memory = Math.max(memory, test.memory || 0);
        }
 
        res.status(200).json({
            success: status,
            testCase: testcases,
            runtime,
            memory,
            testCaseResults,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports={submitcode,runcode};
