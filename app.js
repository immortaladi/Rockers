// create express server with modular js
import express from 'express';
import bodyParser from 'body-parser';
import { connection, insert } from './server/components/database/index.js';
import { config } from "dotenv"
import { exec } from 'child_process';
import spotify from './server/spotify/index.js';

config()
// create express app
const app = express();

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse requests of content-type - application/json
app.use(bodyParser.json())
// enable cors
app.use((req, res, next) => {
    res.header("Access-Control-Max-Age", "86400")
    res.header("Access-Control-Allow-Origin", req.headers.origin) // restrict it to the required domain
    // res.header("Access-Control-Allow-Origin", origins) // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Methods", "GET,POST")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.header("Access-Control-Allow-Credentials", "true")
    next()
})

// define a simple route
app.get('/',async (req, res) => {
    const result = await insert('songs', {
        sid : '123',
        title : 'test',
        albumID : 1,
        lastPlayed : new Date(),
        albumArt : 'test'.toString('base64'),
        length : 123,
        playCount : 1,
        // pid : 1,
        favourite : true
    });
    res.json({"result": result});
})

app.post('/play', (req, res) => {
    console.log(req.body)
    const url = "https://spotify-downloader.p.rapidapi.com/SpotifyDownloader?url="

    const options = {
        method: "GET",
        headers: {
            "X-RapidAPI-Key": "15be109401msh039dc334993a18cp1b9113jsn7f88dd5900bf",
            "X-RapidAPI-Host": "spotify-downloader.p.rapidapi.com",
        },
    }

    fetch(url + encodeURI(req.body.track.external_urls.spotify), options)
        .then(res => res.json())
        .then(json => {
            exec(`ffplay ${json.audio.url}`).stdout.on("data", data => {
                console.log(data)
            })
            res.json(json)
        })
        .catch(err => console.error("error:" + err))
})

// route to display all songs in html table
app.get('/songs', (req, res) => {
    connection.query('SELECT * FROM songs', (err, result) => {
        if (err) throw err;
        // create html table with data
        let html = '<table border=1|1>';
        html += '<tr>';
        for (let key in result[0]) {
            html += `<th>${key}</th>`;
        }
        html += '</tr>';
        result.forEach(row => {
            html += '<tr>';
            for (let key in row) {
                html += `<td>${row[key]}</td>`;
            }
            html += '</tr>';
        });
        html += '</table>';
        res.send(html);
    });
})

// get song by id
app.get('/search/:query', (req, res) => {
    spotify.searchSong({
        query : req.params.query,
        limit : 10,
        offset : 0,
        type : 'track',
    }).then(data => {
        res.json(data)
    }).catch(err => {
        res.json(err)
    })
    
    // connection.query(`SELECT * FROM songs WHERE sid = '${req.params.id}'`, (err, result) => {
    //     if (err) throw err;
    //     res.json(result);
    // });
})

// listen for requests
app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});