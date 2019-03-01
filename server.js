// server.js

const express = require('express');
const http = require('http');
const fs = require('fs');
const pdf = require('pdf-parse');
const extractor = require('pdf-table-extractor');

const url = 'http://www.boun.edu.tr/Assets/Documents/Content/Public/kampus_hayati/yemek_listesi.pdf';

function pdfFileName() {
    const d = new Date();
    return `${__dirname}/menu_${d.getMonth()}_${d.getFullYear()}.pdf`
}

function preJsonFileName() {
    const d = new Date();
    return `${__dirname}/menu_${d.getMonth()}_${d.getFullYear()}_pre.json`
}

function jsonFileName() {
    const d = new Date();
    return `${__dirname}/menu_${d.getMonth()}_${d.getFullYear()}.json`
}

function fetchPDF(remoteUrl) {
    return new Promise(function(resolve, reject) {
        if (fs.existsSync(pdfFileName())) { // file is already available
            resolve(pdfFileName())
            return;
        }
        const file = fs.createWriteStream(pdfFileName());
        const request = http.get(remoteUrl, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(pdfFileName());
            })
        })
        .on('error', error => {
            reject(error);
        });
    });
}

function dateFromString(string) {
    const pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
    const date = new Date(string.replace(pattern,'$3-$2-$1'));
    return date.getTime() / 1000
}

function generatePreJsonFile(pdfUrl) {
    return new Promise(function(resolve, reject) {
        if (fs.existsSync(preJsonFileName())) { // file is already available
            resolve(preJsonFileName())
            return;
        }
        extractor(pdfUrl, result => {
            let json = {};
            let dataBuffer = fs.readFileSync(pdfUrl);
            pdf(dataBuffer).then(data => {
                json['result'] = result;
                const calories = extractCalories(data.text)
                json['calories'] = calories;
                json = JSON.stringify(json, null, 2);
                fs.writeFileSync(preJsonFileName(), json);
                resolve(preJsonFileName())
            });
        }, error => {
            reject(error);
        });
    });
};

function extractCalories(data) {
    const re1 = /^(?![0-9_])(.*\d+kcal)/mgi;
    const items = data.match(re1);

    let json = {};
    const re2 = /(\d*kcal)/;
    items.forEach(item => {
        const details = item.split(re2);
        json[details[0]] = details[1];
    });
    return json;
}

function generateJsonFile(preJsonUrl) {
    if (fs.existsSync(jsonFileName())) { // file is already available
        return new Promise(function(resolve, _) {
            resolve(jsonFileName())
        });
    }
    const json = JSON.parse(fs.readFileSync(preJsonUrl, 'utf8'));
    const pages = json['result']['pageTables'];

    const date_re = /\d{2}\/\d{2}\/\d{4}/;

    let days = {};

    pages.forEach(page => {
        const tables = page['tables']
        let currentDate;
        let foodCount = 0;

        tables.forEach(table => {
            table.forEach(row => {
                if (!row) {
                    return;
                }
                const date = row.match(date_re);
                if (date) {
                    days[date[0]] = {}
                    currentDate = date[0];
                    foodCount = 0;
                } else {
                    foodCount += 1;
                    if (!currentDate || foodCount > 10) {
                        return;
                    }

                    var food = {
                        'name': row,
                        'calories': json['calories'][row]
                    }

                    const time = foodCount % 2 == 0 ? 'dinner' : 'lunch';
                    if (!days[currentDate][time]) {
                        days[currentDate][time] = [food];
                    } else {
                        days[currentDate][time].push(food);
                    }
                }
                
            });
        });
    });

    let daysArr = [];
    for (const [key, value] of Object.entries(days)) {
        const day = {};
        day['date'] = dateFromString(key);
        day['lunch'] = value['lunch'] || [];
        day['dinner'] = value['dinner'] || [];
        daysArr.push(day);
    }

    return new Promise(function(resolve, reject) {
        let result = JSON.stringify(daysArr, null, 2);
        try {
            fs.writeFileSync(jsonFileName(), result);
            resolve(preJsonFileName())    
        } catch (error) {
            reject(error);
        }
    });
}

const app = express();

app.get('/', function(_, res) {
    fetchPDF(url)
    .then(localUrl => {
        return generatePreJsonFile(localUrl);
    }).then(preJsonUrl => {
        return generateJsonFile(preJsonUrl);
    }).then(jsonUrl => {
        fs.readFile(jsonFileName(), 'utf8', (_, data) => {
            res.send(data);
            res.end(data);
        });
    }).catch(error => {
        res.status(500)
        res.render('error', { error: error })
    });
});

app.listen(process.env.PORT || 4000, function(){
    console.log('Your node js server is running');
});