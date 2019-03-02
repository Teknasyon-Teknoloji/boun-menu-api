# boun-menu-api

API for the BOUN Menu iOS App built for the [BOUN tech summit workshop](https://bountechsummit.com/).

## Problem

Design an simple server to fetch menu meals from the [monlthly meals list](http://www.boun.edu.tr/Assets/Documents/Content/Public/kampus_hayati/yemek_listesi.pdf) for [Boğaziçi Üniversitesi](http://www.boun.edu.tr/)

The server should download, parse, and pre-process the pdf file to convert it a mobile friendly JSON format.

## Technologies

- [Node.js](https://nodejs.org/en/)
- [Express](https://expressjs.com/)

## Setup

> This project requires [Node.js](https://nodejs.org/en/) to build, if you don't have node installed on your device, please refer to installation instructions [here](https://nodejs.org/en/download/).

### Install dependencies

```bash
npm i
```

### Start the local server

```bash
npm start
```

### All Set!

JSON meals list can be access via [localhost:4000/](http://localhost:4000/).

## License

This repo is released under the [MIT License](https://github.com/Teknasyon-Teknoloji/boun-menu-api/blob/master/README.md).