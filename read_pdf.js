const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('d:/Others/projects/Gym_FitBoch/fitboch/lib/ai/PROM ALIMENTACION.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("--- PDF CONTENT START ---");
    console.log(data.text);
    console.log("--- PDF CONTENT END ---");
}).catch(err => {
    console.error("Error reading PDF:", err);
});
