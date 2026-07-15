const axios = require("axios");




const wait = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));



const getLanguageById = (lang) => {
  const languages = {
    "c++": 54,
    "java": 62,
    "javascript": 63,
    "python": 71,
  };

  return languages[lang?.toLowerCase()] || null;
};

const submitBatch = async (submissions) => {

  

const options = {
  method: "POST",
  url: "https://ce.judge0.com/submissions/batch",
  params: {
    base64_encoded: "false",
    
  },
  headers: {
    "Content-Type": "application/json",
  },
  data: {
    submissions

  },
};



async function fetchData() {
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

return await fetchData();


}


const submitTokens = async (tokens) => {


const options = {
  method: "GET",
  url: "https://ce.judge0.com/submissions/batch",
  params: {
    tokens:
      tokens.join(","),
    base64_encoded: "false",
    fields: "*",
  },
  headers: {
    "Content-Type": "application/json",
  },
};

async function fetchData() {
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

while(true){

const result = await fetchData();

const isresultObtained = result.submissions.every(
    submission => submission.status_id > 2
);

if (isresultObtained) {
    return result.submissions;
}

await wait(1000);

}

}


module.exports = {
  getLanguageById,
  submitBatch,
  submitTokens,
  
};

